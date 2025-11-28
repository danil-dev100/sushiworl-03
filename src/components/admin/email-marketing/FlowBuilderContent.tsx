'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Node, Edge } from 'reactflow';
import FlowEditor from './FlowEditor';
import NodePalette from './NodePalette';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

type EmailAutomation = {
  id: string;
  name: string;
  description?: string | null;
  flow?: unknown;
  isActive: boolean;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
};

interface FlowBuilderContentProps {
  automation: EmailAutomation;
  templates: EmailTemplate[];
  currentUser: {
    id: string;
    role: string;
  };
}

export default function FlowBuilderContent({ automation, templates }: FlowBuilderContentProps) {
  const router = useRouter();
  const [name, setName] = useState(automation.name);
  const [description, setDescription] = useState(automation.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const initialFlow = automation.flow as { nodes: Node[]; edges: Edge[] } | null;
  const [nodes, setNodes] = useState<Node[]>(initialFlow?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(initialFlow?.edges || []);

  const handleAddNode = useCallback((nodeTemplate: any) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: nodeTemplate.type,
      position: { x: 250, y: nodes.length * 100 + 50 },
      data: {
        label: nodeTemplate.label,
        ...nodeTemplate.data,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length]);

  const handleSave = useCallback(async (updatedNodes: Node[], updatedEdges: Edge[]) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/marketing/email/automations/${automation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          flow: {
            nodes: updatedNodes,
            edges: updatedEdges,
          },
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      toast.success('Automação salva com sucesso!');
      router.refresh();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar automação');
    } finally {
      setIsSaving(false);
    }
  }, [automation.id, name, description, router]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-[#2a1e14] border-b border-[#e5d5b5] dark:border-[#3d2e1f] p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/marketing/email')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave(nodes, edges)}
            disabled={isSaving}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome da Automação
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boas-vindas novos clientes"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descrição (opcional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta automação..."
              className="mt-1"
              rows={1}
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex">
        <NodePalette onAddNode={handleAddNode} />
        <FlowEditor
          initialNodes={nodes}
          initialEdges={edges}
          onSave={handleSave}
          onNodeClick={(node) => {
            console.log('Node clicked:', node);
            // Aqui você pode abrir um modal para editar o nó
          }}
        />
      </div>
    </div>
  );
}

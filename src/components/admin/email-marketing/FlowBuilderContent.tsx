'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Node, Edge } from 'reactflow';
import FlowCanvas from './FlowCanvas';
import NodePalette from './NodePalette';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Settings } from 'lucide-react';
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

  const initialFlow = automation.flow as { nodes: Node[]; edges: Edge[] } | null;
  const [nodes, setNodes] = useState<Node[]>(initialFlow?.nodes || []);

  const handleAddNode = useCallback(
    (nodeTemplate: any) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: nodeTemplate.type,
        position: { x: 250, y: nodes.length * 120 + 100 },
        data: {
          label: nodeTemplate.label,
          ...nodeTemplate.data,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      toast.success(`Nó "${nodeTemplate.label}" adicionado`);
    },
    [nodes.length]
  );

  const handleSave = useCallback(
    async (updatedNodes: Node[], updatedEdges: Edge[], isActive: boolean) => {
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
            isActive,
            isDraft: false,
          }),
        });

        if (!response.ok) throw new Error('Erro ao salvar');

        toast.success('Automação salva com sucesso!');
        router.refresh();
      } catch (error) {
        console.error('Erro ao salvar:', error);
        toast.error('Erro ao salvar automação');
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [automation.id, name, description, router]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-[#2a1e14] border-b border-[#e5d5b5] dark:border-[#3d2e1f] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/marketing/email')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="border-l border-gray-300 pl-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Nome da automação"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/marketing/email/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              SMTP
            </Button>
          </div>
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-sm text-gray-500 border-gray-200 resize-none"
          placeholder="Descrição desta automação (opcional)"
          rows={1}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        <NodePalette onAddNode={handleAddNode} />
        <FlowCanvas
          initialNodes={nodes}
          initialEdges={edges}
          onSave={handleSave}
          templates={templates}
          flowId={automation.id}
          initialIsActive={automation.isActive}
        />
      </div>
    </div>
  );
}

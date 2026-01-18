'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Panel,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Importação dos componentes
import TriggerNode from './nodes/TriggerNode';
import SmsNode from './nodes/SmsNode';
import DelayNode from './nodes/DelayNode';
import ConditionNode from './nodes/ConditionNode';
import SmsNodePalette from './SmsNodePalette';
import SmsNodeConfigPanel from './SmsNodeConfigPanel';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Copy,
  Settings,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  sms: SmsNode,
  delay: DelayNode,
  condition: ConditionNode,
};

interface SmsFlowBuilderProps {
  automationId: string;
  initialAutomation?: any;
  onAutomationChange?: (automation: any) => void;
}

function SmsFlowBuilderInner({
  automationId,
  initialAutomation,
  onAutomationChange
}: SmsFlowBuilderProps) {
  const router = useRouter();
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Estado da automação
  const [automationName, setAutomationName] = useState(initialAutomation?.name || 'Nova Automação SMS');
  const [automationDescription, setAutomationDescription] = useState(initialAutomation?.description || '');
  const [isActive, setIsActive] = useState(initialAutomation?.isActive || false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState(initialAutomation?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialAutomation?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // Estado para conexão por click
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handleType: 'source' | 'target' } | null>(null);

  // Validações
  const hasValidTrigger = useMemo(() => {
    return nodes.some((node) => node.type === 'trigger');
  }, [nodes]);

  const hasOrphanNodes = useMemo(() => {
    if (nodes.length === 0) return false;
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    return nodes.some((node) => !connectedNodeIds.has(node.id) && node.type !== 'trigger');
  }, [nodes, edges]);

  // Estilo padrão das edges
  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#10B981',
    },
    style: {
      strokeWidth: 2,
      stroke: '#10B981',
    },
  };

  // Conectar nós
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, ...defaultEdgeOptions };
      setEdges((eds) => addEdge(newEdge, eds));
      toast.success('Conexão criada');
    },
    [setEdges]
  );

  // Salvar automação
  const handleSave = useCallback(async () => {
    if (!hasValidTrigger) {
      toast.error('Adicione pelo menos um gatilho à automação');
      return;
    }

    if (hasOrphanNodes) {
      toast.warning('Alguns nós não estão conectados');
    }

    setIsSaving(true);
    try {
      const automationData = {
        name: automationName.trim() || 'Nova Automação SMS',
        description: automationDescription.trim(),
        nodes,
        edges,
        isActive,
        triggerType: nodes.find(n => n.type === 'trigger')?.data?.eventType || null,
      };

      const url = automationId === 'new'
        ? '/api/sms/automations'
        : `/api/sms/automations/${automationId}`;

      const method = automationId === 'new' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar automação');
      }

      const result = await response.json();

      toast.success('Automação salva com sucesso!');

      // Se era nova, redirecionar para o ID criado
      if (automationId === 'new' && result.automation?.id) {
        router.push(`/admin/marketing/sms-marketing/builder/${result.automation.id}`);
      }

      onAutomationChange?.(result.automation);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar automação');
    } finally {
      setIsSaving(false);
    }
  }, [automationId, automationName, automationDescription, nodes, edges, isActive, hasValidTrigger, hasOrphanNodes, router, onAutomationChange]);

  // Ativar/Desativar automação
  const toggleActive = useCallback(() => {
    if (!hasValidTrigger) {
      toast.error('Configure um gatilho antes de ativar');
      return;
    }
    setIsActive(!isActive);
    toast.success(isActive ? 'Automação desativada' : 'Automação ativada');
  }, [isActive, hasValidTrigger]);

  // Selecionar nó
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (_event.button === 2 || !_event.shiftKey) {
      setSelectedNode(node);
      return;
    }

    // Shift + Click = Modo de conexão
    if (!connectionStart) {
      setConnectionStart({ nodeId: node.id, handleType: 'source' });
      toast.info(`Conexão iniciada. Shift + Click em outro nó para conectar.`);
    } else {
      if (connectionStart.nodeId === node.id) {
        toast.error('Não é possível conectar um nó a si mesmo');
        setConnectionStart(null);
        return;
      }

      const newEdge = {
        id: `edge-${connectionStart.nodeId}-${node.id}`,
        source: connectionStart.nodeId,
        target: node.id,
        ...defaultEdgeOptions,
      };

      setEdges((eds) => [...eds, newEdge]);
      toast.success('Nós conectados!');
      setConnectionStart(null);
    }
  }, [connectionStart, setEdges, defaultEdgeOptions]);

  // Atualizar nó
  const handleUpdateNode = useCallback(
    async (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
      toast.success('Nó atualizado');
    },
    [setNodes]
  );

  // Adicionar nó
  const handleAddNode = useCallback(
    (nodeTemplate: any) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: nodeTemplate.type,
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 200 + 100
        },
        data: {
          label: nodeTemplate.label,
          ...nodeTemplate.data,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      toast.success(`Nó "${nodeTemplate.label}" adicionado`);
    },
    [setNodes]
  );

  // Deletar nós selecionados
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0) {
      toast.error('Selecione nós para deletar');
      return;
    }

    setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)));
    setEdges((eds) =>
      eds.filter((edge) => !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target))
    );
    setSelectedNodes([]);
    toast.success(`${selectedNodes.length} nó(s) deletado(s)`);
  }, [selectedNodes, setNodes, setEdges]);

  // Duplicar nós selecionados
  const handleDuplicateSelected = useCallback(() => {
    if (selectedNodes.length === 0) {
      toast.error('Selecione nós para duplicar');
      return;
    }

    const nodesToDuplicate = nodes.filter((node) => selectedNodes.includes(node.id));
    const newNodes = nodesToDuplicate.map((node) => ({
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: { ...node.data },
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    toast.success(`${newNodes.length} nó(s) duplicado(s)`);
  }, [selectedNodes, nodes, setNodes]);

  // Controles de zoom
  const handleZoomIn = () => reactFlowInstance.zoomIn();
  const handleZoomOut = () => reactFlowInstance.zoomOut();
  const handleFitView = () => reactFlowInstance.fitView({ padding: 0.2 });

  // Seleção múltipla
  const onSelectionChange = useCallback((params: any) => {
    setSelectedNodes(params.nodes.map((node: Node) => node.id));
  }, []);

  // Duplo clique na edge para desconectar
  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    const confirmDelete = window.confirm('Deseja desconectar estes nós?');
    if (confirmDelete) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      toast.success('Conexão removida');
    }
  }, [setEdges]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-[#2a1e14] border-b border-[#e5d5b5] dark:border-[#3d2e1f] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/marketing/sms-marketing')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="border-l border-gray-300 pl-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <Input
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Nome da automação"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/marketing/sms-marketing/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        <Textarea
          value={automationDescription}
          onChange={(e) => setAutomationDescription(e.target.value)}
          className="text-sm text-gray-500 border-gray-200 resize-none"
          placeholder="Descrição desta automação (opcional)"
          rows={1}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        <SmsNodePalette onAddNode={handleAddNode} />
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onSelectionChange={onSelectionChange}
            onEdgeDoubleClick={onEdgeDoubleClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            attributionPosition="bottom-left"
            minZoom={0.1}
            maxZoom={2}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
          >
            <Background color="#10B981" gap={16} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-gray-50 dark:bg-gray-800"
            />

            {/* Toolbar Superior */}
            <Panel position="top-left" className="flex items-center gap-2 bg-white dark:bg-[#2a1e14] p-2 rounded-lg shadow-lg border border-green-200">
              <div className="flex items-center gap-2 pr-2 border-r border-gray-300">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {nodes.length} nós
                </span>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {edges.length} conexões
                </span>
              </div>

              {selectedNodes.length > 0 && (
                <div className="flex items-center gap-1 pl-2 border-l border-gray-300">
                  <Button variant="outline" size="sm" onClick={handleDuplicateSelected}>
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Deletar
                  </Button>
                </div>
              )}
            </Panel>

            {/* Toolbar Direita */}
            <Panel position="top-right" className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                className="bg-white hover:bg-gray-100"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                className="bg-white hover:bg-gray-100"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFitView}
                className="bg-white hover:bg-gray-100"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </Panel>

            {/* Toolbar Inferior */}
            <Panel position="bottom-center" className="flex items-center gap-2 bg-white dark:bg-[#2a1e14] p-3 rounded-lg shadow-lg border border-green-200">
              {connectionStart && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full mr-2 animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Shift + Click em outro nó para conectar</span>
                  <button
                    onClick={() => setConnectionStart(null)}
                    className="ml-2 text-green-800 hover:text-green-900"
                  >
                    ✕
                  </button>
                </div>
              )}

              {!hasValidTrigger && !connectionStart && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full mr-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Adicione um gatilho</span>
                </div>
              )}

              {hasOrphanNodes && !connectionStart && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full mr-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Nós desconectados</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={toggleActive}
                className={isActive ? 'bg-green-50 border-green-500 text-green-700' : ''}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Ativo
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Inativo
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasValidTrigger || isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </Panel>
          </ReactFlow>

          {/* Painel de Configuração */}
          {selectedNode && (
            <SmsNodeConfigPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleUpdateNode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper com ReactFlowProvider
export default function SmsFlowBuilder(props: SmsFlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <SmsFlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}

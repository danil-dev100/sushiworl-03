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
import EmailNode from './nodes/EmailNode';
import DelayNode from './nodes/DelayNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import NodePalette from './NodePalette';
import NodeConfigPanel from './NodeConfigPanel';

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
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
};

interface FlowBuilderProps {
  flowId: string;
  initialFlow?: any;
  templates?: any[];
  onFlowChange?: (flow: any) => void;
}

function FlowBuilderInner({
  flowId,
  initialFlow,
  templates = [],
  onFlowChange
}: FlowBuilderProps) {
  const router = useRouter();
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Estado do fluxo
  const [flowName, setFlowName] = useState(initialFlow?.name || 'Novo Fluxo');
  const [flowDescription, setFlowDescription] = useState(initialFlow?.description || '');
  const [isActive, setIsActive] = useState(initialFlow?.isActive || false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.flow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.flow?.edges || []);
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

  // Estilo padrão das edges (conexões)
  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#FF6B00',
    },
    style: {
      strokeWidth: 2,
      stroke: '#FF6B00',
    },
  };

  // Conectar nós
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, ...defaultEdgeOptions };
      setEdges((eds) => addEdge(newEdge, eds));
      toast.success('Conexão criada');

      // Salvar automaticamente o fluxo após criar conexão
      setTimeout(async () => {
        try {
          const updatedEdges = [...edges, newEdge];

          const flowData = {
            name: flowName.trim() || 'Novo Fluxo',
            description: flowDescription.trim(),
            flow: {
              nodes,
              edges: updatedEdges,
            },
            isActive,
            isDraft: false,
          };

          if (flowId !== 'new') {
            const response = await fetch(`/api/email-marketing/flows/${flowId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(flowData),
            });

            if (!response.ok) {
              throw new Error('Erro ao salvar conexão');
            }

            console.log('[FlowBuilder] Conexão salva automaticamente');
          }
        } catch (error) {
          console.error('[FlowBuilder] Erro ao salvar conexão:', error);
        }
      }, 500);
    },
    [setEdges, edges, nodes, flowId, flowName, flowDescription, isActive]
  );

  // Salvar fluxo
  const handleSave = useCallback(async () => {
    if (!hasValidTrigger) {
      toast.error('Adicione pelo menos um gatilho ao fluxo');
      return;
    }

    if (hasOrphanNodes) {
      toast.warning('Alguns nós não estão conectados');
    }

    setIsSaving(true);
    try {
      const flowData = {
        name: flowName.trim() || 'Novo Fluxo',
        description: flowDescription.trim(),
        flow: {
          nodes,
          edges,
        },
        isActive,
        isDraft: false,
      };

      const url = flowId === 'new'
        ? '/api/email-marketing/flows'
        : `/api/email-marketing/flows/${flowId}`;

      const method = flowId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar fluxo');
      }

      const result = await response.json();

      toast.success('Fluxo salvo com sucesso!');

      // Se era novo, redirecionar para o ID criado
      if (flowId === 'new' && result.flow?.id) {
        router.push(`/admin/marketing/email-marketing/builder/${result.flow.id}`);
      }

      onFlowChange?.(result.flow);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  }, [flowId, flowName, flowDescription, nodes, edges, isActive, hasValidTrigger, hasOrphanNodes, router, onFlowChange]);

  // Ativar/Desativar fluxo
  const toggleActive = useCallback(() => {
    if (!hasValidTrigger) {
      toast.error('Configure um gatilho antes de ativar');
      return;
    }
    setIsActive(!isActive);
    toast.success(isActive ? 'Fluxo desativado' : 'Fluxo ativado');
  }, [isActive, hasValidTrigger]);

  // Selecionar nó + Conexão por click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Se estiver em modo de configuração (botão direito ou normal), abre painel
    if (_event.button === 2 || !_event.shiftKey) {
      setSelectedNode(node);
      return;
    }

    // Shift + Click = Modo de conexão
    if (!connectionStart) {
      // Primeiro click: iniciar conexão
      setConnectionStart({ nodeId: node.id, handleType: 'source' });
      toast.info(`Conexão iniciada de "${node.data.label}". Clique + Shift em outro nó para conectar.`);
    } else {
      // Segundo click: completar conexão
      if (connectionStart.nodeId === node.id) {
        toast.error('Não é possível conectar um nó a si mesmo');
        setConnectionStart(null);
        return;
      }

      // Criar a conexão
      const newEdge = {
        id: `edge-${connectionStart.nodeId}-${node.id}`,
        source: connectionStart.nodeId,
        target: node.id,
        ...defaultEdgeOptions,
      };

      setEdges((eds) => [...eds, newEdge]);
      toast.success('Nós conectados!');
      setConnectionStart(null);

      // Salvar automaticamente após criar conexão via Shift+Click
      setTimeout(async () => {
        try {
          const updatedEdges = [...edges, newEdge];

          const flowData = {
            name: flowName.trim() || 'Novo Fluxo',
            description: flowDescription.trim(),
            flow: {
              nodes,
              edges: updatedEdges,
            },
            isActive,
            isDraft: false,
          };

          if (flowId !== 'new') {
            const response = await fetch(`/api/email-marketing/flows/${flowId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(flowData),
            });

            if (!response.ok) {
              throw new Error('Erro ao salvar conexão');
            }

            console.log('[FlowBuilder] Conexão Shift+Click salva automaticamente');
          }
        } catch (error) {
          console.error('[FlowBuilder] Erro ao salvar conexão:', error);
        }
      }, 500);
    }
  }, [connectionStart, setEdges, defaultEdgeOptions, edges, nodes, flowId, flowName, flowDescription, isActive]);

  // Atualizar nó
  const handleUpdateNode = useCallback(
    async (nodeId: string, data: any) => {
      // Atualizar o nó localmente
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
      toast.success('Nó atualizado');

      // Salvar automaticamente o fluxo completo (incluindo conexões) após 500ms
      // O timeout permite que o estado seja atualizado antes de salvar
      setTimeout(async () => {
        try {
          const updatedNodes = nodes.map((node) => {
            if (node.id === nodeId) {
              return { ...node, data: { ...node.data, ...data } };
            }
            return node;
          });

          const flowData = {
            name: flowName.trim() || 'Novo Fluxo',
            description: flowDescription.trim(),
            flow: {
              nodes: updatedNodes,
              edges,
            },
            isActive,
            isDraft: false,
          };

          if (flowId !== 'new') {
            const response = await fetch(`/api/email-marketing/flows/${flowId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(flowData),
            });

            if (!response.ok) {
              throw new Error('Erro ao salvar automaticamente');
            }

            console.log('[FlowBuilder] Fluxo salvo automaticamente após atualizar nó');
          }
        } catch (error) {
          console.error('[FlowBuilder] Erro ao salvar automaticamente:', error);
          // Não exibir erro para o usuário, pois é um salvamento automático
        }
      }, 500);
    },
    [setNodes, nodes, edges, flowId, flowName, flowDescription, isActive]
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

  // Carregar template de fluxo completo
  const handleLoadFlowTemplate = useCallback(
    (flowTemplate: any) => {
      if (!flowTemplate.flow || !flowTemplate.flow.nodes) {
        toast.error('Template inválido');
        return;
      }

      // Confirmar se usuário quer substituir o fluxo atual
      if (nodes.length > 0 || edges.length > 0) {
        const confirmed = window.confirm(
          'Isso irá substituir o fluxo atual. Deseja continuar?'
        );
        if (!confirmed) return;
      }

      // Carregar nós e edges do template
      setNodes(flowTemplate.flow.nodes || []);
      setEdges(flowTemplate.flow.edges || []);
      setFlowName(flowTemplate.name);
      setFlowDescription(flowTemplate.description || '');

      // Ajustar visualização para mostrar todos os nós
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    },
    [nodes.length, edges.length, setNodes, setEdges, reactFlowInstance]
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
    const confirmDelete = window.confirm(
      'Deseja desconectar estes nós?'
    );

    if (confirmDelete) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      toast.success('Conexão removida');

      // Salvar automaticamente após remover conexão
      setTimeout(async () => {
        try {
          const updatedEdges = edges.filter((e) => e.id !== edge.id);

          const flowData = {
            name: flowName.trim() || 'Novo Fluxo',
            description: flowDescription.trim(),
            flow: {
              nodes,
              edges: updatedEdges,
            },
            isActive,
            isDraft: false,
          };

          if (flowId !== 'new') {
            const response = await fetch(`/api/email-marketing/flows/${flowId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(flowData),
            });

            if (!response.ok) {
              throw new Error('Erro ao salvar após remover conexão');
            }

            console.log('[FlowBuilder] Conexão removida e salva automaticamente');
          }
        } catch (error) {
          console.error('[FlowBuilder] Erro ao salvar após remover conexão:', error);
        }
      }, 500);
    }
  }, [setEdges, edges, nodes, flowId, flowName, flowDescription, isActive]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-[#2a1e14] border-b border-[#e5d5b5] dark:border-[#3d2e1f] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/marketing/email-marketing')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="border-l border-gray-300 pl-4">
              <Input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Nome do fluxo"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/marketing/email-marketing/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              SMTP
            </Button>
          </div>
        </div>

        <Textarea
          value={flowDescription}
          onChange={(e) => setFlowDescription(e.target.value)}
          className="text-sm text-gray-500 border-gray-200 resize-none"
          placeholder="Descrição deste fluxo (opcional)"
          rows={1}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        <NodePalette onAddNode={handleAddNode} onLoadFlowTemplate={handleLoadFlowTemplate} />
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
            <Background color="#e5d5b5" gap={16} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-gray-50 dark:bg-gray-800"
            />

            {/* Toolbar Superior */}
            <Panel position="top-left" className="flex items-center gap-2 bg-white dark:bg-[#2a1e14] p-2 rounded-lg shadow-lg border border-[#e5d5b5]">
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
            <Panel position="bottom-center" className="flex items-center gap-2 bg-white dark:bg-[#2a1e14] p-3 rounded-lg shadow-lg border border-[#e5d5b5]">
              {connectionStart && (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full mr-2 animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Shift + Click em outro nó para conectar</span>
                  <button
                    onClick={() => setConnectionStart(null)}
                    className="ml-2 text-blue-800 hover:text-blue-900"
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
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Fluxo'}
              </Button>
            </Panel>
          </ReactFlow>

          {/* Painel de Configuração */}
          {selectedNode && (
            <NodeConfigPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleUpdateNode}
              templates={templates}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper com ReactFlowProvider
export default function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}


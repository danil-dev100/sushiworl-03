'use client';

import { useCallback, useState, useMemo, useRef } from 'react';
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
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import EmailNode from './nodes/EmailNode';
import DelayNode from './nodes/DelayNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import NodeConfigPanel from './NodeConfigPanel';

import { Button } from '@/components/ui/button';
import { Save, Play, Pause, ZoomIn, ZoomOut, Maximize2, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface FlowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[], isActive: boolean) => Promise<void>;
  templates?: Array<{ id: string; name: string; subject: string }>;
  flowId?: string;
  initialIsActive?: boolean;
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
};

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

function FlowCanvasInner({
  initialNodes = [],
  initialEdges = [],
  onSave,
  templates = [],
  flowId,
  initialIsActive = false,
}: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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

  // Conectar nós
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
      toast.success('Conexão criada');
    },
    [setEdges]
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
      if (onSave) {
        await onSave(nodes, edges, isActive);
        toast.success('Fluxo salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, isActive, hasValidTrigger, hasOrphanNodes, onSave]);

  // Ativar/Desativar fluxo
  const toggleActive = useCallback(() => {
    if (!hasValidTrigger) {
      toast.error('Configure um gatilho antes de ativar');
      return;
    }
    setIsActive(!isActive);
    toast.success(isActive ? 'Fluxo desativado' : 'Fluxo ativado');
  }, [isActive, hasValidTrigger]);

  // Selecionar nó
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Atualizar nó
  const handleUpdateNode = useCallback(
    (nodeId: string, data: any) => {
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

  return (
    <div ref={reactFlowWrapper} className="h-full w-full flex">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onSelectionChange={onSelectionChange}
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
          {!hasValidTrigger && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full mr-2">
              ⚠️ Adicione um gatilho
            </span>
          )}

          {hasOrphanNodes && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full mr-2">
              ⚠️ Nós desconectados
            </span>
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
  );
}

// Wrapper com ReactFlowProvider
export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

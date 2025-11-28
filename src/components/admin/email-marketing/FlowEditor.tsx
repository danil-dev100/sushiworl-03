'use client';

import { useCallback, useMemo, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import EmailNode from './nodes/EmailNode';
import DelayNode from './nodes/DelayNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import { Button } from '@/components/ui/button';
import { Save, Play, Pause } from 'lucide-react';

interface FlowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onNodeClick?: (node: Node) => void;
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
};

export default function FlowEditor({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onNodeClick,
}: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isActive, setIsActive] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Validar se o fluxo tem pelo menos um gatilho
  const hasValidTrigger = useMemo(() => {
    return nodes.some((node) => node.type === 'trigger');
  }, [nodes]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-[#2a1e14] border-b border-[#e5d5b5] dark:border-[#3d2e1f] p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
            Editor de Fluxo
          </h3>
          {!hasValidTrigger && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              ⚠️ Adicione um gatilho para começar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsActive(!isActive)}
            className={isActive ? 'bg-green-50 border-green-500' : ''}
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
            disabled={!hasValidTrigger}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Fluxo
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-gray-50"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

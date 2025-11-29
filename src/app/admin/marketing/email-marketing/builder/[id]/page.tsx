'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ReactFlowProvider,
  NodeTypes,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import custom node components
import TriggerNode from '@/components/admin/email-marketing/nodes/TriggerNode';
import EmailNode from '@/components/admin/email-marketing/nodes/EmailNode';
import DelayNode from '@/components/admin/email-marketing/nodes/DelayNode';
import ConditionNode from '@/components/admin/email-marketing/nodes/ConditionNode';
import ActionNode from '@/components/admin/email-marketing/nodes/ActionNode';

// Node types mapping (defined outside component for stability)
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
};

// Node templates for palette
const nodeTemplates = [
  {
    type: 'trigger',
    label: 'Novo Pedido',
    description: 'Dispara quando um novo pedido é confirmado',
    icon: '⚡',
    color: '#FF6B00',
    data: {
      eventType: 'order_created',
      filters: {}
    }
  },
  {
    type: 'trigger',
    label: 'Carrinho Abandonado',
    description: 'Dispara quando um carrinho é abandonado',
    icon: '🕐',
    color: '#FF6B00',
    data: {
      eventType: 'cart_abandoned',
      waitMinutes: 60,
      filters: {}
    }
  },
  {
    type: 'trigger',
    label: 'Novo Cadastro',
    description: 'Dispara quando um usuário se registra',
    icon: '👤',
    color: '#FF6B00',
    data: {
      eventType: 'user_registered',
      filters: {}
    }
  },
  {
    type: 'email',
    label: 'Enviar Email',
    description: 'Envia um email personalizado',
    icon: '✉️',
    color: '#10B981',
    data: {
      templateId: '',
      templateName: '',
      subject: '',
      customContent: '',
    }
  },
  {
    type: 'delay',
    label: 'Atraso',
    description: 'Pausa o fluxo por um período',
    icon: '⏱️',
    color: '#F59E0B',
    data: {
      delayValue: 1,
      delayType: 'hours',
    }
  },
  {
    type: 'condition',
    label: 'Condição',
    description: 'Verifica uma condição e divide o fluxo',
    icon: '🔀',
    color: '#8B5CF6',
    data: {
      conditionType: 'order_value',
      operator: 'greater_than',
      value: '50',
    }
  },
  {
    type: 'action',
    label: 'Ação',
    description: 'Executa uma ação no sistema',
    icon: '⚙️',
    color: '#EF4444',
    data: {
      actionType: 'update_tags',
      tags: [],
    }
  },
];

function FlowBuilderInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState('Novo Fluxo de Email');
  const [flowDescription, setFlowDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { screenToFlowPosition } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const templateData = event.dataTransfer.getData('application/reactflow/template');

      if (typeof templateData === 'undefined' || !templateData) {
        return;
      }

      const template = JSON.parse(templateData);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${nodes.length + 1}`,
        type: template.type,
        position,
        data: { ...template.data, label: template.label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, nodes.length, setNodes]
  );

  const onDragStart = (event: React.DragEvent, template: any) => {
    event.dataTransfer.setData('application/reactflow/template', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = useCallback(async () => {
    if (!nodes.some(node => node.type === 'trigger')) {
      alert('Adicione pelo menos um gatilho ao fluxo');
      return;
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

      console.log('Salvando fluxo:', flowData);
      alert('Fluxo salvo com sucesso! (Implementação completa da API será feita em seguida)');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  }, [flowName, flowDescription, nodes, edges, isActive]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedNode) return;

    const duplicatedNode: Node = {
      ...selectedNode,
      id: `${nodes.length + 1}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      },
    };

    setNodes((nds) => [...nds, duplicatedNode]);
  }, [selectedNode, nodes.length, setNodes]);

  const toggleActive = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/admin/marketing/email'}
              className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
            >
              ← Voltar
            </button>
            <div>
              <input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="text-xl font-bold border-none bg-transparent focus:outline-none"
                placeholder="Nome do fluxo"
              />
              <input
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                className="text-sm text-gray-600 border-none bg-transparent focus:outline-none"
                placeholder="Descrição do fluxo"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-sm ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {isActive ? 'Ativo' : 'Rascunho'}
            </span>

            <button
              onClick={toggleActive}
              className={`px-3 py-1 rounded text-sm ${isActive ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
            >
              {isActive ? 'Desativar' : 'Ativar'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#FF6B00] text-white px-4 py-2 rounded hover:bg-[#FF6B00]/90 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">📦 Componentes</h3>

          <div className="space-y-3">
            {/* Trigger Nodes */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gatilhos</h4>
              <div className="space-y-2">
                {nodeTemplates.filter(t => t.type === 'trigger').map((template) => (
                  <div
                    key={`${template.type}-${template.label}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, template)}
                    className="p-3 border border-orange-200 bg-orange-50 rounded-lg cursor-move hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg text-white text-sm"
                        style={{ backgroundColor: template.color }}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{template.label}</p>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Nodes */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ações</h4>
              <div className="space-y-2">
                {nodeTemplates.filter(t => t.type === 'email' || t.type === 'delay').map((template) => (
                  <div
                    key={`${template.type}-${template.label}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, template)}
                    className="p-3 border border-green-200 bg-green-50 rounded-lg cursor-move hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg text-white text-sm"
                        style={{ backgroundColor: template.color }}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{template.label}</p>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logic Nodes */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Lógica</h4>
              <div className="space-y-2">
                {nodeTemplates.filter(t => t.type === 'condition' || t.type === 'action').map((template) => (
                  <div
                    key={`${template.type}-${template.label}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, template)}
                    className={`p-3 border rounded-lg cursor-move hover:opacity-80 transition-colors ${
                      template.type === 'condition' ? 'border-purple-200 bg-purple-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg text-white text-sm"
                        style={{ backgroundColor: template.color }}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{template.label}</p>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

            {/* Action Panel */}
            {selectedNode && (
              <div className="absolute top-4 right-4 flex gap-2 bg-white rounded-lg shadow-md p-2">
                <button
                  onClick={handleDuplicateSelected}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Duplicar nó"
                >
                  📋
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="p-2 hover:bg-red-100 rounded text-red-600"
                  title="Excluir nó"
                >
                  🗑️
                </button>
              </div>
            )}

            {/* Instructions */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold mb-2">Arraste componentes aqui</h3>
                  <p className="text-sm">Selecione um componente da paleta lateral e arraste para o canvas</p>
                </div>
              </div>
            )}
          </ReactFlow>
        </div>

        {/* Node Configuration Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">⚙️ Propriedades</h3>

          {!selectedNode ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">👆</div>
              <p className="text-sm">Clique em um nó para configurar suas propriedades</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rótulo
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Nome do nó"
                />
              </div>

              {/* Node-specific configuration */}
              {selectedNode.type === 'trigger' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Evento
                    </label>
                    <select
                      value={selectedNode.data.eventType || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, eventType: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="order_created">Novo Pedido</option>
                      <option value="cart_abandoned">Carrinho Abandonado</option>
                      <option value="user_registered">Novo Cadastro</option>
                      <option value="order_delivered">Pedido Entregue</option>
                    </select>
                  </div>

                  {selectedNode.data.eventType === 'cart_abandoned' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempo de Espera (minutos)
                      </label>
                      <input
                        type="number"
                        value={selectedNode.data.waitMinutes || 60}
                        onChange={(e) => {
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, waitMinutes: parseInt(e.target.value) } }
                                : node
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        min="1"
                        max="1440"
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'email' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assunto
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.subject || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, subject: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Assunto do email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template ID
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.templateId || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, templateId: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="ID do template"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'delay' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      value={selectedNode.data.delayValue || 1}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, delayValue: parseInt(e.target.value) } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={selectedNode.data.delayType || 'hours'}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, delayType: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="minutes">Minutos</option>
                      <option value="hours">Horas</option>
                      <option value="days">Dias</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Condição
                    </label>
                    <select
                      value={selectedNode.data.conditionType || 'order_value'}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, conditionType: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="order_value">Valor do Pedido</option>
                      <option value="customer_type">Tipo de Cliente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operador
                    </label>
                    <select
                      value={selectedNode.data.operator || 'greater_than'}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, operator: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="greater_than">Maior que</option>
                      <option value="less_than">Menor que</option>
                      <option value="equals">Igual a</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.value || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, value: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Valor para comparar"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'action' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Ação
                    </label>
                    <select
                      value={selectedNode.data.actionType || 'update_tags'}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, actionType: e.target.value } }
                              : node
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="update_tags">Atualizar Tags</option>
                      <option value="apply_discount">Aplicar Desconto</option>
                      <option value="end_flow">Finalizar Fluxo</option>
                    </select>
                  </div>

                  {selectedNode.data.actionType === 'update_tags' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data.tags?.join(', ') || ''}
                        onChange={(e) => {
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, tags: e.target.value.split(',').map(t => t.trim()) } }
                                : node
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="cliente_vip, newsletter"
                      />
                    </div>
                  )}

                  {selectedNode.data.actionType === 'apply_discount' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Desconto
                        </label>
                        <select
                          value={selectedNode.data.discountType || 'percentage'}
                          onChange={(e) => {
                            setNodes((nds) =>
                              nds.map((node) =>
                                node.id === selectedNode.id
                                  ? { ...node, data: { ...node.data, discountType: e.target.value } }
                                  : node
                              )
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                          <option value="percentage">Percentual</option>
                          <option value="fixed">Valor Fixo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor do Desconto
                        </label>
                        <input
                          type="number"
                          value={selectedNode.data.discountValue || 0}
                          onChange={(e) => {
                            setNodes((nds) =>
                              nds.map((node) =>
                                node.id === selectedNode.id
                                  ? { ...node, data: { ...node.data, discountValue: parseFloat(e.target.value) } }
                                  : node
                              )
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FlowBuilderPage() {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner />
    </ReactFlowProvider>
  );
}

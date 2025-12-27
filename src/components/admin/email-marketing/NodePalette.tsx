'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Mail,
  Clock,
  GitBranch,
  Play,
  Search,
  Plus,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface NodeTemplate {
  type: 'trigger' | 'email' | 'delay' | 'condition' | 'action';
  label: string;
  description: string;
  icon: any;
  color: string;
  data?: Record<string, any>;
}

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  flow: {
    nodes: any[];
    edges: any[];
  };
}

interface NodePaletteProps {
  onAddNode: (nodeTemplate: NodeTemplate) => void;
  onLoadFlowTemplate?: (flowTemplate: FlowTemplate) => void;
}

export default function NodePalette({ onAddNode, onLoadFlowTemplate }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [flowTemplates, setFlowTemplates] = useState<FlowTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState('nodes');

  // Carregar templates de fluxos do banco de dados
  useEffect(() => {
    const loadFlowTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await fetch('/api/email-marketing/flows');
        if (response.ok) {
          const data = await response.json();
          // Filtrar apenas fluxos que não são drafts e têm nós
          const templates = data.flows
            .filter((flow: any) => !flow.isDraft && flow.nodesCount > 0)
            .map((flow: any) => ({
              id: flow.id,
              name: flow.name,
              description: flow.description,
              flow: flow.flow || { nodes: [], edges: [] }
            }));
          setFlowTemplates(templates);
        }
      } catch (error) {
        console.error('Erro ao carregar templates de fluxos:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadFlowTemplates();
  }, []);

  const nodeTemplates: NodeTemplate[] = [
    // Triggers
    {
      type: 'trigger',
      label: 'Primeiro Pedido',
      description: 'Dispara APENAS no primeiro pedido do cliente',
      icon: Zap,
      color: '#FF6B00',
      data: {
        eventType: 'order_created',
        isFirstOrder: true,
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Pedido Recorrente',
      description: 'Dispara em pedidos de clientes que já compraram antes',
      icon: Zap,
      color: '#FF6B00',
      data: {
        eventType: 'order_created',
        isFirstOrder: false,
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Qualquer Pedido',
      description: 'Dispara em todos os pedidos (primeiro ou recorrente)',
      icon: Zap,
      color: '#FF6B00',
      data: {
        eventType: 'order_created',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Carrinho Abandonado',
      description: 'Dispara quando cliente abandona carrinho por mais de 30min',
      icon: Zap,
      color: '#FF6B00',
      data: {
        eventType: 'cart_abandoned',
        waitMinutes: 30,
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Novo Cadastro',
      description: 'Dispara quando cliente se cadastra no site',
      icon: Zap,
      color: '#FF6B00',
      data: {
        eventType: 'user_registered',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Pedido Entregue',
      description: 'Dispara quando pedido é marcado como entregue',
      icon: Zap,
      color: '#FF6B00',
      data: {
        eventType: 'order_delivered',
        filters: {}
      }
    },

    // Actions
    {
      type: 'email',
      label: 'Enviar Email',
      description: 'Envia um email para o cliente usando template',
      icon: Mail,
      color: '#10B981',
      data: {
        templateId: '',
        subject: '',
        customContent: ''
      }
    },
    {
      type: 'delay',
      label: 'Aguardar',
      description: 'Espera um período antes de continuar o fluxo',
      icon: Clock,
      color: '#3B82F6',
      data: {
        delayType: 'minutes',
        delayValue: 60
      }
    },
    {
      type: 'condition',
      label: 'Condição',
      description: 'Verifica condição e direciona fluxo',
      icon: GitBranch,
      color: '#8B5CF6',
      data: {
        conditionType: 'order_value',
        operator: 'greater_than',
        value: 50
      }
    },
    {
      type: 'action',
      label: 'Atualizar Cliente',
      description: 'Atualiza dados do cliente (tags, status, etc)',
      icon: Play,
      color: '#F59E0B',
      data: {
        actionType: 'update_tags',
        tags: [],
        status: ''
      }
    },
    {
      type: 'action',
      label: 'Aplicar Desconto',
      description: 'Aplica cupom de desconto para o cliente',
      icon: Play,
      color: '#F59E0B',
      data: {
        actionType: 'apply_discount',
        discountType: 'percentage',
        discountValue: 10,
        expiresIn: 7
      }
    },
    {
      type: 'action',
      label: 'Finalizar Fluxo',
      description: 'Encerra o fluxo de automação',
      icon: Play,
      color: '#EF4444',
      data: {
        actionType: 'end_flow',
        reason: 'completed'
      }
    }
  ];

  const filteredNodes = nodeTemplates.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNode = (nodeTemplate: NodeTemplate) => {
    onAddNode(nodeTemplate);
  };

  const getNodeIcon = (icon: any, color: string) => {
    const IconComponent = icon;
    return <IconComponent className="h-5 w-5" style={{ color }} />;
  };

  const groupedNodes = filteredNodes.reduce((acc, node) => {
    if (!acc[node.type]) {
      acc[node.type] = [];
    }
    acc[node.type].push(node);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'trigger': return 'Gatilhos';
      case 'email': return 'Email';
      case 'delay': return 'Aguardar';
      case 'condition': return 'Condições';
      case 'action': return 'Ações';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-orange-100 text-orange-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'delay': return 'bg-blue-100 text-blue-800';
      case 'condition': return 'bg-purple-100 text-purple-800';
      case 'action': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLoadFlowTemplate = async (template: FlowTemplate) => {
    if (onLoadFlowTemplate) {
      // Buscar o fluxo completo com os dados
      try {
        const response = await fetch(`/api/email-marketing/flows/${template.id}`);
        if (response.ok) {
          const data = await response.json();
          onLoadFlowTemplate({
            ...template,
            flow: data.flow.flow || { nodes: [], edges: [] }
          });
          toast.success(`Template "${template.name}" carregado com sucesso!`);
        } else {
          toast.error('Erro ao carregar template');
        }
      } catch (error) {
        console.error('Erro ao carregar template:', error);
        toast.error('Erro ao carregar template');
      }
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-[#2a1e14] border-r border-[#e5d5b5] dark:border-[#3d2e1f] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#e5d5b5] dark:border-[#3d2e1f]">
        <h2 className="text-lg font-semibold text-[#FF6B00] mb-2">
          Construtor de Fluxos
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Use templates prontos ou crie do zero
        </p>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="nodes" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Nós
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search - apenas na tab de nós */}
        {activeTab === 'nodes' && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar nós..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'templates' ? (
          // Templates de Fluxos
          <div className="space-y-3">
            {loadingTemplates ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Carregando templates...</p>
              </div>
            ) : flowTemplates.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500 mb-2">
                  Nenhum template disponível
                </p>
                <p className="text-xs text-gray-400">
                  Crie um fluxo e salve para usá-lo como template
                </p>
              </div>
            ) : (
              flowTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-[#FF6B00]/50 group"
                  onClick={() => handleLoadFlowTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0 bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/10">
                        <Sparkles className="h-5 w-5 text-[#FF6B00]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-[#FF6B00] transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {template.flow?.nodes?.length || 0} nós
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.flow?.edges?.length || 0} conexões
                          </Badge>
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-[#FF6B00]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          // Nós Individuais
          <div className="space-y-6">
            {Object.entries(groupedNodes).map(([type, nodes]) => (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getTypeColor(type)}>
                    {getTypeLabel(type)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {nodes.length} {nodes.length === 1 ? 'nó' : 'nós'}
                  </span>
                </div>

                <div className="space-y-2">
                  {nodes.map((node) => (
                    <Card
                      key={`${type}-${node.label}`}
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-[#FF6B00]/50 group"
                      onClick={() => handleAddNode(node)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${node.color}20` }}
                          >
                            {getNodeIcon(node.icon, node.color)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-[#FF6B00] transition-colors">
                              {node.label}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {node.description}
                            </p>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4 text-[#FF6B00]" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {filteredNodes.length === 0 && (
              <div className="text-center py-8">
                <Info className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Nenhum nó encontrado para "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#e5d5b5] dark:border-[#3d2e1f] bg-gray-50 dark:bg-[#1a1814]">
        <div className="text-xs text-gray-500 space-y-1">
          {activeTab === 'templates' ? (
            <>
              <p><strong>Dica:</strong> Clique em um template para carregar</p>
              <p>O fluxo completo será carregado no canvas</p>
            </>
          ) : (
            <>
              <p><strong>Dica:</strong> Clique em um nó para adicioná-lo</p>
              <p>Shift + Click para conectar nós</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
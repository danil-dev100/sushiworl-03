'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Zap,
  MessageSquare,
  Clock,
  GitBranch,
  Search,
  Plus,
  Info,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle,
  UserPlus
} from 'lucide-react';

interface NodeTemplate {
  type: 'trigger' | 'sms' | 'delay' | 'condition';
  label: string;
  description: string;
  icon: any;
  color: string;
  data?: Record<string, any>;
}

interface SmsNodePaletteProps {
  onAddNode: (nodeTemplate: NodeTemplate) => void;
}

export default function SmsNodePalette({ onAddNode }: SmsNodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const nodeTemplates: NodeTemplate[] = [
    // Triggers para SMS
    {
      type: 'trigger',
      label: 'Pedido Criado',
      description: 'Dispara quando um novo pedido é criado',
      icon: ShoppingCart,
      color: '#FF6B00',
      data: {
        eventType: 'order_created',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Pedido Confirmado',
      description: 'Dispara quando pedido é confirmado pela cozinha',
      icon: CheckCircle,
      color: '#FF6B00',
      data: {
        eventType: 'order_confirmed',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Pedido em Preparo',
      description: 'Dispara quando pedido começa a ser preparado',
      icon: Clock,
      color: '#FF6B00',
      data: {
        eventType: 'order_preparing',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Pedido em Entrega',
      description: 'Dispara quando pedido sai para entrega',
      icon: Truck,
      color: '#FF6B00',
      data: {
        eventType: 'order_delivering',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Pedido Entregue',
      description: 'Dispara quando pedido é marcado como entregue',
      icon: CheckCircle,
      color: '#FF6B00',
      data: {
        eventType: 'order_delivered',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Pedido Cancelado',
      description: 'Dispara quando pedido é cancelado',
      icon: XCircle,
      color: '#FF6B00',
      data: {
        eventType: 'order_cancelled',
        filters: {}
      }
    },
    {
      type: 'trigger',
      label: 'Novo Cadastro',
      description: 'Dispara quando cliente se cadastra',
      icon: UserPlus,
      color: '#FF6B00',
      data: {
        eventType: 'user_registered',
        filters: {}
      }
    },

    // SMS Node
    {
      type: 'sms',
      label: 'Enviar SMS',
      description: 'Envia um SMS para o cliente',
      icon: MessageSquare,
      color: '#10B981',
      data: {
        message: '',
        recipientType: 'customer',
        customPhone: ''
      }
    },

    // Delay
    {
      type: 'delay',
      label: 'Aguardar',
      description: 'Espera um período antes de continuar',
      icon: Clock,
      color: '#3B82F6',
      data: {
        delayType: 'minutes',
        delayValue: 5
      }
    },

    // Condition
    {
      type: 'condition',
      label: 'Condição',
      description: 'Verifica condição e direciona fluxo',
      icon: GitBranch,
      color: '#8B5CF6',
      data: {
        conditionType: 'has_phone',
        operator: 'equals',
        value: true
      }
    },
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
      case 'sms': return 'SMS';
      case 'delay': return 'Aguardar';
      case 'condition': return 'Condições';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-orange-100 text-orange-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'delay': return 'bg-blue-100 text-blue-800';
      case 'condition': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-[#2a1e14] border-r border-[#e5d5b5] dark:border-[#3d2e1f] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#e5d5b5] dark:border-[#3d2e1f]">
        <h2 className="text-lg font-semibold text-green-600 mb-2 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Construtor de SMS
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Arraste os nós para criar sua automação
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar nós..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
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
                    className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-green-500/50 group"
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
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                            {node.label}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {node.description}
                          </p>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 text-green-600" />
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
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#e5d5b5] dark:border-[#3d2e1f] bg-gray-50 dark:bg-[#1a1814]">
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Dica:</strong> Clique em um nó para adicioná-lo</p>
          <p>Shift + Click para conectar nós</p>
        </div>
      </div>
    </div>
  );
}

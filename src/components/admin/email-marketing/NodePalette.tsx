'use client';

import { Zap, Mail, Clock, GitBranch, Database, ShoppingCart, Calendar, UserPlus, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

type NodeTemplate = {
  type: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  data?: Record<string, unknown>;
};

const nodeTemplates: NodeTemplate[] = [
  // Gatilhos
  {
    type: 'trigger',
    label: 'Novo Pedido',
    icon: ShoppingCart,
    color: '#10B981',
    description: 'Dispara quando um novo pedido é criado',
    data: { triggerType: 'NEW_ORDER' },
  },
  {
    type: 'trigger',
    label: 'Pedido Cancelado',
    icon: XCircle,
    color: '#EF4444',
    description: 'Dispara quando um pedido é cancelado',
    data: { triggerType: 'ORDER_CANCELLED' },
  },
  {
    type: 'trigger',
    label: 'Carrinho Abandonado',
    icon: ShoppingCart,
    color: '#F59E0B',
    description: 'Dispara quando o carrinho é abandonado por 24h',
    data: { triggerType: 'CART_ABANDONED' },
  },
  {
    type: 'trigger',
    label: 'Usuário Registrado',
    icon: UserPlus,
    color: '#3B82F6',
    description: 'Dispara quando um novo usuário se registra',
    data: { triggerType: 'USER_REGISTERED' },
  },
  {
    type: 'trigger',
    label: 'Aniversário',
    icon: Calendar,
    color: '#8B5CF6',
    description: 'Dispara no dia do aniversário do cliente',
    data: { triggerType: 'BIRTHDAY' },
  },

  // Ações
  {
    type: 'email',
    label: 'Enviar Email',
    icon: Mail,
    color: '#3B82F6',
    description: 'Envia um email para o cliente',
  },
  {
    type: 'delay',
    label: 'Aguardar',
    icon: Clock,
    color: '#F59E0B',
    description: 'Aguarda um período antes de continuar',
    data: { delayDays: 1, delayHours: 0 },
  },
  {
    type: 'condition',
    label: 'Condição',
    icon: GitBranch,
    color: '#8B5CF6',
    description: 'Toma decisões com base em condições',
  },
  {
    type: 'action',
    label: 'Atualizar Status',
    icon: Database,
    color: '#14B8A6',
    description: 'Atualiza informações no banco de dados',
    data: { actionType: 'UPDATE_STATUS' },
  },
];

interface NodePaletteProps {
  onAddNode: (nodeTemplate: NodeTemplate) => void;
}

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="w-80 bg-white dark:bg-[#2a1e14] border-r border-[#e5d5b5] dark:border-[#3d2e1f] p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9] mb-4">
        Componentes
      </h3>

      <div className="space-y-2">
        {/* Gatilhos */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Gatilhos
          </h4>
          <div className="space-y-2 mb-4">
            {nodeTemplates
              .filter((t) => t.type === 'trigger')
              .map((template, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:shadow-md transition-all border-2 hover:border-[#FF6B00]"
                  onClick={() => onAddNode(template)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', JSON.stringify(template));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <template.icon className="w-4 h-4" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {template.label}
                      </div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>

        {/* Ações */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Ações
          </h4>
          <div className="space-y-2">
            {nodeTemplates
              .filter((t) => ['email', 'delay', 'condition', 'action'].includes(t.type))
              .map((template, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:shadow-md transition-all border-2 hover:border-[#FF6B00]"
                  onClick={() => onAddNode(template)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', JSON.stringify(template));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <template.icon className="w-4 h-4" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {template.label}
                      </div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 <strong>Dica:</strong> Arraste os componentes para o canvas ou clique para adicionar.
        </p>
      </div>
    </div>
  );
}

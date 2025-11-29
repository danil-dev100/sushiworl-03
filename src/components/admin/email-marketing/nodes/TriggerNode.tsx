'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, Clock, ShoppingCart, UserPlus, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TriggerNodeData {
  label: string;
  eventType?: string;
  waitMinutes?: number;
  filters?: Record<string, any>;
}

function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  const getIcon = () => {
    switch (data.eventType) {
      case 'order_created':
        return <ShoppingCart className="h-4 w-4" />;
      case 'cart_abandoned':
        return <Clock className="h-4 w-4" />;
      case 'user_registered':
        return <UserPlus className="h-4 w-4" />;
      case 'order_delivered':
        return <Truck className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getEventLabel = () => {
    switch (data.eventType) {
      case 'order_created':
        return 'Novo Pedido';
      case 'cart_abandoned':
        return `Carrinho Abandonado (${data.waitMinutes}min)`;
      case 'user_registered':
        return 'Novo Cadastro';
      case 'order_delivered':
        return 'Pedido Entregue';
      default:
        return data.label || 'Gatilho';
    }
  };

  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all duration-200 min-w-[200px]
      ${selected ? 'border-[#FF6B00] shadow-[#FF6B00]/20' : 'border-orange-300 hover:border-[#FF6B00]/70'}
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-orange-100 text-orange-600">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {getEventLabel()}
          </div>
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
            Gatilho
          </Badge>
        </div>
      </div>

      {/* Filters indicator */}
      {data.filters && Object.keys(data.filters).length > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          {Object.keys(data.filters).length} filtro(s) ativo(s)
        </div>
      )}

      {/* Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
        style={{ bottom: -6 }}
      />

      {/* Status indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
    </div>
  );
}

export default memo(TriggerNode);
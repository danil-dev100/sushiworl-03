'use client';

import { Handle, Position } from 'reactflow';
import { Zap, ShoppingCart, Calendar, UserPlus, XCircle } from 'lucide-react';

type TriggerType = 'NEW_ORDER' | 'ORDER_CANCELLED' | 'CART_ABANDONED' | 'USER_REGISTERED' | 'BIRTHDAY';

interface TriggerNodeProps {
  data: {
    label: string;
    triggerType?: TriggerType;
    config?: Record<string, unknown>;
  };
  selected: boolean;
}

const triggerIcons = {
  NEW_ORDER: ShoppingCart,
  ORDER_CANCELLED: XCircle,
  CART_ABANDONED: ShoppingCart,
  USER_REGISTERED: UserPlus,
  BIRTHDAY: Calendar,
};

const triggerColors = {
  NEW_ORDER: '#10B981',
  ORDER_CANCELLED: '#EF4444',
  CART_ABANDONED: '#F59E0B',
  USER_REGISTERED: '#3B82F6',
  BIRTHDAY: '#8B5CF6',
};

export default function TriggerNode({ data, selected }: TriggerNodeProps) {
  const Icon = data.triggerType ? triggerIcons[data.triggerType] : Zap;
  const color = data.triggerType ? triggerColors[data.triggerType] : '#FF6B00';

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px] transition-all ${
        selected ? 'border-[#FF6B00] ring-2 ring-[#FF6B00] ring-opacity-50' : 'border-gray-300'
      }`}
      style={{ borderColor: selected ? '#FF6B00' : color }}
    >
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ background: color }} />

      <div className="flex items-center gap-2 mb-2">
        <div
          className="p-2 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase">Gatilho</div>
          <div className="text-sm font-bold text-gray-800">{data.label}</div>
        </div>
      </div>

      {data.config && Object.keys(data.config).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
              <div key={key} className="truncate">
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

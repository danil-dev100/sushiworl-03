'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DelayNodeData {
  label: string;
  delayType?: 'minutes' | 'hours' | 'days';
  delayValue?: number;
}

function DelayNode({ data, selected }: NodeProps<DelayNodeData>) {
  const getDelayText = () => {
    const value = data.delayValue || 1;
    const type = data.delayType || 'hours';

    switch (type) {
      case 'minutes':
        return `${value} ${value === 1 ? 'minuto' : 'minutos'}`;
      case 'hours':
        return `${value} ${value === 1 ? 'hora' : 'horas'}`;
      case 'days':
        return `${value} ${value === 1 ? 'dia' : 'dias'}`;
      default:
        return `${value} ${type}`;
    }
  };

  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all duration-200 min-w-[200px]
      ${selected ? 'border-[#3B82F6] shadow-[#3B82F6]/20' : 'border-blue-300 hover:border-[#3B82F6]/70'}
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-blue-100 text-blue-600">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {data.label || 'Aguardar'}
          </div>
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
            Delay
          </Badge>
        </div>
      </div>

      {/* Delay info */}
      <div className="text-sm font-medium text-blue-700 mb-2">
        Aguardar {getDelayText()}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ top: -6 }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ bottom: -6 }}
      />

      {/* Status indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
    </div>
  );
}

export default memo(DelayNode);
'use client';

import { Handle, Position } from 'reactflow';
import { Clock } from 'lucide-react';

interface DelayNodeProps {
  data: {
    label: string;
    delayDays?: number;
    delayHours?: number;
    config?: Record<string, unknown>;
  };
  selected: boolean;
}

export default function DelayNode({ data, selected }: DelayNodeProps) {
  const getDelayText = () => {
    const days = data.delayDays || 0;
    const hours = data.delayHours || 0;

    if (days > 0 && hours > 0) {
      return `${days}d ${hours}h`;
    } else if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return 'Configurar';
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px] transition-all ${
        selected ? 'border-[#FF6B00] ring-2 ring-[#FF6B00] ring-opacity-50' : 'border-amber-500'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500" />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-full bg-amber-100">
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase">Aguardar</div>
          <div className="text-sm font-bold text-gray-800">{data.label}</div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{getDelayText()}</div>
          <div className="text-xs text-gray-500 mt-1">antes de continuar</div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock } from 'lucide-react';

interface DelayNodeData {
  label: string;
  delayType?: 'minutes' | 'hours' | 'days';
  delayValue?: number;
}

function DelayNode({ data, selected }: NodeProps<DelayNodeData>) {
  const getDelayText = () => {
    const value = data.delayValue || 0;
    const type = data.delayType || 'minutes';

    if (type === 'minutes') return `${value} minuto${value !== 1 ? 's' : ''}`;
    if (type === 'hours') return `${value} hora${value !== 1 ? 's' : ''}`;
    if (type === 'days') return `${value} dia${value !== 1 ? 's' : ''}`;
    return `${value}`;
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-lg border-2 bg-white
        min-w-[150px] max-w-[200px]
        transition-all duration-200
        ${selected
          ? 'border-blue-500 shadow-blue-200 ring-2 ring-blue-200'
          : 'border-blue-300 hover:border-blue-400'
        }
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-blue-100">
          <Clock className="h-4 w-4 text-blue-600" />
        </div>
        <span className="font-semibold text-sm text-gray-900">
          {data.label || 'Aguardar'}
        </span>
      </div>

      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded text-center font-medium">
        {getDelayText()}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(DelayNode);

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';

interface SmsNodeData {
  label: string;
  message?: string;
  recipientType?: 'customer' | 'custom';
  customPhone?: string;
}

function SmsNode({ data, selected }: NodeProps<SmsNodeData>) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-lg border-2 bg-white
        min-w-[180px] max-w-[250px]
        transition-all duration-200
        ${selected
          ? 'border-green-500 shadow-green-200 ring-2 ring-green-200'
          : 'border-green-300 hover:border-green-400'
        }
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-green-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-green-100">
          <MessageSquare className="h-4 w-4 text-green-600" />
        </div>
        <span className="font-semibold text-sm text-gray-900">
          {data.label || 'Enviar SMS'}
        </span>
      </div>

      {data.message && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-2">
          {data.message.substring(0, 60)}
          {data.message.length > 60 && '...'}
        </div>
      )}

      {!data.message && (
        <div className="text-xs text-gray-400 italic">
          Clique para configurar mensagem
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500 border-2 border-white"
      />
    </div>
  );
}

export default memo(SmsNode);

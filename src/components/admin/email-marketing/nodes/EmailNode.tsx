'use client';

import { Handle, Position } from 'reactflow';
import { Mail } from 'lucide-react';

interface EmailNodeProps {
  data: {
    label: string;
    subject?: string;
    templateId?: string;
    config?: Record<string, unknown>;
  };
  selected: boolean;
}

export default function EmailNode({ data, selected }: EmailNodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px] transition-all ${
        selected ? 'border-[#FF6B00] ring-2 ring-[#FF6B00] ring-opacity-50' : 'border-blue-500'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-full bg-blue-100">
          <Mail className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase">Ação</div>
          <div className="text-sm font-bold text-gray-800">{data.label}</div>
        </div>
      </div>

      {data.subject && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="font-medium">Assunto:</div>
            <div className="truncate mt-1">{data.subject}</div>
          </div>
        </div>
      )}

      {data.templateId && (
        <div className="mt-1">
          <div className="text-xs text-gray-500">
            Template: <span className="font-medium">#{data.templateId.slice(0, 8)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface ConditionNodeProps {
  data: {
    label: string;
    conditionType?: string;
    config?: Record<string, unknown>;
  };
  selected: boolean;
}

export default function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px] transition-all ${
        selected ? 'border-[#FF6B00] ring-2 ring-[#FF6B00] ring-opacity-50' : 'border-purple-500'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 bg-green-500"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-500"
        style={{ left: '70%' }}
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-full bg-purple-100">
          <GitBranch className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase">Condição</div>
          <div className="text-sm font-bold text-gray-800">{data.label}</div>
        </div>
      </div>

      {data.conditionType && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="font-medium">Tipo:</div>
            <div className="mt-1">{data.conditionType}</div>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-between text-xs font-semibold">
        <span className="text-green-600">✓ Sim</span>
        <span className="text-red-600">✗ Não</span>
      </div>
    </div>
  );
}

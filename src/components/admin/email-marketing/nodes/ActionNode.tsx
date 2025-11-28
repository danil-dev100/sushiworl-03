'use client';

import { Handle, Position } from 'reactflow';
import { Zap, Tag, Bell, Database } from 'lucide-react';

type ActionType = 'UPDATE_STATUS' | 'ADD_TAG' | 'SEND_NOTIFICATION' | 'UPDATE_DATABASE';

interface ActionNodeProps {
  data: {
    label: string;
    actionType?: ActionType;
    config?: Record<string, unknown>;
  };
  selected: boolean;
}

const actionIcons = {
  UPDATE_STATUS: Database,
  ADD_TAG: Tag,
  SEND_NOTIFICATION: Bell,
  UPDATE_DATABASE: Database,
};

export default function ActionNode({ data, selected }: ActionNodeProps) {
  const Icon = data.actionType ? actionIcons[data.actionType] : Zap;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px] transition-all ${
        selected ? 'border-[#FF6B00] ring-2 ring-[#FF6B00] ring-opacity-50' : 'border-teal-500'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-500" />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-full bg-teal-100">
          <Icon className="w-4 h-4 text-teal-600" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase">Ação</div>
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

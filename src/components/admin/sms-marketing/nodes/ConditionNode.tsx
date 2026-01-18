'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface ConditionNodeData {
  label: string;
  conditionType?: string;
  operator?: string;
  value?: any;
}

function ConditionNode({ data, selected }: NodeProps<ConditionNodeData>) {
  const getConditionText = () => {
    const { conditionType, operator, value } = data;

    if (!conditionType) return 'Configurar condição';

    const typeLabels: Record<string, string> = {
      order_value: 'Valor do pedido',
      order_count: 'Qtd. pedidos',
      has_phone: 'Tem telefone',
    };

    const operatorLabels: Record<string, string> = {
      greater_than: '>',
      less_than: '<',
      equals: '=',
      not_equals: '!=',
    };

    const typeName = typeLabels[conditionType || ''] || conditionType;
    const op = operatorLabels[operator || ''] || operator;

    if (conditionType === 'has_phone') {
      return value ? 'Tem telefone' : 'Sem telefone';
    }

    return `${typeName} ${op} ${value}`;
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-lg border-2 bg-white
        min-w-[150px] max-w-[200px]
        transition-all duration-200
        ${selected
          ? 'border-purple-500 shadow-purple-200 ring-2 ring-purple-200'
          : 'border-purple-300 hover:border-purple-400'
        }
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-purple-100">
          <GitBranch className="h-4 w-4 text-purple-600" />
        </div>
        <span className="font-semibold text-sm text-gray-900">
          {data.label || 'Condição'}
        </span>
      </div>

      <div className="text-xs text-gray-600 bg-purple-50 p-2 rounded text-center">
        {getConditionText()}
      </div>

      {/* Two outputs: Yes and No */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span className="text-green-600">Sim</span>
        <span className="text-red-600">Não</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="w-3 h-3 !bg-red-500 border-2 border-white"
        style={{ left: '70%' }}
      />
    </div>
  );
}

export default memo(ConditionNode);

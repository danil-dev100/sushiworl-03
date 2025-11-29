'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConditionNodeData {
  label: string;
  conditionType?: string;
  operator?: string;
  value?: any;
}

function ConditionNode({ data, selected }: NodeProps<ConditionNodeData>) {
  const getConditionText = () => {
    const type = data.conditionType || 'order_value';
    const operator = data.operator || 'greater_than';
    const value = data.value;

    let typeText = '';
    let operatorText = '';
    let valueText = value || '0';

    // Tipo da condição
    switch (type) {
      case 'order_value':
        typeText = 'Valor do pedido';
        valueText = `R$ ${value || 0}`;
        break;
      case 'order_items':
        typeText = 'Quantidade de itens';
        break;
      case 'customer_type':
        typeText = 'Tipo de cliente';
        valueText = value || 'novo';
        break;
      case 'time_since_registration':
        typeText = 'Dias desde cadastro';
        break;
      default:
        typeText = 'Condição';
    }

    // Operador
    switch (operator) {
      case 'equals':
        operatorText = '=';
        break;
      case 'not_equals':
        operatorText = '≠';
        break;
      case 'greater_than':
        operatorText = '>';
        break;
      case 'less_than':
        operatorText = '<';
        break;
      case 'contains':
        operatorText = 'contém';
        break;
      default:
        operatorText = operator;
    }

    return `${typeText} ${operatorText} ${valueText}`;
  };

  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all duration-200 min-w-[240px]
      ${selected ? 'border-[#8B5CF6] shadow-[#8B5CF6]/20' : 'border-purple-300 hover:border-[#8B5CF6]/70'}
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-purple-100 text-purple-600">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {data.label || 'Condição'}
          </div>
          <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">
            If/Else
          </Badge>
        </div>
      </div>

      {/* Condition */}
      <div className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded mb-2 text-center">
        {getConditionText()}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
        style={{ top: -6 }}
      />

      {/* True path */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ right: -6 }}
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-green-600">
        <ArrowRight className="h-3 w-3" />
        Verdadeiro
      </div>

      {/* False path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ bottom: -6 }}
      />
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 text-xs text-red-600">
        <ArrowRight className="h-3 w-3 rotate-90" />
        Falso
      </div>

      {/* Status indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
    </div>
  );
}

export default memo(ConditionNode);
'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Tag, Percent, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActionNodeData {
  label: string;
  actionType?: string;
  tags?: string[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  expiresIn?: number;
  status?: string;
}

function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  const getIcon = () => {
    switch (data.actionType) {
      case 'update_tags':
        return <Tag className="h-4 w-4" />;
      case 'apply_discount':
        return <Percent className="h-4 w-4" />;
      case 'end_flow':
        return <X className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getActionText = () => {
    switch (data.actionType) {
      case 'update_tags':
        return data.tags && data.tags.length > 0
          ? `Adicionar ${data.tags.length} tag(s)`
          : 'Atualizar tags';
      case 'apply_discount':
        const type = data.discountType === 'percentage' ? '%' : 'R$';
        return `Desconto ${data.discountValue || 0}${type}`;
      case 'end_flow':
        return 'Finalizar fluxo';
      default:
        return data.label || 'Executar ação';
    }
  };

  const getColorClass = () => {
    switch (data.actionType) {
      case 'update_tags':
        return selected ? 'border-yellow-500' : 'border-yellow-300 hover:border-yellow-500';
      case 'apply_discount':
        return selected ? 'border-green-500' : 'border-green-300 hover:border-green-500';
      case 'end_flow':
        return selected ? 'border-red-500' : 'border-red-300 hover:border-red-500';
      default:
        return selected ? 'border-yellow-500' : 'border-yellow-300 hover:border-yellow-500';
    }
  };

  const getBgColorClass = () => {
    switch (data.actionType) {
      case 'update_tags':
        return 'bg-yellow-100 text-yellow-600';
      case 'apply_discount':
        return 'bg-green-100 text-green-600';
      case 'end_flow':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-yellow-100 text-yellow-600';
    }
  };

  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all duration-200 min-w-[200px] ${getColorClass()}
      ${selected ? 'shadow-current/20' : ''}
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${getBgColorClass()}`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {data.label || 'Ação'}
          </div>
          <Badge variant="outline" className={`text-xs border-current ${getBgColorClass().replace('bg-', 'text-').replace('text-', 'border-')}`}>
            Ação
          </Badge>
        </div>
      </div>

      {/* Action details */}
      <div className="text-xs text-gray-600 mb-2">
        {getActionText()}
      </div>

      {/* Additional info */}
      {data.actionType === 'apply_discount' && data.expiresIn && (
        <div className="text-xs text-gray-500">
          Expira em {data.expiresIn} dias
        </div>
      )}

      {data.actionType === 'update_tags' && data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {data.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
          {data.tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              +{data.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 border-white ${
          data.actionType === 'update_tags' ? 'bg-yellow-500' :
          data.actionType === 'apply_discount' ? 'bg-green-500' :
          data.actionType === 'end_flow' ? 'bg-red-500' : 'bg-yellow-500'
        }`}
        style={{ top: -6 }}
      />

      {data.actionType !== 'end_flow' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`w-3 h-3 border-2 border-white ${
            data.actionType === 'update_tags' ? 'bg-yellow-500' :
            data.actionType === 'apply_discount' ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{ bottom: -6 }}
        />
      )}

      {/* Status indicator */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
        data.actionType === 'update_tags' ? 'bg-yellow-500' :
        data.actionType === 'apply_discount' ? 'bg-green-500' :
        data.actionType === 'end_flow' ? 'bg-red-500' : 'bg-yellow-500'
      }`}></div>
    </div>
  );
}

export default memo(ActionNode);
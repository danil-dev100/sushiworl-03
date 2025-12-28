'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Mail, FileText, Send, Percent, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmailNodeData {
  label: string;
  templateId?: string;
  templateName?: string;
  subject?: string;
  customContent?: string;
  discountPercentage?: number;
  freeShipping?: boolean;
  couponValidity?: number; // em horas (24, 48, etc)
}

function EmailNode({ data, selected }: NodeProps<EmailNodeData>) {
  const hasTemplate = data.templateId && data.templateName;
  const hasCustomContent = data.customContent && typeof data.customContent === 'string' && data.customContent.trim();

  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg bg-white border-2 transition-all duration-200 min-w-[200px]
      ${selected ? 'border-[#10B981] shadow-[#10B981]/20' : 'border-green-300 hover:border-[#10B981]/70'}
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-green-100 text-green-600">
          <Mail className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {data.label || 'Enviar Email'}
          </div>
          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
            Email
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1 mb-2">
        {hasTemplate && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FileText className="h-3 w-3" />
            <span className="truncate">{data.templateName}</span>
          </div>
        )}

        {data.subject && (
          <div className="text-xs text-gray-500 truncate">
            Assunto: {data.subject}
          </div>
        )}

        {hasCustomContent && (
          <div className="text-xs text-gray-500">
            Conteúdo personalizado
          </div>
        )}

        {/* Desconto e Frete Grátis */}
        {(data.discountPercentage || data.freeShipping) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.discountPercentage && data.discountPercentage > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">
                <Percent className="h-3 w-3" />
                {data.discountPercentage}% off
              </div>
            )}
            {data.freeShipping && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                <Truck className="h-3 w-3" />
                Frete grátis
              </div>
            )}
          </div>
        )}

        {!hasTemplate && !hasCustomContent && (
          <div className="text-xs text-gray-400 italic">
            Configure um template
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ top: -6 }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ bottom: -6 }}
      />

      {/* Status indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
    </div>
  );
}

export default memo(EmailNode);
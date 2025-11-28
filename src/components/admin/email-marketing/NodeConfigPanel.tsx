'use client';

import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X, Mail, Clock, GitBranch, Database, Zap, Calendar, ShoppingCart, UserPlus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
  templates?: Array<{ id: string; name: string; subject: string }>;
}

export default function NodeConfigPanel({
  selectedNode,
  onClose,
  onUpdate,
  templates = [],
}: NodeConfigPanelProps) {
  const [nodeData, setNodeData] = useState<any>({});

  useEffect(() => {
    if (selectedNode) {
      setNodeData(selectedNode.data || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleSave = () => {
    onUpdate(selectedNode.id, nodeData);
    onClose();
  };

  const updateData = (key: string, value: any) => {
    setNodeData((prev: any) => ({ ...prev, [key]: value }));
  };

  // Renderiza configurações específicas por tipo de nó
  const renderConfig = () => {
    switch (selectedNode.type) {
      case 'trigger':
        return <TriggerConfig data={nodeData} onChange={updateData} />;
      case 'email':
        return <EmailConfig data={nodeData} onChange={updateData} templates={templates} />;
      case 'delay':
        return <DelayConfig data={nodeData} onChange={updateData} />;
      case 'condition':
        return <ConditionConfig data={nodeData} onChange={updateData} />;
      case 'action':
        return <ActionConfig data={nodeData} onChange={updateData} />;
      default:
        return <div className="text-sm text-gray-500">Tipo de nó não reconhecido</div>;
    }
  };

  return (
    <div className="w-96 h-full bg-white dark:bg-[#2a1e14] border-l border-[#e5d5b5] dark:border-[#3d2e1f] overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#e5d5b5] dark:border-[#3d2e1f] flex items-center justify-between sticky top-0 bg-white dark:bg-[#2a1e14] z-10">
        <h3 className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
          Configurar Nó
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Nome do Nó */}
        <div className="space-y-2">
          <Label>Nome do Nó</Label>
          <Input
            value={nodeData.label || ''}
            onChange={(e) => updateData('label', e.target.value)}
            placeholder="Ex: Enviar email de boas-vindas"
          />
        </div>

        {/* Configurações específicas */}
        {renderConfig()}
      </div>

      {/* Footer com botões */}
      <div className="p-4 border-t border-[#e5d5b5] dark:border-[#3d2e1f] flex gap-2 sticky bottom-0 bg-white dark:bg-[#2a1e14]">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90">
          Salvar
        </Button>
      </div>
    </div>
  );
}

// ========================================
// COMPONENTES DE CONFIGURAÇÃO POR TIPO
// ========================================

function TriggerConfig({ data, onChange }: any) {
  const triggers = [
    { value: 'NEW_ORDER', label: 'Novo Pedido', icon: ShoppingCart },
    { value: 'ORDER_CANCELLED', label: 'Pedido Cancelado', icon: XCircle },
    { value: 'CART_ABANDONED', label: 'Carrinho Abandonado', icon: ShoppingCart },
    { value: 'USER_REGISTERED', label: 'Usuário Registrado', icon: UserPlus },
    { value: 'BIRTHDAY', label: 'Aniversário', icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label>Tipo de Gatilho</Label>
        <Select
          value={data.triggerType || ''}
          onValueChange={(value) => onChange('triggerType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o gatilho" />
          </SelectTrigger>
          <SelectContent>
            {triggers.map((trigger) => (
              <SelectItem key={trigger.value} value={trigger.value}>
                <div className="flex items-center gap-2">
                  <trigger.icon className="w-4 h-4" />
                  {trigger.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.triggerType === 'CART_ABANDONED' && (
        <div>
          <Label>Aguardar (horas)</Label>
          <Input
            type="number"
            value={data.abandonedHours || 24}
            onChange={(e) => onChange('abandonedHours', parseInt(e.target.value))}
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tempo para considerar o carrinho abandonado
          </p>
        </div>
      )}
    </div>
  );
}

function EmailConfig({ data, onChange, templates }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Template de Email</Label>
        <Select
          value={data.templateId || ''}
          onValueChange={(value) => onChange('templateId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template: any) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Assunto do Email</Label>
        <Input
          value={data.subject || ''}
          onChange={(e) => onChange('subject', e.target.value)}
          placeholder="Ex: Bem-vindo ao SushiWorld!"
        />
      </div>

      <div>
        <Label>Remetente</Label>
        <Input
          value={data.fromName || 'SushiWorld'}
          onChange={(e) => onChange('fromName', e.target.value)}
          placeholder="Nome do remetente"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Incluir botão de ação</Label>
        <Switch
          checked={data.includeButton || false}
          onCheckedChange={(checked) => onChange('includeButton', checked)}
        />
      </div>

      {data.includeButton && (
        <>
          <div>
            <Label>Texto do Botão</Label>
            <Input
              value={data.buttonText || ''}
              onChange={(e) => onChange('buttonText', e.target.value)}
              placeholder="Ex: Ver Pedido"
            />
          </div>
          <div>
            <Label>URL do Botão</Label>
            <Input
              value={data.buttonUrl || ''}
              onChange={(e) => onChange('buttonUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </>
      )}
    </div>
  );
}

function DelayConfig({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Aguardar</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              value={data.delayDays || 0}
              onChange={(e) => onChange('delayDays', parseInt(e.target.value) || 0)}
              min="0"
              placeholder="Dias"
            />
          </div>
          <div>
            <Input
              type="number"
              value={data.delayHours || 0}
              onChange={(e) => onChange('delayHours', parseInt(e.target.value) || 0)}
              min="0"
              max="23"
              placeholder="Horas"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Total: {(data.delayDays || 0) * 24 + (data.delayHours || 0)} horas
        </p>
      </div>
    </div>
  );
}

function ConditionConfig({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Campo a Verificar</Label>
        <Select
          value={data.conditionField || ''}
          onValueChange={(value) => onChange('conditionField', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orderTotal">Valor do Pedido</SelectItem>
            <SelectItem value="orderCount">Número de Pedidos</SelectItem>
            <SelectItem value="customerType">Tipo de Cliente</SelectItem>
            <SelectItem value="productCategory">Categoria do Produto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Operador</Label>
        <Select
          value={data.conditionOperator || ''}
          onValueChange={(value) => onChange('conditionOperator', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o operador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gt">Maior que</SelectItem>
            <SelectItem value="gte">Maior ou igual</SelectItem>
            <SelectItem value="lt">Menor que</SelectItem>
            <SelectItem value="lte">Menor ou igual</SelectItem>
            <SelectItem value="eq">Igual a</SelectItem>
            <SelectItem value="neq">Diferente de</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Valor</Label>
        <Input
          value={data.conditionValue || ''}
          onChange={(e) => onChange('conditionValue', e.target.value)}
          placeholder="Ex: 50"
        />
      </div>
    </div>
  );
}

function ActionConfig({ data, onChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Tipo de Ação</Label>
        <Select
          value={data.actionType || ''}
          onValueChange={(value) => onChange('actionType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UPDATE_STATUS">Atualizar Status</SelectItem>
            <SelectItem value="ADD_TAG">Adicionar Tag</SelectItem>
            <SelectItem value="SEND_NOTIFICATION">Enviar Notificação</SelectItem>
            <SelectItem value="UPDATE_FIELD">Atualizar Campo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.actionType === 'ADD_TAG' && (
        <div>
          <Label>Nome da Tag</Label>
          <Input
            value={data.tagName || ''}
            onChange={(e) => onChange('tagName', e.target.value)}
            placeholder="Ex: cliente-vip"
          />
        </div>
      )}

      {data.actionType === 'UPDATE_FIELD' && (
        <>
          <div>
            <Label>Campo</Label>
            <Input
              value={data.fieldName || ''}
              onChange={(e) => onChange('fieldName', e.target.value)}
              placeholder="Ex: customerType"
            />
          </div>
          <div>
            <Label>Novo Valor</Label>
            <Input
              value={data.fieldValue || ''}
              onChange={(e) => onChange('fieldValue', e.target.value)}
              placeholder="Ex: VIP"
            />
          </div>
        </>
      )}
    </div>
  );
}

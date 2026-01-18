'use client';

import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, MessageSquare, Clock, GitBranch, Zap, Info } from 'lucide-react';

interface SmsNodeConfigPanelProps {
  selectedNode: Node;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
}

export default function SmsNodeConfigPanel({
  selectedNode,
  onClose,
  onUpdate,
}: SmsNodeConfigPanelProps) {
  const [nodeData, setNodeData] = useState(selectedNode.data);
  const [messageLength, setMessageLength] = useState(0);

  useEffect(() => {
    setNodeData(selectedNode.data);
    if (selectedNode.data.message) {
      setMessageLength(selectedNode.data.message.length);
    }
  }, [selectedNode]);

  const handleSave = () => {
    onUpdate(selectedNode.id, nodeData);
    onClose();
  };

  const handleMessageChange = (message: string) => {
    setMessageLength(message.length);
    setNodeData({ ...nodeData, message });
  };

  const getNodeTypeInfo = () => {
    switch (selectedNode.type) {
      case 'trigger':
        return { icon: Zap, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Gatilho' };
      case 'sms':
        return { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100', label: 'SMS' };
      case 'delay':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Aguardar' };
      case 'condition':
        return { icon: GitBranch, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Condição' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Nó' };
    }
  };

  const typeInfo = getNodeTypeInfo();
  const IconComponent = typeInfo.icon;

  // Variáveis disponíveis para SMS
  const smsVariables = [
    { var: '{{customerName}}', desc: 'Nome do cliente' },
    { var: '{{orderNumber}}', desc: 'Número do pedido' },
    { var: '{{orderTotal}}', desc: 'Total do pedido' },
    { var: '{{estimatedTime}}', desc: 'Tempo estimado' },
    { var: '{{trackingUrl}}', desc: 'Link de rastreio' },
  ];

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Evento</Label>
        <Select
          value={nodeData.eventType || ''}
          onValueChange={(value) => setNodeData({ ...nodeData, eventType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_created">Pedido Criado</SelectItem>
            <SelectItem value="order_confirmed">Pedido Confirmado</SelectItem>
            <SelectItem value="order_preparing">Pedido em Preparo</SelectItem>
            <SelectItem value="order_delivering">Pedido em Entrega</SelectItem>
            <SelectItem value="order_delivered">Pedido Entregue</SelectItem>
            <SelectItem value="order_cancelled">Pedido Cancelado</SelectItem>
            <SelectItem value="user_registered">Novo Cadastro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-3 bg-orange-50 rounded-lg">
        <p className="text-sm text-orange-800">
          Este gatilho será acionado automaticamente quando o evento selecionado ocorrer.
        </p>
      </div>
    </div>
  );

  const renderSmsConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Mensagem SMS</Label>
        <Textarea
          value={nodeData.message || ''}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder="Digite a mensagem do SMS..."
          rows={4}
          maxLength={160}
        />
        <div className="flex justify-between text-xs">
          <span className={messageLength > 160 ? 'text-red-600' : 'text-gray-500'}>
            {messageLength}/160 caracteres
          </span>
          {messageLength > 160 && (
            <span className="text-red-600">SMS será dividido em múltiplas mensagens</span>
          )}
        </div>
      </div>

      {/* Variáveis disponíveis */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500">Variáveis disponíveis (clique para inserir)</Label>
        <div className="flex flex-wrap gap-1">
          {smsVariables.map((v) => (
            <Badge
              key={v.var}
              variant="outline"
              className="cursor-pointer hover:bg-green-50 text-xs"
              onClick={() => handleMessageChange((nodeData.message || '') + v.var)}
              title={v.desc}
            >
              {v.var}
            </Badge>
          ))}
        </div>
      </div>

      {/* Exemplo de mensagem */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Exemplo:</p>
        <p className="text-sm text-gray-700">
          {(nodeData.message || 'Olá {{customerName}}, seu pedido #{{orderNumber}} está a caminho!')
            .replace('{{customerName}}', 'João')
            .replace('{{orderNumber}}', '1234')
            .replace('{{orderTotal}}', '€25,50')
            .replace('{{estimatedTime}}', '30 minutos')
            .replace('{{trackingUrl}}', 'sushi.app/track/abc')}
        </p>
      </div>
    </div>
  );

  const renderDelayConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tempo</Label>
          <Input
            type="number"
            min="1"
            value={nodeData.delayValue || 5}
            onChange={(e) => setNodeData({ ...nodeData, delayValue: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Select
            value={nodeData.delayType || 'minutes'}
            onValueChange={(value) => setNodeData({ ...nodeData, delayType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutos</SelectItem>
              <SelectItem value="hours">Horas</SelectItem>
              <SelectItem value="days">Dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          O fluxo aguardará {nodeData.delayValue || 5} {nodeData.delayType === 'hours' ? 'hora(s)' : nodeData.delayType === 'days' ? 'dia(s)' : 'minuto(s)'} antes de continuar.
        </p>
      </div>
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Condição</Label>
        <Select
          value={nodeData.conditionType || 'has_phone'}
          onValueChange={(value) => setNodeData({ ...nodeData, conditionType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="has_phone">Cliente tem telefone</SelectItem>
            <SelectItem value="order_value">Valor do pedido</SelectItem>
            <SelectItem value="order_count">Quantidade de pedidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {nodeData.conditionType !== 'has_phone' && (
        <>
          <div className="space-y-2">
            <Label>Operador</Label>
            <Select
              value={nodeData.operator || 'greater_than'}
              onValueChange={(value) => setNodeData({ ...nodeData, operator: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greater_than">Maior que</SelectItem>
                <SelectItem value="less_than">Menor que</SelectItem>
                <SelectItem value="equals">Igual a</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Valor</Label>
            <Input
              type="number"
              value={nodeData.value || 0}
              onChange={(e) => setNodeData({ ...nodeData, value: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </>
      )}

      <div className="p-3 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-800">
          O fluxo seguirá caminhos diferentes com base nesta condição.
        </p>
      </div>
    </div>
  );

  const renderNodeConfig = () => {
    switch (selectedNode.type) {
      case 'trigger':
        return renderTriggerConfig();
      case 'sms':
        return renderSmsConfig();
      case 'delay':
        return renderDelayConfig();
      case 'condition':
        return renderConditionConfig();
      default:
        return <p className="text-gray-500">Nenhuma configuração disponível</p>;
    }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-[#2a1e14] border-l border-[#e5d5b5] dark:border-[#3d2e1f] shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#e5d5b5] dark:border-[#3d2e1f] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
            <IconComponent className={`h-5 w-5 ${typeInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold">{nodeData.label || selectedNode.type}</h3>
            <Badge variant="outline" className="text-xs">
              {typeInfo.label}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Nome do nó */}
          <div className="space-y-2">
            <Label>Nome do Nó</Label>
            <Input
              value={nodeData.label || ''}
              onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
              placeholder="Nome descritivo..."
            />
          </div>

          {/* Configurações específicas */}
          {renderNodeConfig()}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#e5d5b5] dark:border-[#3d2e1f] flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          Salvar
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Save, Trash2, Plus, Tag, Percent } from 'lucide-react';
import { toast } from 'sonner';

interface NodeConfigPanelProps {
  selectedNode: Node;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
  templates?: Array<{ id: string; name: string; subject: string }>;
}

export default function NodeConfigPanel({
  selectedNode,
  onClose,
  onUpdate,
  templates = []
}: NodeConfigPanelProps) {
  const [config, setConfig] = useState(selectedNode.data);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setConfig(selectedNode.data);
  }, [selectedNode.data]);

  const handleSave = () => {
    onUpdate(selectedNode.id, config);
    toast.success('Configuração salva!');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !config.tags?.includes(newTag.trim())) {
      setConfig({
        ...config,
        tags: [...(config.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setConfig({
      ...config,
      tags: config.tags?.filter((tag: string) => tag !== tagToRemove)
    });
  };

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="eventType">Tipo de Evento</Label>
        <Select
          value={config.eventType || ''}
          onValueChange={(value) => setConfig({ ...config, eventType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_created">Novo Pedido</SelectItem>
            <SelectItem value="cart_abandoned">Carrinho Abandonado</SelectItem>
            <SelectItem value="user_registered">Novo Cadastro</SelectItem>
            <SelectItem value="order_delivered">Pedido Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.eventType === 'cart_abandoned' && (
        <div>
          <Label htmlFor="waitMinutes">Tempo de Espera (minutos)</Label>
          <Input
            id="waitMinutes"
            type="number"
            value={config.waitMinutes || 30}
            onChange={(e) => setConfig({ ...config, waitMinutes: parseInt(e.target.value) })}
            min="1"
            max="1440"
          />
        </div>
      )}
    </div>
  );

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="templateId">Template de Email</Label>
        <Select
          value={config.templateId || ''}
          onValueChange={(value) => {
            const template = templates.find(t => t.id === value);
            setConfig({
              ...config,
              templateId: value,
              templateName: template?.name,
              subject: template?.subject
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Assunto do Email</Label>
        <Input
          id="subject"
          value={config.subject || ''}
          onChange={(e) => setConfig({ ...config, subject: e.target.value })}
          placeholder="Assunto personalizado (opcional)"
        />
      </div>

      <div>
        <Label htmlFor="customContent">Conteúdo Personalizado</Label>
        <Textarea
          id="customContent"
          value={config.customContent || ''}
          onChange={(e) => setConfig({ ...config, customContent: e.target.value })}
          placeholder="Conteúdo adicional (opcional)"
          rows={4}
        />
      </div>
    </div>
  );

  const renderDelayConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="delayValue">Valor do Delay</Label>
        <Input
          id="delayValue"
          type="number"
          value={config.delayValue || 60}
          onChange={(e) => setConfig({ ...config, delayValue: parseInt(e.target.value) })}
          min="1"
        />
      </div>

      <div>
        <Label htmlFor="delayType">Unidade de Tempo</Label>
        <Select
          value={config.delayType || 'minutes'}
          onValueChange={(value) => setConfig({ ...config, delayType: value })}
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
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="conditionType">Tipo de Condição</Label>
        <Select
          value={config.conditionType || ''}
          onValueChange={(value) => setConfig({ ...config, conditionType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_value">Valor do Pedido</SelectItem>
            <SelectItem value="order_items">Quantidade de Itens</SelectItem>
            <SelectItem value="customer_type">Tipo de Cliente</SelectItem>
            <SelectItem value="time_since_registration">Tempo desde Cadastro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="operator">Operador</Label>
        <Select
          value={config.operator || ''}
          onValueChange={(value) => setConfig({ ...config, operator: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o operador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Igual (=)</SelectItem>
            <SelectItem value="not_equals">Diferente (≠)</SelectItem>
            <SelectItem value="greater_than">Maior que (&gt;)</SelectItem>
            <SelectItem value="less_than">Menor que (&lt;)</SelectItem>
            <SelectItem value="contains">Contém</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="value">Valor</Label>
        <Input
          id="value"
          value={config.value || ''}
          onChange={(e) => setConfig({ ...config, value: e.target.value })}
          placeholder="Digite o valor para comparação"
        />
      </div>
    </div>
  );

  const renderActionConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="actionType">Tipo de Ação</Label>
        <Select
          value={config.actionType || ''}
          onValueChange={(value) => setConfig({ ...config, actionType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="update_tags">Atualizar Tags do Cliente</SelectItem>
            <SelectItem value="apply_discount">Aplicar Desconto</SelectItem>
            <SelectItem value="end_flow">Finalizar Fluxo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.actionType === 'update_tags' && (
        <div className="space-y-3">
          <Label>Tags do Cliente</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Digite uma tag"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button type="button" onClick={handleAddTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.tags?.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {config.actionType === 'apply_discount' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="discountType">Tipo de Desconto</Label>
            <Select
              value={config.discountType || 'percentage'}
              onValueChange={(value) => setConfig({ ...config, discountType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="discountValue">Valor do Desconto</Label>
            <Input
              id="discountValue"
              type="number"
              value={config.discountValue || 0}
              onChange={(e) => setConfig({ ...config, discountValue: parseFloat(e.target.value) })}
              min="0"
              step={config.discountType === 'percentage' ? '1' : '0.01'}
            />
          </div>

          <div>
            <Label htmlFor="expiresIn">Expira em (dias)</Label>
            <Input
              id="expiresIn"
              type="number"
              value={config.expiresIn || 7}
              onChange={(e) => setConfig({ ...config, expiresIn: parseInt(e.target.value) })}
              min="1"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderConfig = () => {
    switch (selectedNode.type) {
      case 'trigger':
        return renderTriggerConfig();
      case 'email':
        return renderEmailConfig();
      case 'delay':
        return renderDelayConfig();
      case 'condition':
        return renderConditionConfig();
      case 'action':
        return renderActionConfig();
      default:
        return <p className="text-gray-500">Este tipo de nó não tem configurações.</p>;
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Configurar Nó</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {selectedNode.data.label}
              <Badge variant="outline" className="text-xs">
                {selectedNode.type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderConfig()}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <Button onClick={handleSave} className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90">
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
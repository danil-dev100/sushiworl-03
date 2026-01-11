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
import { TemplateVariables } from './TemplateVariables';

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
    onClose(); // Fechar o modal automaticamente após salvar
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
            <SelectItem value="order_scheduled">Pedido Agendado</SelectItem>
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

  const renderEmailConfig = () => {
    console.log('Rendering email config. Templates available:', templates.length);
    console.log('Templates:', templates);

    return (
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
              {templates.length === 0 ? (
                <SelectItem value="no-templates" disabled>
                  Nenhum template disponível
                </SelectItem>
              ) : (
                templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))
              )}
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

        {/* Seção de Desconto e Cupom */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Cupom de Desconto</Label>
            <Badge variant="secondary" className="text-xs">Opcional</Badge>
          </div>

          <div>
            <Label htmlFor="discountPercentage" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Desconto (%)
            </Label>
            <Input
              id="discountPercentage"
              type="number"
              value={config.discountPercentage || ''}
              onChange={(e) => setConfig({ ...config, discountPercentage: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Ex: 10, 15, 20"
              min="1"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">Deixe vazio para não aplicar desconto</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="freeShipping">Frete Grátis</Label>
              <p className="text-xs text-gray-500">Aplicar frete grátis no cupom</p>
            </div>
            <Switch
              id="freeShipping"
              checked={config.freeShipping || false}
              onCheckedChange={(checked) => setConfig({ ...config, freeShipping: checked })}
            />
          </div>

          <div>
            <Label htmlFor="couponValidity">Validade do Cupom (horas)</Label>
            <Select
              value={String(config.couponValidity || 24)}
              onValueChange={(value) => setConfig({ ...config, couponValidity: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 horas</SelectItem>
                <SelectItem value="24">24 horas (1 dia)</SelectItem>
                <SelectItem value="48">48 horas (2 dias)</SelectItem>
                <SelectItem value="72">72 horas (3 dias)</SelectItem>
                <SelectItem value="168">168 horas (7 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(config.discountPercentage || config.freeShipping) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>ℹ️ Cupom será gerado automaticamente</strong>
                <br />
                O cupom será único por cliente e aplicado automaticamente no link de checkout enviado por email.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDelayConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="delayMode">Modo de Delay</Label>
        <Select
          value={config.delayMode || 'fixed'}
          onValueChange={(value) => setConfig({ ...config, delayMode: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Tempo Fixo</SelectItem>
            <SelectItem value="before_scheduled">Antes do Horário Agendado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.delayMode === 'before_scheduled' ? (
        <>
          <div>
            <Label htmlFor="beforeValue">Enviar Quantos Minutos/Horas Antes</Label>
            <Input
              id="beforeValue"
              type="number"
              value={config.beforeValue || 60}
              onChange={(e) => setConfig({ ...config, beforeValue: parseInt(e.target.value) })}
              min="10"
              max="1440"
            />
          </div>

          <div>
            <Label htmlFor="beforeUnit">Unidade</Label>
            <Select
              value={config.beforeUnit || 'minutes'}
              onValueChange={(value) => setConfig({ ...config, beforeUnit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutos</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>ℹ️ Delay Dinâmico</strong>
              <br />
              O email será enviado {config.beforeValue || 60} {config.beforeUnit === 'hours' ? 'hora(s)' : 'minuto(s)'} antes do horário agendado do pedido.
            </p>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
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
            <SelectItem value="__group_cart" disabled className="font-semibold text-gray-900">
              📦 Pedido / Carrinho
            </SelectItem>
            <SelectItem value="cart_value">Valor do Carrinho</SelectItem>
            <SelectItem value="cart_items_count">Quantidade de Itens</SelectItem>
            <SelectItem value="cart_has_product">Contém Produto Específico</SelectItem>
            <SelectItem value="cart_has_category">Contém Categoria</SelectItem>
            <SelectItem value="cart_has_coupon">Cupom Aplicado</SelectItem>
            <SelectItem value="shipping_value">Valor do Frete</SelectItem>

            <SelectItem value="__group_customer" disabled className="font-semibold text-gray-900 mt-2">
              👤 Cliente
            </SelectItem>
            <SelectItem value="is_first_order">Primeira Compra</SelectItem>
            <SelectItem value="has_ordered_before">Já Comprou Antes</SelectItem>
            <SelectItem value="total_orders">Total de Pedidos</SelectItem>
            <SelectItem value="total_spent">Total Gasto Histórico</SelectItem>
            <SelectItem value="days_inactive">Cliente Inativo há X Dias</SelectItem>

            <SelectItem value="__group_time" disabled className="font-semibold text-gray-900 mt-2">
              🕐 Tempo / Comportamento
            </SelectItem>
            <SelectItem value="time_since_abandoned">Tempo desde Abandono (min)</SelectItem>
            <SelectItem value="day_of_week">Dia da Semana</SelectItem>
            <SelectItem value="hour_of_day">Horário do Dia</SelectItem>
            <SelectItem value="device_type">Dispositivo (mobile/desktop)</SelectItem>

            <SelectItem value="__group_marketing" disabled className="font-semibold text-gray-900 mt-2">
              📊 Marketing
            </SelectItem>
            <SelectItem value="utm_source">UTM Source</SelectItem>
            <SelectItem value="utm_campaign">UTM Campaign</SelectItem>
            <SelectItem value="received_discount_before">Já Recebeu Desconto</SelectItem>
            <SelectItem value="opened_email">Abriu Email Anterior</SelectItem>
            <SelectItem value="clicked_email">Clicou em Email Anterior</SelectItem>
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
            <SelectItem value="greater_or_equal">Maior ou Igual (≥)</SelectItem>
            <SelectItem value="less_or_equal">Menor ou Igual (≤)</SelectItem>
            <SelectItem value="contains">Contém</SelectItem>
            <SelectItem value="not_contains">Não Contém</SelectItem>
            <SelectItem value="is_true">É Verdadeiro</SelectItem>
            <SelectItem value="is_false">É Falso</SelectItem>
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
        <p className="text-xs text-gray-500 mt-1">
          {config.conditionType === 'day_of_week' && 'Ex: Segunda, Terça, etc.'}
          {config.conditionType === 'device_type' && 'mobile ou desktop'}
          {config.conditionType === 'cart_has_product' && 'ID do produto'}
          {config.conditionType === 'cart_has_category' && 'Nome da categoria'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="space-y-0.5">
          <Label htmlFor="conditionActive">Condição Ativa</Label>
          <p className="text-xs text-gray-500">Desative para ignorar esta condição</p>
        </div>
        <Switch
          id="conditionActive"
          checked={config.conditionActive !== false}
          onCheckedChange={(checked) => setConfig({ ...config, conditionActive: checked })}
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
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold">Configurar Nó</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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

        {/* Mostrar variáveis disponíveis apenas para nó de email */}
        {selectedNode.type === 'email' && (
          <TemplateVariables />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white flex gap-2">
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
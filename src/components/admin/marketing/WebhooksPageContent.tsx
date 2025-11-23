'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { TooltipHelper } from '@/components/shared/TooltipHelper';
import { Loader2, Trash2, Edit, Eye, Play, Plus, RefreshCw, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';

type CurrentUser = {
  id: string;
  role: string;
  managerLevel: string | null;
};

type Webhook = {
  id: string;
  name: string;
  url: string;
  method: string;
  direction: 'INBOUND' | 'OUTBOUND';
  events: string[];
  headers: Record<string, string> | null;
  secret: string | null;
  isActive: boolean;
  lastTriggeredAt: Date | null;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type WebhookLog = {
  id: string;
  webhookId: string;
  event: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  statusCode: number | null;
  errorMessage: string | null;
  duration: number | null;
  triggeredAt: Date;
  webhook: {
    name: string;
    url: string;
  };
};

interface WebhooksPageContentProps {
  currentUser: CurrentUser;
  webhooks: Webhook[];
  logs: WebhookLog[];
}

const AVAILABLE_EVENTS = [
  { id: 'order.created', label: 'Pedido Criado', description: 'Quando um novo pedido é criado' },
  { id: 'order.confirmed', label: 'Pedido Confirmado', description: 'Quando um pedido é aceito' },
  { id: 'order.cancelled', label: 'Pedido Cancelado', description: 'Quando um pedido é cancelado' },
  { id: 'order.preparing', label: 'Pedido em Preparo', description: 'Quando o pedido começa a ser preparado' },
  { id: 'order.delivering', label: 'Pedido em Entrega', description: 'Quando o pedido sai para entrega' },
  { id: 'order.delivered', label: 'Pedido Entregue', description: 'Quando o pedido é entregue' },
  { id: 'payment.confirmed', label: 'Pagamento Confirmado', description: 'Quando um pagamento é confirmado' },
  { id: 'customer.created', label: 'Cliente Cadastrado', description: 'Quando um novo cliente se cadastra' },
];

const HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH'];

export function WebhooksPageContent({
  currentUser,
  webhooks: initialWebhooks,
  logs: initialLogs,
}: WebhooksPageContentProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('receber');
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [logs, setLogs] = useState<WebhookLog[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogType, setDialogType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    events: [] as string[],
    secret: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      events: [],
      secret: '',
      isActive: true,
    });
    setEditingWebhook(null);
  };

  const openCreateDialog = (type: 'INBOUND' | 'OUTBOUND') => {
    resetForm();
    setDialogType(type);
    setDialogMode('create');
    setShowDialog(true);
  };

  const openEditDialog = (webhook: Webhook) => {
    setFormData({
      name: webhook.name,
      url: webhook.url,
      method: webhook.method,
      events: webhook.events,
      secret: webhook.secret || '',
      isActive: webhook.isActive,
    });
    setEditingWebhook(webhook);
    setDialogType(webhook.direction);
    setDialogMode('edit');
    setShowDialog(true);
  };

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/marketing/webhooks');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks);
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const action = dialogMode === 'create' ? 'create_webhook' : 'update_webhook';
      const response = await fetch('/api/admin/marketing/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: {
            ...(editingWebhook && { id: editingWebhook.id }),
            name: formData.name,
            url: formData.url,
            method: formData.method,
            events: formData.events,
            secret: formData.secret || null,
            isActive: formData.isActive,
            direction: dialogType,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: dialogMode === 'create' ? 'Webhook criado com sucesso' : 'Webhook atualizado com sucesso',
        });
        setShowDialog(false);
        resetForm();
        await refreshData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar webhook');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/marketing/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_webhook',
          data: { id: deleteId },
        }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Webhook removido com sucesso',
        });
        setShowDeleteDialog(false);
        setDeleteId(null);
        await refreshData();
      } else {
        throw new Error('Erro ao remover webhook');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      const response = await fetch('/api/admin/marketing/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_webhook',
          data: {
            id: webhook.id,
            name: webhook.name,
            url: webhook.url,
            method: webhook.method,
            events: webhook.events,
            isActive: !webhook.isActive,
          },
        }),
      });

      if (response.ok) {
        await refreshData();
        toast({
          title: 'Sucesso',
          description: `Webhook ${!webhook.isActive ? 'ativado' : 'desativado'}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do webhook',
        variant: 'destructive',
      });
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const response = await fetch('/api/admin/marketing/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_webhook',
          data: { id: webhookId },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Teste enviado',
          description: result.message || 'Webhook testado com sucesso',
        });
        await refreshData();
      } else {
        throw new Error(result.error || 'Erro ao testar webhook');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao testar webhook',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado',
      description: 'URL copiada para a área de transferência',
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const inboundWebhooks = webhooks.filter(w => w.direction === 'INBOUND');
  const outboundWebhooks = webhooks.filter(w => w.direction === 'OUTBOUND');

  const WebhookCard = ({ webhook }: { webhook: Webhook }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {webhook.name}
              <Badge variant={webhook.isActive ? 'default' : 'secondary'} className={webhook.isActive ? 'bg-green-600' : ''}>
                {webhook.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Criado em {formatDate(webhook.createdAt)}
            </CardDescription>
          </div>
          <Switch
            checked={webhook.isActive}
            onCheckedChange={() => handleToggleActive(webhook)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">URL</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 break-all flex-1">
              {webhook.url}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(webhook.url)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Método</p>
          <Badge variant="outline" className="mt-1">{webhook.method}</Badge>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {webhook.direction === 'INBOUND' ? 'Eventos Escutados' : 'Eventos que Disparam'}
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {webhook.events.map(event => (
              <Badge
                key={event}
                variant="outline"
                className={webhook.direction === 'OUTBOUND' ? 'bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/30' : ''}
              >
                {event}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500">Sucesso</p>
            <p className="text-lg font-semibold text-green-600">{webhook.successCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Falhas</p>
            <p className="text-lg font-semibold text-red-600">{webhook.failureCount}</p>
          </div>
        </div>

        {webhook.lastTriggeredAt && (
          <div className="text-xs text-gray-500">
            Último disparo: {formatDate(webhook.lastTriggeredAt)}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => handleTestWebhook(webhook.id)}>
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Testar webhook</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(webhook)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    setDeleteId(webhook.id);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remover</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-4xl font-black text-[#FF6B00]">Configuração de Webhooks</h1>
            <p className="mt-1 text-sm text-[#a16b45]">
              Configure webhooks para integração com plataformas externas
            </p>
          </div>
          <TooltipHelper text="Sistema de webhooks para integração automática com plataformas externas. Receba e envie dados em tempo real sobre pedidos e eventos do negócio" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <TooltipHelper text="Atualize os dados dos webhooks e logs mais recentes" />
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">Gerenciamento de Webhooks</span>
          <TooltipHelper text="Gerencie webhooks de entrada (recebidos de outras plataformas) e saída (enviados para outras plataformas)" />
        </div>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receber" className="flex items-center gap-2">
            Receber Webhooks ({inboundWebhooks.length})
            <TooltipHelper text="Webhooks que você recebe de plataformas externas quando ocorrem eventos específicos" />
          </TabsTrigger>
          <TabsTrigger value="enviar" className="flex items-center gap-2">
            Enviar Webhooks ({outboundWebhooks.length})
            <TooltipHelper text="Webhooks que você envia para plataformas externas quando ocorrem eventos no seu negócio" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-6">
          {inboundWebhooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {inboundWebhooks.map(webhook => (
                <WebhookCard key={webhook.id} webhook={webhook} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Nenhum webhook de entrada configurado</p>
              <p className="text-sm text-gray-400 mt-1">
                Configure webhooks para receber dados de plataformas externas
              </p>
            </Card>
          )}

          <div className="flex justify-center items-center gap-2">
            <Button
              onClick={() => openCreateDialog('INBOUND')}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Webhook de Entrada
            </Button>
            <TooltipHelper text="Configure um webhook para receber dados de plataformas externas quando eventos específicos ocorrerem" />
          </div>
        </TabsContent>

        <TabsContent value="enviar" className="space-y-6">
          {outboundWebhooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {outboundWebhooks.map(webhook => (
                <WebhookCard key={webhook.id} webhook={webhook} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Nenhum webhook de saída configurado</p>
              <p className="text-sm text-gray-400 mt-1">
                Configure webhooks para enviar dados para sistemas externos
              </p>
            </Card>
          )}

          <div className="flex justify-center items-center gap-2">
            <Button
              onClick={() => openCreateDialog('OUTBOUND')}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Webhook de Saída
            </Button>
            <TooltipHelper text="Configure um webhook para enviar dados automaticamente para plataformas externas quando eventos ocorrerem no sistema" />
          </div>
        </TabsContent>
      </Tabs>

      {/* Status dos Últimos Disparos */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">Monitoramento de Webhooks</span>
        <TooltipHelper text="Acompanhe o histórico de execuções, status de sucesso/falha e performance dos seus webhooks" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Status dos Últimos Disparos</CardTitle>
            <TooltipHelper text="Histórico detalhado de todas as execuções dos webhooks com status, duração e mensagens de erro" />
          </div>
          <CardDescription>
            Histórico de execuções dos webhooks configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Resposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.status === 'SUCCESS' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Sucesso</span>
                            </>
                          )}
                          {log.status === 'FAILED' && (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Falha</span>
                            </>
                          )}
                          {log.status === 'PENDING' && (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className="text-yellow-600">Pendente</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.webhook.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.event}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {formatDate(log.triggeredAt)}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {log.duration ? `${log.duration}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        {log.statusCode ? (
                          <span className={log.statusCode >= 200 && log.statusCode < 300 ? 'text-green-600' : 'text-red-600'}>
                            {log.statusCode}
                          </span>
                        ) : log.errorMessage ? (
                          <span className="text-red-600 text-sm">{log.errorMessage}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Nenhum log de webhook disponível
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar webhook */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Adicionar' : 'Editar'} Webhook de {dialogType === 'INBOUND' ? 'Entrada' : 'Saída'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'INBOUND'
                ? 'Configure um endpoint para receber dados externos'
                : 'Configure um endpoint para enviar dados do sistema'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Webhook *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: iFood, Rappi, Sistema Parceiro"
              />
            </div>

            <div>
              <Label htmlFor="url">URL de Destino *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seu-endpoint.com/webhook"
              />
            </div>

            <div>
              <Label htmlFor="method">Método HTTP</Label>
              <Select
                value={formData.method}
                onValueChange={value => setFormData(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="secret">Secret (opcional)</Label>
              <Input
                id="secret"
                type="password"
                value={formData.secret}
                onChange={e => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Chave secreta para validação"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usado para validar a autenticidade das requisições
              </p>
            </div>

            <div>
              <Label>
                {dialogType === 'INBOUND' ? 'Eventos Escutados *' : 'Eventos que Disparam *'}
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Selecione os eventos que você deseja {dialogType === 'INBOUND' ? 'monitorar' : 'enviar'}.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {AVAILABLE_EVENTS.map(event => (
                  <div key={event.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={formData.events.includes(event.id)}
                      onCheckedChange={() => handleEventToggle(event.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                        {event.label}
                      </Label>
                      <p className="text-xs text-gray-500">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Webhook ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogMode === 'create' ? 'Criar Webhook' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este webhook? Esta ação não pode ser desfeita.
              Todos os logs associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

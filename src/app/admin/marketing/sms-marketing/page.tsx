'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Zap,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  Send,
  Smartphone,
  Settings,
  Gift,
  Ticket
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SmsAutomation {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType?: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  nodesCount: number;
  edgesCount: number;
}

export default function SMSMarketingPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<SmsAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [smsConfigured, setSmsConfigured] = useState(false);

  useEffect(() => {
    loadAutomations();
    checkSmsConfig();
  }, []);

  const checkSmsConfig = async () => {
    try {
      const response = await fetch('/api/sms/settings');
      if (response.ok) {
        const data = await response.json();
        setSmsConfigured(data.settings?.isActive || false);
      }
    } catch (error) {
      console.error('Erro ao verificar configuração SMS:', error);
    }
  };

  const loadAutomations = async () => {
    try {
      const response = await fetch('/api/sms/automations');
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations || []);
      } else {
        // Dados mock para desenvolvimento
        setAutomations([
          {
            id: '1',
            name: 'Confirmação de Pedido',
            description: 'Envia SMS confirmando que o pedido foi recebido',
            isActive: true,
            triggerType: 'order_created',
            totalExecutions: 320,
            successCount: 315,
            failureCount: 5,
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-20T15:30:00Z',
            nodesCount: 2,
            edgesCount: 1,
          },
          {
            id: '2',
            name: 'Pedido a Caminho',
            description: 'Notifica o cliente quando o entregador saiu',
            isActive: true,
            triggerType: 'order_delivering',
            totalExecutions: 180,
            successCount: 178,
            failureCount: 2,
            createdAt: '2025-01-18T08:15:00Z',
            updatedAt: '2025-01-22T12:45:00Z',
            nodesCount: 2,
            edgesCount: 1,
          },
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
      toast.error('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAutomation = (automationId: string) => {
    router.push(`/admin/marketing/sms-marketing/builder/${automationId}`);
  };

  const handleDuplicateAutomation = async (automationId: string) => {
    try {
      const response = await fetch(`/api/sms/automations/${automationId}/duplicate`, {
        method: 'POST',
      });
      if (response.ok) {
        toast.success('Automação duplicada com sucesso!');
        loadAutomations();
      } else {
        toast.error('Erro ao duplicar automação');
      }
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error('Erro ao duplicar automação');
    }
  };

  const handleToggleActive = async (automationId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/sms/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        toast.success(currentStatus ? 'Automação desativada' : 'Automação ativada');
        loadAutomations();
      } else {
        toast.error('Erro ao alterar status da automação');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da automação');
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sms/automations/${automationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Automação excluída com sucesso!');
        loadAutomations();
      } else {
        toast.error('Erro ao excluir automação');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir automação');
    }
  };

  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (automation.description?.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = automation.isActive;
    if (statusFilter === 'inactive') matchesStatus = !automation.isActive;

    return matchesSearch && matchesStatus;
  });

  const sortedAutomations = [...filteredAutomations].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updatedAt':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const getStatusBadge = (automation: SmsAutomation) => {
    if (automation.isActive) {
      return <Badge variant="default" className="bg-green-600 hover:bg-green-600">Ativo</Badge>;
    }
    return <Badge variant="secondary">Inativo</Badge>;
  };

  const getSuccessRate = (automation: SmsAutomation) => {
    if (automation.totalExecutions === 0) return 0;
    return Math.round((automation.successCount / automation.totalExecutions) * 100);
  };

  const getTriggerLabel = (triggerType?: string) => {
    const labels: Record<string, string> = {
      'order_created': 'Pedido Criado',
      'order_confirmed': 'Pedido Confirmado',
      'order_preparing': 'Pedido em Preparo',
      'order_delivering': 'Pedido em Entrega',
      'order_delivered': 'Pedido Entregue',
      'order_cancelled': 'Pedido Cancelado',
      'scheduled': 'Agendado',
      'manual': 'Manual',
    };
    return labels[triggerType || ''] || triggerType || 'Não definido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smartphone className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#FF6B00]">SMS Marketing</h1>
            <p className="text-gray-600 mt-1">
              Automatize suas campanhas de SMS e notificações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/marketing/sms-marketing/campanhas')}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Gift className="h-4 w-4 mr-2" />
            Campanhas Promocionais
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/marketing/sms-marketing/settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button
            onClick={() => router.push('/admin/marketing/sms-marketing/builder/new')}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            disabled={!smsConfigured}
            title={!smsConfigured ? 'Configure o SMS primeiro' : undefined}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Automação
          </Button>
        </div>
      </div>

      {/* Warning if SMS not configured */}
      {!smsConfigured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">SMS não configurado</p>
                <p className="text-sm text-yellow-800">
                  Configure o provedor de SMS (Twilio ou D7) nas configurações para criar automações.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => router.push('/admin/marketing/sms-marketing/settings')}
              >
                Configurar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Automações</p>
                <p className="text-2xl font-bold">{automations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Automações Ativas</p>
                <p className="text-2xl font-bold">{automations.filter(a => a.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">SMS Enviados</p>
                <p className="text-2xl font-bold">{automations.reduce((acc, a) => acc + a.totalExecutions, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {automations.length > 0
                    ? Math.round(automations.reduce((acc, a) => acc + getSuccessRate(a), 0) / automations.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar automações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Última Modificação</SelectItem>
                <SelectItem value="createdAt">Data de Criação</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Automations List */}
      <div className="space-y-4">
        {sortedAutomations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhuma automação encontrada
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar seus filtros de busca'
                  : 'Crie sua primeira automação de SMS'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && smsConfigured && (
                <Button
                  onClick={() => router.push('/admin/marketing/sms-marketing/builder/new')}
                  className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Automação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedAutomations.map((automation) => (
            <Card key={automation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      automation.isActive
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {automation.isActive ? (
                        <Play className="h-6 w-6" />
                      ) : (
                        <Pause className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{automation.name}</h3>
                      <p className="text-sm text-gray-600">{automation.description || 'Sem descrição'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {getTriggerLabel(automation.triggerType)}
                        </Badge>
                        <span>{automation.nodesCount} nós</span>
                        <span>Atualizado {new Date(automation.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Métricas */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Send className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{automation.totalExecutions}</span>
                        <span className="text-gray-500">enviados</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">{getSuccessRate(automation)}%</span>
                        <span className="text-gray-500">sucesso</span>
                      </div>
                      {automation.failureCount > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">{automation.failureCount}</span>
                          <span className="text-gray-500">falhas</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    {getStatusBadge(automation)}

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAutomation(automation.id)}
                        title="Editar automação"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateAutomation(automation.id)}
                        title="Duplicar automação"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(automation.id, automation.isActive)}
                        title={automation.isActive ? 'Desativar automação' : 'Ativar automação'}
                      >
                        {automation.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAutomation(automation.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir automação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

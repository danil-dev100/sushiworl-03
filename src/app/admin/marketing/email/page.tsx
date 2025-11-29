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
  Filter,
  Zap,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  Users,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EmailFlow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDraft: boolean;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  nodesCount: number;
  edgesCount: number;
}

export default function EmailMarketingPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<EmailFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const response = await fetch('/api/email-marketing/flows');
      if (response.ok) {
        const data = await response.json();
        setFlows(data.flows || []);
      } else {
        console.error('Erro ao carregar fluxos');
        // Dados mock para desenvolvimento
        setFlows([
          {
            id: '1',
            name: 'Bem-vindo ao SushiWorld',
            description: 'Fluxo de boas-vindas para novos clientes',
            isActive: true,
            isDraft: false,
            totalExecutions: 245,
            successCount: 238,
            failureCount: 7,
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-20T15:30:00Z',
            nodesCount: 3,
            edgesCount: 2,
          },
          {
            id: '2',
            name: 'Carrinho Abandonado',
            description: 'Recuperação de vendas com desconto especial',
            isActive: true,
            isDraft: false,
            totalExecutions: 156,
            successCount: 142,
            failureCount: 14,
            createdAt: '2025-01-18T08:15:00Z',
            updatedAt: '2025-01-22T12:45:00Z',
            nodesCount: 5,
            edgesCount: 4,
          },
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
      toast.error('Erro ao carregar fluxos');
    } finally {
      setLoading(false);
    }
  };


  const handleEditFlow = (flowId: string) => {
    router.push(`/admin/marketing/email-marketing/builder/${flowId}`);
  };

  const handleDuplicateFlow = async (flowId: string) => {
    try {
      const response = await fetch(`/api/email-marketing/flows/${flowId}/duplicate`, {
        method: 'POST',
      });
      if (response.ok) {
        toast.success('Fluxo duplicado com sucesso!');
        loadFlows();
      } else {
        toast.error('Erro ao duplicar fluxo');
      }
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error('Erro ao duplicar fluxo');
    }
  };

  const handleToggleActive = async (flowId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/email-marketing/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        toast.success(currentStatus ? 'Fluxo desativado' : 'Fluxo ativado');
        loadFlows();
      } else {
        toast.error('Erro ao alterar status do fluxo');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do fluxo');
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/email-marketing/flows/${flowId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Fluxo excluído com sucesso!');
        loadFlows();
      } else {
        toast.error('Erro ao excluir fluxo');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir fluxo');
    }
  };

  const filteredFlows = flows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (flow.description?.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = flow.isActive && !flow.isDraft;
    if (statusFilter === 'inactive') matchesStatus = !flow.isActive && !flow.isDraft;
    if (statusFilter === 'draft') matchesStatus = flow.isDraft;

    return matchesSearch && matchesStatus;
  });

  const sortedFlows = [...filteredFlows].sort((a, b) => {
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

  const getStatusBadge = (flow: EmailFlow) => {
    if (flow.isDraft) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Rascunho</Badge>;
    }
    if (flow.isActive) {
      return <Badge variant="default" className="bg-green-600 hover:bg-green-600">Ativo</Badge>;
    }
    return <Badge variant="secondary">Inativo</Badge>;
  };

  const getSuccessRate = (flow: EmailFlow) => {
    if (flow.totalExecutions === 0) return 0;
    return Math.round((flow.successCount / flow.totalExecutions) * 100);
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
        <div>
          <h1 className="text-3xl font-black text-[#FF6B00]">Email Marketing</h1>
          <p className="text-gray-600 mt-1">
            Automatize suas campanhas de email e aumente suas vendas
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/admin/marketing/email-marketing/builder/new'}
          className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Fluxos</p>
                <p className="text-2xl font-bold">{flows.length}</p>
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
                <p className="text-sm text-gray-600">Fluxos Ativos</p>
                <p className="text-2xl font-bold">{flows.filter(f => f.isActive).length}</p>
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
                <p className="text-sm text-gray-600">Emails Enviados</p>
                <p className="text-2xl font-bold">{flows.reduce((acc, f) => acc + f.totalExecutions, 0)}</p>
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
                  {flows.length > 0
                    ? Math.round(flows.reduce((acc, f) => acc + getSuccessRate(f), 0) / flows.length)
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
                  placeholder="Buscar fluxos..."
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
                <SelectItem value="draft">Rascunhos</SelectItem>
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

      {/* Flows List */}
      <div className="space-y-4">
        {sortedFlows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum fluxo encontrado
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar seus filtros de busca'
                  : 'Crie seu primeiro fluxo de automação de email'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => window.location.href = '/admin/marketing/email-marketing/builder/new'} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Fluxo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedFlows.map((flow) => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      flow.isActive && !flow.isDraft
                        ? 'bg-green-100 text-green-600'
                        : flow.isDraft
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {flow.isActive && !flow.isDraft ? (
                        <Play className="h-6 w-6" />
                      ) : flow.isDraft ? (
                        <Clock className="h-6 w-6" />
                      ) : (
                        <Pause className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{flow.name}</h3>
                      <p className="text-sm text-gray-600">{flow.description || 'Sem descrição'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{flow.nodesCount} nós</span>
                        <span>{flow.edgesCount} conexões</span>
                        <span>Atualizado {new Date(flow.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Métricas */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Send className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{flow.totalExecutions}</span>
                        <span className="text-gray-500">enviados</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">{getSuccessRate(flow)}%</span>
                        <span className="text-gray-500">sucesso</span>
                      </div>
                      {flow.failureCount > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">{flow.failureCount}</span>
                          <span className="text-gray-500">falhas</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    {getStatusBadge(flow)}

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditFlow(flow.id)}
                        title="Editar fluxo"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateFlow(flow.id)}
                        title="Duplicar fluxo"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(flow.id, flow.isActive)}
                        title={flow.isActive ? 'Desativar fluxo' : 'Ativar fluxo'}
                      >
                        {flow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFlow(flow.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir fluxo"
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

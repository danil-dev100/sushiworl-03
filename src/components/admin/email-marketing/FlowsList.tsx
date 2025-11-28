'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  TrendingUp,
  Mail,
  Clock,
  GitBranch,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type EmailAutomation = {
  id: string;
  name: string;
  description?: string | null;
  flow?: any;
  isActive: boolean;
  isDraft: boolean;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
};

interface FlowsListProps {
  automations: EmailAutomation[];
  onRefresh: () => void;
}

export default function FlowsList({ automations, onRefresh }: FlowsListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<EmailAutomation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Criar novo fluxo
  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/marketing/email/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Nova Automação',
          description: '',
          flow: { nodes: [], edges: [] },
          isDraft: true,
          isActive: false,
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar');

      const newFlow = await response.json();
      toast.success('Fluxo criado!');
      router.push(`/admin/marketing/email/builder/${newFlow.id}`);
    } catch (error) {
      console.error('Erro ao criar:', error);
      toast.error('Erro ao criar fluxo');
    }
  };

  // Duplicar fluxo
  const handleDuplicate = async (flow: EmailAutomation) => {
    try {
      const response = await fetch('/api/admin/marketing/email/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${flow.name} (Cópia)`,
          description: flow.description,
          flow: flow.flow,
          isDraft: true,
          isActive: false,
        }),
      });

      if (!response.ok) throw new Error('Erro ao duplicar');

      toast.success('Fluxo duplicado!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error('Erro ao duplicar fluxo');
    }
  };

  // Ativar/Desativar fluxo
  const handleToggleActive = async (flow: EmailAutomation) => {
    try {
      const response = await fetch(`/api/admin/marketing/email/automations/${flow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !flow.isActive,
        }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar');

      toast.success(flow.isActive ? 'Fluxo desativado' : 'Fluxo ativado');
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar fluxo');
    }
  };

  // Deletar fluxo
  const handleDelete = async () => {
    if (!selectedFlow) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/marketing/email/automations/${selectedFlow.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar');

      toast.success('Fluxo deletado!');
      setDeleteDialogOpen(false);
      setSelectedFlow(null);
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar fluxo');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calcular estatísticas do fluxo
  const getFlowStats = (flow: EmailAutomation) => {
    const nodes = flow.flow?.nodes || [];
    const edges = flow.flow?.edges || [];

    const triggers = nodes.filter((n: any) => n.type === 'trigger');
    const emails = nodes.filter((n: any) => n.type === 'email');
    const delays = nodes.filter((n: any) => n.type === 'delay');
    const conditions = nodes.filter((n: any) => n.type === 'condition');

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      triggers: triggers.length,
      emails: emails.length,
      delays: delays.length,
      conditions: conditions.length,
      successRate:
        flow.totalExecutions > 0
          ? Math.round((flow.successCount / flow.totalExecutions) * 100)
          : 0,
    };
  };

  if (automations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nenhum fluxo criado ainda
        </h3>
        <p className="text-gray-500 mb-6">
          Crie seu primeiro fluxo de email marketing
        </p>
        <Button onClick={handleCreate} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
          <Plus className="w-4 h-4 mr-2" />
          Criar Primeiro Fluxo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Fluxos de Email Marketing
          </h2>
          <p className="text-gray-500">
            {automations.length} {automations.length === 1 ? 'fluxo criado' : 'fluxos criados'}
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
          <Plus className="w-4 h-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Lista de Fluxos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((flow) => {
          const stats = getFlowStats(flow);

          return (
            <Card
              key={flow.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#FF6B00]"
              onClick={() => router.push(`/admin/marketing/email/builder/${flow.id}`)}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {flow.name}
                  </h3>
                  {flow.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{flow.description}</p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/marketing/email/builder/${flow.id}`);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(flow);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFlow(flow);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                {flow.isDraft && (
                  <Badge variant="outline" className="text-gray-600">
                    Rascunho
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={flow.isActive ? 'bg-green-50 text-green-700 border-green-200' : ''}
                >
                  {flow.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">Nós</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.totalNodes}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">Conexões</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.totalEdges}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">Execuções</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {flow.totalExecutions}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-500">Taxa de Sucesso</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.successRate}%
                  </div>
                </div>
              </div>

              {/* Componentes */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                {stats.triggers > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stats.triggers}
                  </div>
                )}
                {stats.emails > 0 && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {stats.emails}
                  </div>
                )}
                {stats.delays > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stats.delays}
                  </div>
                )}
                {stats.conditions > 0 && (
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {stats.conditions}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-gray-500">
                  {format(new Date(flow.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>

                <Switch
                  checked={flow.isActive}
                  onCheckedChange={(checked) => {
                    handleToggleActive(flow);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Confirmação de Deleção */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Fluxo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o fluxo "{selectedFlow?.name}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

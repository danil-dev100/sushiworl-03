'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  type: 'financial' | 'operational' | 'marketing' | 'customer';
  unit: string;
  isActive: boolean;
  createdAt: Date;
}

interface CustomMetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const METRIC_TEMPLATES = [
  {
    name: 'LTV (Lifetime Value)',
    description: 'Valor de vida do cliente',
    formula: '(ticket_medio * frequencia_compras) * tempo_relacionamento',
    type: 'customer' as const,
    unit: '€',
  },
  {
    name: 'CAC (Custo Aquisição Cliente)',
    description: 'Custo para adquirir um novo cliente',
    formula: 'total_investido_marketing / novos_clientes',
    type: 'marketing' as const,
    unit: '€',
  },
  {
    name: 'Margem de Lucro',
    description: 'Percentual de lucro sobre vendas',
    formula: '((receita_total - custos_totais) / receita_total) * 100',
    type: 'financial' as const,
    unit: '%',
  },
  {
    name: 'Taxa de Retenção',
    description: 'Percentual de clientes que retornam',
    formula: '(clientes_recorrentes / total_clientes) * 100',
    type: 'customer' as const,
    unit: '%',
  },
  {
    name: 'ROAS (Return on Ad Spend)',
    description: 'Retorno sobre investimento em anúncios',
    formula: 'receita_atribuida_anuncios / investimento_anuncios',
    type: 'marketing' as const,
    unit: 'x',
  },
];

export function CustomMetricsDialog({ open, onOpenChange }: CustomMetricsDialogProps) {
  const [metrics, setMetrics] = useState<CustomMetric[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newMetric, setNewMetric] = useState<{
    name: string;
    description: string;
    formula: string;
    type: 'financial' | 'operational' | 'marketing' | 'customer';
    unit: string;
  }>({
    name: '',
    description: '',
    formula: '',
    type: 'financial',
    unit: '€',
  });

  useEffect(() => {
    if (open) {
      loadCustomMetrics();
    }
  }, [open]);

  const loadCustomMetrics = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/custom-metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas customizadas:', error);
    }
  };

  const handleCreateMetric = async () => {
    if (!newMetric.name || !newMetric.formula) {
      toast.error('Nome e fórmula são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/admin/dashboard/custom-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMetric),
      });

      if (response.ok) {
        toast.success('Métrica customizada criada com sucesso!');
        setNewMetric({
          name: '',
          description: '',
          formula: '',
          type: 'financial',
          unit: '€',
        });
        setIsCreating(false);
        loadCustomMetrics();
      } else {
        toast.error('Erro ao criar métrica');
      }
    } catch (error) {
      console.error('Erro ao criar métrica:', error);
      toast.error('Erro ao criar métrica');
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    try {
      const response = await fetch(`/api/admin/dashboard/custom-metrics/${metricId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Métrica removida com sucesso!');
        loadCustomMetrics();
      } else {
        toast.error('Erro ao remover métrica');
      }
    } catch (error) {
      console.error('Erro ao remover métrica:', error);
      toast.error('Erro ao remover métrica');
    }
  };

  const handleToggleMetric = async (metricId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/dashboard/custom-metrics/${metricId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        loadCustomMetrics();
      } else {
        toast.error('Erro ao atualizar status da métrica');
      }
    } catch (error) {
      console.error('Erro ao atualizar métrica:', error);
      toast.error('Erro ao atualizar status da métrica');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'operational': return <Calculator className="h-4 w-4" />;
      case 'marketing': return <TrendingUp className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'financial': return 'bg-green-100 text-green-700';
      case 'operational': return 'bg-blue-100 text-blue-700';
      case 'marketing': return 'bg-purple-100 text-purple-700';
      case 'customer': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#FF6B00]" />
            Regras de Métricas Customizadas
          </DialogTitle>
          <DialogDescription>
            Crie fórmulas personalizadas para calcular métricas avançadas como LTV, CAC, margem de lucro, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Templates de métricas */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#333333]">Templates Sugeridos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {METRIC_TEMPLATES.map((template, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      {template.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-[#a16b45] mb-2">{template.description}</p>
                    <code className="text-xs bg-[#f5f1e9] p-1 rounded block overflow-x-auto">
                      {template.formula}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2 w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 relative z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewMetric({
                          name: template.name,
                          description: template.description,
                          formula: template.formula,
                          type: template.type,
                          unit: template.unit,
                        });
                        setIsCreating(true);
                      }}
                    >
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Criar nova métrica */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#333333]">Suas Métricas Customizadas</h3>
              <Button
                onClick={() => setIsCreating(!isCreating)}
                size="sm"
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Cancelar' : 'Nova Métrica'}
              </Button>
            </div>

            {isCreating && (
              <Card className="border-[#FF6B00]/20">
                <CardHeader>
                  <CardTitle className="text-base">Criar Nova Métrica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome da Métrica</label>
                      <Input
                        value={newMetric.name}
                        onChange={(e) => setNewMetric(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: LTV Médio"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select
                        value={newMetric.type}
                        onValueChange={(value: any) => setNewMetric(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="financial">Financeiro</SelectItem>
                          <SelectItem value="operational">Operacional</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="customer">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Input
                      value={newMetric.description}
                      onChange={(e) => setNewMetric(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Breve descrição da métrica"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fórmula</label>
                      <Textarea
                        value={newMetric.formula}
                        onChange={(e) => setNewMetric(prev => ({ ...prev, formula: e.target.value }))}
                        placeholder="Ex: (receita_total / total_pedidos) * 1.5"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unidade</label>
                      <Input
                        value={newMetric.unit}
                        onChange={(e) => setNewMetric(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="€, %, x, etc."
                      />
                    </div>
                  </div>

                  <div className="text-xs text-[#a16b45] bg-[#fefaf3] p-3 rounded-md space-y-2">
                    <strong>Variáveis disponíveis:</strong>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="font-semibold">Receita:</p>
                        <code className="text-xs">receita_total</code>
                      </div>
                      <div>
                        <p className="font-semibold">Pedidos:</p>
                        <code className="text-xs">total_pedidos</code>
                      </div>
                      <div>
                        <p className="font-semibold">Clientes:</p>
                        <code className="text-xs">total_clientes</code>
                      </div>
                      <div>
                        <p className="font-semibold">Ticket Médio:</p>
                        <code className="text-xs">ticket_medio</code>
                      </div>
                      <div>
                        <p className="font-semibold">Clientes Recorrentes:</p>
                        <code className="text-xs">clientes_recorrentes</code>
                      </div>
                      <div>
                        <p className="font-semibold">Novos Clientes:</p>
                        <code className="text-xs">novos_clientes</code>
                      </div>
                      <div>
                        <p className="font-semibold">Frequência:</p>
                        <code className="text-xs">frequencia_compras</code>
                      </div>
                      <div>
                        <p className="font-semibold">Custos:</p>
                        <code className="text-xs">custos_totais</code>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleCreateMetric} className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90">
                    Criar Métrica
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Lista de métricas customizadas */}
            <div className="space-y-3">
              {metrics.map((metric) => (
                <Card key={metric.id} className="border-l-4" style={{ borderLeftColor: getTypeColor(metric.type).split(' ')[1].replace('text-', '') }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(metric.type)}
                          <h4 className="font-semibold text-[#333333]">{metric.name}</h4>
                          <Badge className={getTypeColor(metric.type)}>
                            {metric.type}
                          </Badge>
                          <Badge variant={metric.isActive ? 'default' : 'secondary'}>
                            {metric.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#a16b45] mb-2">{metric.description}</p>
                        <code className="text-xs bg-[#f5f1e9] p-2 rounded block mb-2">
                          {metric.formula}
                        </code>
                        <p className="text-xs text-[#a16b45]">
                          Unidade: <strong>{metric.unit}</strong> • Criada em: {new Date(metric.createdAt).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleMetric(metric.id, !metric.isActive)}
                        >
                          {metric.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMetric(metric.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {metrics.length === 0 && !isCreating && (
                <div className="text-center py-8 text-[#a16b45]">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma métrica customizada criada ainda</p>
                  <p className="text-sm">Use os templates sugeridos ou crie sua própria fórmula</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Percent,
  DollarSign,
  Calendar,
  Download,
  Link2,
  Copy,
  Check,
  Info,
  UserPlus,
  UserCheck,
  Tag,
  TrendingDown as DiscountIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type CurrentUser = {
  id: string;
  role: string;
  managerLevel: string | null;
};

type ReportsPageContentProps = {
  currentUser: CurrentUser;
};

type PeriodFilter = '7' | '30' | '90' | 'custom';

type MetricsData = {
  revenue: { current: number; previous: number; growth: number };
  revenueWithoutDiscount: number;
  revenueWithDiscount: number;
  orders: { current: number; previous: number; growth: number };
  newOrders: number;
  recurringOrders: number;
  customers: { current: number; previous: number; growth: number };
  avgTicket: { current: number; previous: number; growth: number };
  ltv: number;
  cac: number;
  retentionRate: number;
  firstPurchaseRate: number;
};

type MarketingData = {
  promotions: Array<{
    id: string;
    name: string;
    type: string;
    usageCount: number;
    discountValue: number;
    discountType: string;
    evolution: Array<{ date: string; uses: number; revenue: number }>;
  }>;
  promotionsByType: Record<string, number>;
  totalSavings: number;
  totalPromotionUses: number;
};

type UTMData = {
  sources: Array<{
    source: string;
    orders: number;
    revenue: number;
    customers: number;
    avgTicket: number;
    evolution: Array<{ date: string; orders: number; revenue: number }>;
  }>;
  campaigns: Array<{
    campaign: string;
    source: string;
    medium: string;
    orders: number;
    revenue: number;
    customers: number;
  }>;
  totalUTMOrders: number;
  totalUTMRevenue: number;
};

type UTMLink = {
  id: string;
  url: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  clicks: number;
  conversions: number;
  revenue: number;
  avgOrderValue: number;
  conversionRate: number;
};

export function ReportsPageContent({ currentUser }: ReportsPageContentProps) {
  const [period, setPeriod] = useState<PeriodFilter>('7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [marketing, setMarketing] = useState<MarketingData | null>(null);
  const [utmData, setUtmData] = useState<UTMData | null>(null);
  const [utmLinks, setUtmLinks] = useState<UTMLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUTMLinks, setIsLoadingUTMLinks] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUTMDialogOpen, setIsUTMDialogOpen] = useState(false);
  const [utmParams, setUtmParams] = useState({
    url: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });
  const [copiedUTM, setCopiedUTM] = useState(false);
  const [pieChartType, setPieChartType] = useState<'category' | 'promotion' | 'utm'>('category');
  const [selectedPromotion, setSelectedPromotion] = useState<string>('');
  const [comparisonPeriod, setComparisonPeriod] = useState<'6months' | '3years'>('6months');

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (period === 'custom' && customStart && customEnd) {
        params.append('startDate', customStart);
        params.append('endDate', customEnd);
      } else {
        params.append('days', period);
      }

      const response = await fetch(`/api/admin/analytics/metrics?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar métricas');
      }

      setMetrics(data.metrics);
      setCharts(data.charts);
      setMarketing(data.marketing);
      setUtmData(data.utm);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      
      if (error instanceof Error) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error('Erro ao carregar relatórios. Verifique o console para mais detalhes.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadUTMLinks();
  }, [period, customStart, customEnd]);

  const loadUTMLinks = async () => {
    setIsLoadingUTMLinks(true);
    try {
      const response = await fetch('/api/admin/analytics/utm-links');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar links UTM');
      }

      setUtmLinks(data.utmLinks || []);
    } catch (error) {
      console.error('Erro ao carregar links UTM:', error);
    } finally {
      setIsLoadingUTMLinks(false);
    }
  };

  const generatedUTM = useMemo(() => {
    if (!utmParams.url || !utmParams.source || !utmParams.medium || !utmParams.campaign) {
      return '';
    }

    const url = new URL(utmParams.url.startsWith('http') ? utmParams.url : `https://${utmParams.url}`);
    url.searchParams.set('utm_source', utmParams.source);
    url.searchParams.set('utm_medium', utmParams.medium);
    url.searchParams.set('utm_campaign', utmParams.campaign);
    
    if (utmParams.term) url.searchParams.set('utm_term', utmParams.term);
    if (utmParams.content) url.searchParams.set('utm_content', utmParams.content);

    return url.toString();
  }, [utmParams]);

  const copyUTM = async () => {
    if (!generatedUTM) {
      toast.warning('Preencha os campos obrigatórios para gerar o link');
      return;
    }

    await navigator.clipboard.writeText(generatedUTM);
    setCopiedUTM(true);
    toast.success('Link copiado para a área de transferência!');
    
    // Salvar link gerado no banco
    try {
      await fetch('/api/admin/analytics/utm-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: utmParams.url,
          utmSource: utmParams.source,
          utmMedium: utmParams.medium,
          utmCampaign: utmParams.campaign,
          utmTerm: utmParams.term,
          utmContent: utmParams.content,
        }),
      });
      
      // Recarregar lista de links
      loadUTMLinks();
    } catch (error) {
      console.error('Erro ao salvar link UTM:', error);
    }
    
    setTimeout(() => setCopiedUTM(false), 2000);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      
      if (period === 'custom' && customStart && customEnd) {
        params.append('startDate', customStart);
        params.append('endDate', customEnd);
      } else {
        params.append('days', period);
      }

      const response = await fetch(`/api/admin/analytics/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  // Configuração dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#333333',
          font: { family: 'Inter, sans-serif' },
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#333333',
        bodyColor: '#333333',
        borderColor: '#ead9cd',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(234, 217, 205, 0.3)' },
        ticks: { color: '#a16b45' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#a16b45' },
      },
    },
  };

  const salesByCategoryData = charts?.salesByCategory
    ? {
        labels: Object.keys(charts.salesByCategory),
        datasets: [
          {
            label: 'Vendas (€)',
            data: Object.values(charts.salesByCategory),
            backgroundColor: '#FF6B00',
            borderColor: '#FF6B00',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      }
    : null;

  const dailyOrdersData = charts?.dailyOrders
    ? {
        labels: Object.keys(charts.dailyOrders),
        datasets: [
          {
            label: 'Pedidos',
            data: Object.values(charts.dailyOrders),
            borderColor: '#FF6B00',
            backgroundColor: 'rgba(255, 107, 0, 0.1)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#FF6B00',
            pointBorderColor: '#FF6B00',
          },
        ],
      }
    : null;

  // Gráfico de pizza dinâmico
  const pieChartData = useMemo(() => {
    if (pieChartType === 'category' && charts?.salesByCategory) {
      const hasData = Object.keys(charts.salesByCategory).length > 0;
      if (!hasData) return null;
      
      return {
        labels: Object.keys(charts.salesByCategory),
        datasets: [
          {
            data: Object.values(charts.salesByCategory),
            backgroundColor: [
              '#FF6B00',
              '#FFB84D',
              '#FF8C00',
              '#FFA500',
              '#FFD700',
              '#FFC107',
              '#FF9800',
              '#FF5722',
            ],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      };
    } else if (pieChartType === 'promotion' && marketing?.promotionsByType) {
      const hasData = Object.keys(marketing.promotionsByType).length > 0;
      if (!hasData) return null;
      
      return {
        labels: Object.keys(marketing.promotionsByType).map((type) => {
          const labels: Record<string, string> = {
            COUPON: '🎟️ Cupons',
            FIRST_PURCHASE: '🎁 Primeira Compra',
            ORDER_BUMP: '📦 Order Bump',
            UP_SELL: '⬆️ Up-sell',
            DOWN_SELL: '⬇️ Down-sell',
          };
          return labels[type] || type;
        }),
        datasets: [
          {
            data: Object.values(marketing.promotionsByType),
            backgroundColor: [
              '#FF6B00',
              '#4CAF50',
              '#2196F3',
              '#FFC107',
              '#9C27B0',
            ],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      };
    } else if (pieChartType === 'utm' && utmData?.sources && utmData.sources.length > 0) {
      return {
        labels: utmData.sources.map((s) => s.source),
        datasets: [
          {
            data: utmData.sources.map((s) => s.revenue),
            backgroundColor: [
              '#FF6B00',
              '#E91E63',
              '#9C27B0',
              '#3F51B5',
              '#2196F3',
              '#00BCD4',
              '#009688',
              '#4CAF50',
            ],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      };
    }
    
    // Se não houver dados para o tipo selecionado, tenta outro tipo
    if (pieChartType === 'promotion' && charts?.salesByCategory && Object.keys(charts.salesByCategory).length > 0) {
      return {
        labels: Object.keys(charts.salesByCategory),
        datasets: [
          {
            data: Object.values(charts.salesByCategory),
            backgroundColor: [
              '#FF6B00',
              '#FFB84D',
              '#FF8C00',
              '#FFA500',
              '#FFD700',
              '#FFC107',
              '#FF9800',
              '#FF5722',
            ],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      };
    }
    
    return null;
  }, [pieChartType, charts, marketing, utmData]);

  // Gráfico de evolução de promoção selecionada
  const promotionEvolutionData = useMemo(() => {
    if (!selectedPromotion || !marketing) return null;

    const promo = marketing.promotions.find((p) => p.id === selectedPromotion);
    if (!promo?.evolution || promo.evolution.length === 0) return null;

    return {
      labels: promo.evolution.map((e) => e.date),
      datasets: [
        {
          label: 'Usos',
          data: promo.evolution.map((e) => e.uses),
          borderColor: '#FF6B00',
          backgroundColor: 'rgba(255, 107, 0, 0.1)',
          yAxisID: 'y',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Receita (€)',
          data: promo.evolution.map((e) => e.revenue),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          yAxisID: 'y1',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [selectedPromotion, marketing]);

  const promotionEvolutionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#333333',
          font: { family: 'Inter, sans-serif' },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: { color: 'rgba(234, 217, 205, 0.3)' },
        ticks: { color: '#a16b45' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: '#a16b45' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#a16b45' },
      },
    },
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-[#FF6B00]">Relatórios</h1>
          <p className="text-sm text-[#a16b45]">
            Análise de performance, métricas e insights de marketing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#ead9cd] bg-white p-1">
            <Button
              variant={period === '7' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('7')}
              className={cn(
                period === '7' && 'bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90'
              )}
            >
              7D
            </Button>
            <Button
              variant={period === '30' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('30')}
              className={cn(
                period === '30' && 'bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90'
              )}
            >
              30D
            </Button>
            <Button
              variant={period === '90' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('90')}
              className={cn(
                period === '90' && 'bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90'
              )}
            >
              90D
            </Button>
            <Button
              variant={period === 'custom' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('custom')}
              className={cn(
                period === 'custom' && 'bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90'
              )}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUTMDialogOpen(true)}
            className="gap-2"
          >
            <Link2 className="h-4 w-4" />
            Gerador UTM
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </header>

      {period === 'custom' && (
        <section className="flex items-end gap-4 rounded-xl border border-[#ead9cd] bg-white p-4">
          <div className="flex-1">
            <Label htmlFor="start-date">Data início</Label>
            <Input
              id="start-date"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="end-date">Data fim</Label>
            <Input
              id="end-date"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
          <Button onClick={loadMetrics} disabled={isLoading || !customStart || !customEnd}>
            Aplicar
          </Button>
        </section>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
        </div>
      ) : metrics ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Receita Total"
              value={`€${metrics.revenue.current.toFixed(2)}`}
              growth={metrics.revenue.growth}
              icon={DollarSign}
              tooltip="Valor total de vendas no período selecionado, comparado com o período anterior de igual duração."
            />
            <MetricCard
              title="Pedidos"
              value={metrics.orders.current.toString()}
              growth={metrics.orders.growth}
              icon={ShoppingCart}
              tooltip="Número total de pedidos realizados, incluindo novos clientes e recorrentes."
            />
            <MetricCard
              title="Clientes"
              value={metrics.customers.current.toString()}
              growth={metrics.customers.growth}
              icon={Users}
              tooltip="Número de clientes únicos que fizeram pedidos no período."
            />
            <MetricCard
              title="Ticket Médio"
              value={`€${metrics.avgTicket.current.toFixed(2)}`}
              growth={metrics.avgTicket.growth}
              icon={BarChart3}
              tooltip="Valor médio por pedido (Receita Total ÷ Número de Pedidos)."
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="LTV (Lifetime Value)"
              value={`€${metrics.ltv.toFixed(2)}`}
              subtitle="Valor médio por cliente"
              tooltip="Valor médio que cada cliente gera durante todo o tempo de relacionamento com a empresa."
            />
            <StatCard
              title="Taxa de Retenção"
              value={`${metrics.retentionRate.toFixed(1)}%`}
              subtitle="Clientes que retornam"
              tooltip="Percentual de clientes que fizeram mais de uma compra."
            />
            <StatCard
              title="Primeiras Compras"
              value={`${metrics.firstPurchaseRate.toFixed(1)}%`}
              subtitle="Novos clientes"
              tooltip="Percentual de pedidos feitos por clientes novos (primeira compra)."
            />
            <StatCard
              title="Pedidos Novos"
              value={metrics.newOrders.toString()}
              subtitle="Primeira compra"
              tooltip="Quantidade de pedidos de clientes fazendo sua primeira compra."
              icon={UserPlus}
            />
            <StatCard
              title="Pedidos Recorrentes"
              value={metrics.recurringOrders.toString()}
              subtitle="Clientes retornando"
              tooltip="Quantidade de pedidos de clientes que já compraram antes."
              icon={UserCheck}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <StatCard
              title="Receita Sem Desconto"
              value={`€${metrics.revenueWithoutDiscount.toFixed(2)}`}
              subtitle="Valor total sem promoções"
              tooltip="Valor total que seria gerado se não houvesse descontos aplicados."
              icon={Tag}
            />
            <StatCard
              title="Receita Com Desconto"
              value={`€${metrics.revenueWithDiscount.toFixed(2)}`}
              subtitle={`Economia: €${(metrics.revenueWithoutDiscount - metrics.revenueWithDiscount).toFixed(2)}`}
              tooltip="Valor total após aplicação de descontos e promoções. A economia representa o valor total em descontos concedidos."
              icon={DiscountIcon}
            />
          </section>

          {salesByCategoryData && (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-[#333333]">Vendas por Categoria</h3>
                <div className="h-64">
                  <Bar data={salesByCategoryData} options={chartOptions} />
                </div>
              </div>

              {dailyOrdersData && (
                <div className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-[#333333]">Evolução de Pedidos</h3>
                  <div className="h-64">
                    <Line data={dailyOrdersData} options={chartOptions} />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Gráfico de Pizza Dinâmico */}
          {pieChartData && (
            <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#333333]">Análise por</h3>
                  <InfoTooltip text="Selecione o tipo de dado que deseja visualizar no gráfico de pizza." />
                </div>
                <Select value={pieChartType} onValueChange={(value: any) => setPieChartType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Categorias</SelectItem>
                    <SelectItem value="promotion">Promoções</SelectItem>
                    <SelectItem value="utm">Fontes UTM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-80 flex items-center justify-center">
                <Pie data={pieChartData} options={{ ...chartOptions, maintainAspectRatio: true }} />
              </div>
            </section>
          )}

          {/* Evolução de Promoção Específica */}
          {marketing && marketing.promotions.length > 0 && (
            <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#333333]">Evolução de Campanha</h3>
                  <InfoTooltip text="Acompanhe a performance diária de uma promoção específica, incluindo número de usos e receita gerada." />
                </div>
                <Select value={selectedPromotion} onValueChange={setSelectedPromotion}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione uma promoção" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketing.promotions.map((promo) => (
                      <SelectItem key={promo.id} value={promo.id}>
                        {promo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {promotionEvolutionData ? (
                <div className="h-80">
                  <Line data={promotionEvolutionData} options={promotionEvolutionOptions} />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-[#a16b45]">
                  <p>Selecione uma promoção para ver sua evolução</p>
                </div>
              )}
            </section>
          )}

          {marketing && (
            <>
              <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-[#333333]">Performance de Marketing</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9] p-4">
                    <p className="text-sm font-medium text-[#a16b45]">Total de Usos</p>
                    <p className="mt-1 text-2xl font-bold text-[#333333]">{marketing.totalPromotionUses}</p>
                    <p className="mt-1 text-xs text-[#a16b45]">Promoções aplicadas</p>
                  </div>
                  <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9] p-4">
                    <p className="text-sm font-medium text-[#a16b45]">Economia Gerada</p>
                    <p className="mt-1 text-2xl font-bold text-[#333333]">€{marketing.totalSavings.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-[#a16b45]">Desconto total aos clientes</p>
                  </div>
                  <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9] p-4">
                    <p className="text-sm font-medium text-[#a16b45]">Promoções Ativas</p>
                    <p className="mt-1 text-2xl font-bold text-[#333333]">{marketing.promotions.length}</p>
                    <p className="mt-1 text-xs text-[#a16b45]">Com pelo menos 1 uso</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-semibold text-[#333333]">Promoções por Tipo</h4>
                  <div className="space-y-2">
                    {Object.entries(marketing.promotionsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between rounded-lg border border-[#ead9cd] bg-white p-3">
                        <span className="text-sm font-medium text-[#333333]">
                          {type === 'COUPON' && '🎟️ Cupons'}
                          {type === 'FIRST_PURCHASE' && '🎁 Primeira Compra'}
                          {type === 'ORDER_BUMP' && '📦 Order Bump'}
                          {type === 'UP_SELL' && '⬆️ Up-sell'}
                          {type === 'DOWN_SELL' && '⬇️ Down-sell'}
                        </span>
                        <span className="font-bold text-[#FF6B00]">{count} usos</span>
                      </div>
                    ))}
                  </div>
                </div>

                {marketing.promotions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-semibold text-[#333333]">Top Promoções</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#ead9cd] bg-[#f5f1e9]">
                            <th className="px-4 py-2 text-left text-xs font-medium text-[#a16b45]">Nome</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-[#a16b45]">Tipo</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Usos</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Desconto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {marketing.promotions.slice(0, 5).map((promo) => (
                            <tr key={promo.id} className="border-b border-[#ead9cd]">
                              <td className="px-4 py-3 text-sm text-[#333333]">{promo.name}</td>
                              <td className="px-4 py-3 text-sm text-[#a16b45]">{promo.type}</td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-[#333333]">{promo.usageCount}</td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-[#FF6B00]">
                                {promo.discountType === 'FIXED' ? `€${promo.discountValue.toFixed(2)}` : `${promo.discountValue}%`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {/* Performance de UTM */}
          {utmData && utmData.sources.length > 0 && (
            <>
              <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#333333]">Performance por Fonte UTM</h3>
                  <InfoTooltip text="Análise de pedidos e receita por fonte de tráfego (utm_source). Use o gerador de UTM para criar links rastreáveis." />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                  <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9] p-4">
                    <p className="text-sm font-medium text-[#a16b45]">Pedidos com UTM</p>
                    <p className="mt-1 text-2xl font-bold text-[#333333]">{utmData.totalUTMOrders}</p>
                    <p className="mt-1 text-xs text-[#a16b45]">
                      {metrics ? ((utmData.totalUTMOrders / metrics.orders.current) * 100).toFixed(1) : 0}% do total
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9] p-4">
                    <p className="text-sm font-medium text-[#a16b45]">Receita com UTM</p>
                    <p className="mt-1 text-2xl font-bold text-[#333333]">€{utmData.totalUTMRevenue.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-[#a16b45]">
                      {metrics ? ((utmData.totalUTMRevenue / metrics.revenue.current) * 100).toFixed(1) : 0}% do total
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9] p-4">
                    <p className="text-sm font-medium text-[#a16b45]">Fontes Ativas</p>
                    <p className="mt-1 text-2xl font-bold text-[#333333]">{utmData.sources.length}</p>
                    <p className="mt-1 text-xs text-[#a16b45]">Canais com vendas</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#ead9cd] bg-[#f5f1e9]">
                        <th className="px-4 py-2 text-left text-xs font-medium text-[#a16b45]">Fonte</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Pedidos</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Receita</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Clientes</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utmData.sources.map((source) => (
                        <tr key={source.source} className="border-b border-[#ead9cd]">
                          <td className="px-4 py-3 text-sm font-medium text-[#333333]">{source.source}</td>
                          <td className="px-4 py-3 text-right text-sm text-[#333333]">{source.orders}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-[#FF6B00]">
                            €{source.revenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-[#333333]">{source.customers}</td>
                          <td className="px-4 py-3 text-right text-sm text-[#333333]">
                            €{source.avgTicket.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {utmData.campaigns.length > 0 && (
                <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#333333]">Campanhas Detalhadas</h3>
                    <InfoTooltip text="Performance individual de cada campanha (utm_campaign), mostrando fonte, meio e resultados." />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#ead9cd] bg-[#f5f1e9]">
                          <th className="px-4 py-2 text-left text-xs font-medium text-[#a16b45]">Campanha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[#a16b45]">Fonte</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[#a16b45]">Meio</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Pedidos</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Receita</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">Clientes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {utmData.campaigns.map((campaign, idx) => (
                          <tr key={idx} className="border-b border-[#ead9cd]">
                            <td className="px-4 py-3 text-sm font-medium text-[#333333]">{campaign.campaign}</td>
                            <td className="px-4 py-3 text-sm text-[#a16b45]">{campaign.source}</td>
                            <td className="px-4 py-3 text-sm text-[#a16b45]">{campaign.medium}</td>
                            <td className="px-4 py-3 text-right text-sm text-[#333333]">{campaign.orders}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-[#FF6B00]">
                              €{campaign.revenue.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-[#333333]">{campaign.customers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Links UTM Gerados */}
          <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#333333]">Links UTM Gerados</h3>
                <InfoTooltip text="Histórico de links UTM criados pelo gerador, com estatísticas de cliques, conversões e receita gerada por cada link." />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUTMLinks}
                disabled={isLoadingUTMLinks}
              >
                {isLoadingUTMLinks ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>

            {utmLinks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#ead9cd] bg-[#f5f1e9]">
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#a16b45]">
                        Link / Campanha
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[#a16b45]">
                        <div className="flex items-center justify-center gap-1">
                          Cliques
                          <InfoTooltip text="Número de visitantes que acessaram o site através deste link." />
                        </div>
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[#a16b45]">
                        <div className="flex items-center justify-center gap-1">
                          Conversões
                          <InfoTooltip text="Número de pedidos realizados por visitantes que vieram deste link." />
                        </div>
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[#a16b45]">
                        <div className="flex items-center justify-center gap-1">
                          Taxa Conv.
                          <InfoTooltip text="Percentual de visitantes que realizaram pedido (Conversões ÷ Cliques × 100)." />
                        </div>
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">
                        <div className="flex items-center justify-end gap-1">
                          Receita
                          <InfoTooltip text="Valor total em vendas geradas por este link." />
                        </div>
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-[#a16b45]">
                        <div className="flex items-center justify-end gap-1">
                          Ticket Médio
                          <InfoTooltip text="Valor médio por pedido (Receita ÷ Conversões)." />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {utmLinks.map((link) => (
                      <tr key={link.id} className="border-b border-[#ead9cd] hover:bg-[#f5f1e9]/50">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#333333]">
                              {link.utmCampaign}
                            </span>
                            <span className="text-xs text-[#a16b45]">
                              {link.utmSource} / {link.utmMedium}
                            </span>
                            <span className="text-xs font-mono text-[#a16b45]">
                              {link.url}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                            {link.clicks}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                            {link.conversions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-[#333333]">
                            {link.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-[#FF6B00]">
                            €{link.revenue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-[#333333]">
                            €{link.avgOrderValue.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-[#a16b45]">
                <Link2 className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhum link UTM gerado ainda</p>
                <p className="text-xs">Use o Gerador UTM para criar links rastreáveis</p>
              </div>
            )}
          </section>
        </>
      ) : null}

      {/* UTM Generator Dialog */}
      <Dialog open={isUTMDialogOpen} onOpenChange={setIsUTMDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerador de Links UTM</DialogTitle>
            <DialogDescription>
              Crie links rastreáveis para suas campanhas de marketing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="utm-url">URL do Site *</Label>
                <InfoTooltip text="URL completa da página de destino onde o visitante chegará ao clicar no link." />
              </div>
              <Input
                id="utm-url"
                placeholder="https://sushiworld.pt"
                value={utmParams.url}
                onChange={(e) => setUtmParams({ ...utmParams, url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="utm-source">Origem (Source) *</Label>
                  <InfoTooltip text="De onde vem o tráfego. Ex: google, facebook, instagram, newsletter" />
                </div>
                <Input
                  id="utm-source"
                  placeholder="google, facebook, instagram"
                  value={utmParams.source}
                  onChange={(e) => setUtmParams({ ...utmParams, source: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="utm-medium">Meio (Medium) *</Label>
                  <InfoTooltip text="Tipo de canal de marketing. Ex: cpc (anúncio pago), email, social, organic" />
                </div>
                <Input
                  id="utm-medium"
                  placeholder="cpc, email, social"
                  value={utmParams.medium}
                  onChange={(e) => setUtmParams({ ...utmParams, medium: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="utm-campaign">Campanha (Campaign) *</Label>
                <InfoTooltip text="Nome identificador da campanha. Ex: promo-verao-2025, black-friday, lancamento-produto" />
              </div>
              <Input
                id="utm-campaign"
                placeholder="promo-verao, black-friday"
                value={utmParams.campaign}
                onChange={(e) => setUtmParams({ ...utmParams, campaign: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="utm-term">Termo (Term)</Label>
                  <InfoTooltip text="Palavra-chave paga (para Google Ads). Ex: sushi-delivery, comida-japonesa" />
                </div>
                <Input
                  id="utm-term"
                  placeholder="palavra-chave"
                  value={utmParams.term}
                  onChange={(e) => setUtmParams({ ...utmParams, term: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="utm-content">Conteúdo (Content)</Label>
                  <InfoTooltip text="Diferencia anúncios ou links similares. Ex: banner-topo, link-bio, story-1" />
                </div>
                <Input
                  id="utm-content"
                  placeholder="banner-1, link-bio"
                  value={utmParams.content}
                  onChange={(e) => setUtmParams({ ...utmParams, content: e.target.value })}
                />
              </div>
            </div>
            {generatedUTM && (
              <div className="space-y-2">
                <Label>Link Gerado</Label>
                <div className="flex gap-2">
                  <Input value={generatedUTM} readOnly className="font-mono text-xs" />
                  <Button onClick={copyUTM} size="icon" variant="outline">
                    {copiedUTM ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUTMDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de tooltip informativo
function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 cursor-help text-[#a16b45] hover:text-[#FF6B00]" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{text}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  growth: number;
  icon: React.ElementType;
  tooltip?: string;
};

function MetricCard({ title, value, growth, icon: Icon, tooltip }: MetricCardProps) {
  const isPositive = growth >= 0;
  
  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-[#a16b45]">{title}</h2>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-semibold',
            isPositive ? 'text-green-600' : 'text-red-500'
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{Math.abs(growth).toFixed(1)}%</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="rounded-full bg-[#FF6B00]/10 p-2">
          <Icon className="h-5 w-5 text-[#FF6B00]" />
        </div>
        <p className="text-2xl font-bold text-[#333333]">{value}</p>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  tooltip?: string;
  icon?: React.ElementType;
};

function StatCard({ title, value, subtitle, tooltip, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-[#a16b45]">{title}</h2>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="mt-2 flex items-center gap-3">
        {Icon && (
          <div className="rounded-full bg-[#FF6B00]/10 p-2">
            <Icon className="h-5 w-5 text-[#FF6B00]" />
          </div>
        )}
        <div>
          <p className="text-2xl font-bold text-[#333333]">{value}</p>
          <p className="mt-1 text-xs text-[#a16b45]">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}


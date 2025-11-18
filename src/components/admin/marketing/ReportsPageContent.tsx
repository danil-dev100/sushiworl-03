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
  orders: { current: number; previous: number; growth: number };
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
  }>;
  promotionsByType: Record<string, number>;
  totalSavings: number;
  totalPromotionUses: number;
};

export function ReportsPageContent({ currentUser }: ReportsPageContentProps) {
  const [period, setPeriod] = useState<PeriodFilter>('7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [marketing, setMarketing] = useState<MarketingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  }, [period, customStart, customEnd]);

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
    
    setTimeout(() => setCopiedUTM(false), 2000);
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
            />
            <MetricCard
              title="Pedidos"
              value={metrics.orders.current.toString()}
              growth={metrics.orders.growth}
              icon={ShoppingCart}
            />
            <MetricCard
              title="Clientes"
              value={metrics.customers.current.toString()}
              growth={metrics.customers.growth}
              icon={Users}
            />
            <MetricCard
              title="Ticket Médio"
              value={`€${metrics.avgTicket.current.toFixed(2)}`}
              growth={metrics.avgTicket.growth}
              icon={BarChart3}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="LTV (Lifetime Value)"
              value={`€${metrics.ltv.toFixed(2)}`}
              subtitle="Valor médio por cliente"
            />
            <StatCard
              title="Taxa de Retenção"
              value={`${metrics.retentionRate.toFixed(1)}%`}
              subtitle="Clientes que retornam"
            />
            <StatCard
              title="Primeiras Compras"
              value={`${metrics.firstPurchaseRate.toFixed(1)}%`}
              subtitle="Novos clientes"
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
              <Label htmlFor="utm-url">URL do Site *</Label>
              <Input
                id="utm-url"
                placeholder="https://sushiworld.pt"
                value={utmParams.url}
                onChange={(e) => setUtmParams({ ...utmParams, url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm-source">Origem (Source) *</Label>
                <Input
                  id="utm-source"
                  placeholder="google, facebook, instagram"
                  value={utmParams.source}
                  onChange={(e) => setUtmParams({ ...utmParams, source: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-medium">Meio (Medium) *</Label>
                <Input
                  id="utm-medium"
                  placeholder="cpc, email, social"
                  value={utmParams.medium}
                  onChange={(e) => setUtmParams({ ...utmParams, medium: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm-campaign">Campanha (Campaign) *</Label>
              <Input
                id="utm-campaign"
                placeholder="promo-verao, black-friday"
                value={utmParams.campaign}
                onChange={(e) => setUtmParams({ ...utmParams, campaign: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm-term">Termo (Term)</Label>
                <Input
                  id="utm-term"
                  placeholder="palavra-chave"
                  value={utmParams.term}
                  onChange={(e) => setUtmParams({ ...utmParams, term: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-content">Conteúdo (Content)</Label>
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

type MetricCardProps = {
  title: string;
  value: string;
  growth: number;
  icon: React.ElementType;
};

function MetricCard({ title, value, growth, icon: Icon }: MetricCardProps) {
  const isPositive = growth >= 0;
  
  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#a16b45]">{title}</h2>
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
};

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium text-[#a16b45]">{title}</h2>
      <p className="mt-1 text-2xl font-bold text-[#333333]">{value}</p>
      <p className="mt-1 text-xs text-[#a16b45]">{subtitle}</p>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Euro,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Download,
  Settings,
} from 'lucide-react';
import { DashboardCharts } from '@/components/admin/dashboard/DashboardCharts';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { TopProducts } from '@/components/admin/dashboard/TopProducts';
import { TooltipHelper } from '@/components/shared/TooltipHelper';
import { Button } from '@/components/ui/button';
import { CustomMetricsDialog } from '@/components/admin/dashboard/CustomMetricsDialog';


interface DashboardData {
  todayOrders: number;
  pendingOrders: number;
  activeOrders: number;
  todayRevenue: number;
  revenueChange: number;
  totalRevenue: number;
  averageTicket: number;
  totalOrders: number;
  uniqueCustomers: number;
  categoryRevenue: any[];
  topProducts: any[];
  recentOrders: any[];
}

export default function DashboardPage() {
  const [showCustomMetrics, setShowCustomMetrics] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('30days');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?period=${period}`);

      if (!response.ok) {
        console.error('Erro na resposta da API:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Detalhes do erro:', errorData);
        setData(null);
        return;
      }

      const dashboardData = await response.json();
      console.log('Dados recebidos do dashboard:', dashboardData);
      setData(dashboardData);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/admin/dashboard/export-csv?period=${period}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-dashboard-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erro ao exportar relatório CSV');
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar relatório CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#FF6B00]">
              Dashboard
            </h1>
            <TooltipHelper text="Painel principal com métricas gerais do negócio, gráficos de vendas e informações sobre pedidos" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-[#a16b45]">
              Carregando dados...
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#FF6B00]">
              Dashboard
            </h1>
            <TooltipHelper text="Painel principal com métricas gerais do negócio, gráficos de vendas e informações sobre pedidos" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-center">
            <p className="text-xl font-semibold text-[#333333] dark:text-[#f5f1e9]">
              Erro ao carregar dados do dashboard
            </p>
            <p className="text-sm text-[#a16b45] mt-2">
              Verifique o console do navegador para mais detalhes
            </p>
            <button
              onClick={() => fetchDashboardData()}
              className="mt-4 px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55f00] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Receita Total',
      value: `€ ${data.totalRevenue.toFixed(2)}`,
      icon: Euro,
      change: `${data.revenueChange > 0 ? '+' : ''}${data.revenueChange.toFixed(1)}%`,
      changeType: data.revenueChange >= 0 ? 'positive' as const : 'negative' as const,
      color: 'bg-green-100 text-green-600',
      subtitle: 'Receita acumulada',
      tooltip: 'Faturamento bruto total de todos os pedidos confirmados',
    },
    {
      label: 'Ticket Médio',
      value: `€ ${data.averageTicket.toFixed(2)}`,
      icon: TrendingUp,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'bg-blue-100 text-blue-600',
      subtitle: 'Valor médio por pedido',
      tooltip: 'Receita total dividida pelo número de pedidos (métrica de eficiência)',
    },
    {
      label: 'Clientes Únicos',
      value: data.uniqueCustomers,
      icon: Users,
      change: '+15%',
      changeType: 'positive' as const,
      color: 'bg-purple-100 text-purple-600',
      subtitle: 'Clientes ativos no período',
      tooltip: 'Número de clientes diferentes que fizeram pelo menos um pedido',
    },
    {
      label: 'Total de Pedidos',
      value: data.totalOrders,
      icon: ShoppingBag,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'bg-orange-100 text-orange-600',
      subtitle: 'Pedidos realizados',
      tooltip: 'Quantidade total de pedidos realizados no período',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-[#FF6B00]">
            Dashboard
          </h1>
          <TooltipHelper text="Painel principal com métricas gerais do negócio, gráficos de vendas e informações sobre pedidos" />
        </div>
        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-2 rounded-lg border border-[#ead9cd] dark:border-[#4a3c30] bg-white dark:bg-[#2a1e14] p-1">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === 'today'
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-[#a16b45] hover:bg-[#FF6B00]/10'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === '7days'
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-[#a16b45] hover:bg-[#FF6B00]/10'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === '30days'
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-[#a16b45] hover:bg-[#FF6B00]/10'
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === 'all'
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-[#a16b45] hover:bg-[#FF6B00]/10'
              }`}
            >
              Tudo
            </button>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            onClick={() => setShowCustomMetrics(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Regras Customizadas
          </Button>
          <div className="text-sm text-[#a16b45]">
            Última atualização: {new Date().toLocaleTimeString('pt-PT')}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.changeType === 'positive';
          
          return (
            <div
              key={index}
              className="relative flex flex-col gap-4 rounded-xl border border-[#ead9cd] bg-white p-6 transition-shadow hover:shadow-lg dark:border-[#4a3c30] dark:bg-[#2a1e14]"
            >
              {/* Change Badge */}
              <div className="absolute right-4 top-4 flex items-center gap-1 text-sm font-semibold">
                {isPositive ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">{stat.change}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">{stat.change}</span>
                  </>
                )}
              </div>

              {/* Icon & Label */}
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold leading-normal text-[#FF6B00]">
                    {stat.label}
                  </p>
                  <TooltipHelper text={stat.tooltip || 'Métrica de performance do negócio'} />
                </div>
              </div>

              {/* Value */}
              <div>
                <p className="text-4xl font-bold leading-tight text-[#333333] dark:text-[#f5f1e9]">
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="mt-1 text-xs text-[#a16b45]">{stat.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">Gráficos de Performance</h2>
        <TooltipHelper text="Visualização gráfica das vendas, pedidos e tendências de negócio ao longo do tempo" />
      </div>
      <DashboardCharts />

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">Pedidos Recentes</h2>
            <TooltipHelper text="Lista dos pedidos mais recentes com status e informações dos clientes" />
          </div>
          <RecentOrders orders={data.recentOrders} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">Produtos Mais Vendidos</h2>
            <TooltipHelper text="Ranking dos produtos mais populares baseado na quantidade de vendas" />
          </div>
          <TopProducts products={data.topProducts} />
        </div>
      </div>

      {/* Custom Metrics Dialog */}
      <CustomMetricsDialog
        open={showCustomMetrics}
        onOpenChange={setShowCustomMetrics}
      />
    </div>
  );
}

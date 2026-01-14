'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';
import { TrendingUp, Clock, CheckCircle, Truck, X, Calendar, BarChart3, PieChart as PieChartIcon, Activity, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface OrderStatusData {
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
}

interface ComparisonMetric {
  key: string;
  label: string;
  color: string;
  format: (value: number) => string;
  description: string;
}

type TimeRange = '7days' | '30days' | '90days' | 'custom';
type ChartType = 'area' | 'bar' | 'line';
type ComparisonType = 'sales-orders' | 'revenue-costs' | 'orders-status' | 'products-performance';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  days: number;
}

interface ChartTypeOption {
  value: ChartType;
  label: string;
  icon: React.ElementType;
}

// Dados mockados que simulam atualização em tempo real
function generateSalesData(days: number = 7): SalesData[] {
  const data: SalesData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simular vendas com variação mais realista baseada no dia da semana
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMultiplier = isWeekend ? 1.3 : 0.9;

    const baseSales = (100 + Math.random() * 100) * baseMultiplier;
    const orders = Math.floor(baseSales / 22) + Math.floor(Math.random() * 4);

    // Formatar data baseado no período
    let dateLabel: string;
    if (days <= 7) {
      dateLabel = date.toLocaleDateString('pt-PT', { weekday: 'short' });
    } else if (days <= 31) {
      dateLabel = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    } else {
      dateLabel = date.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
    }

    data.push({
      date: dateLabel,
      sales: Math.round(baseSales),
      orders: Math.max(1, orders), // Garantir pelo menos 1 pedido
    });
  }

  return data;
}

function generateOrderStatusData(): OrderStatusData[] {
  const baseOrders = 25 + Math.floor(Math.random() * 15); // 25-40 pedidos base

  return [
    {
      name: 'Pendente',
      value: Math.floor(baseOrders * 0.15) + Math.floor(Math.random() * 3), // ~15% pendentes
      color: '#fbbf24',
      icon: Clock,
    },
    {
      name: 'Confirmado',
      value: Math.floor(baseOrders * 0.35) + Math.floor(Math.random() * 5), // ~35% confirmados
      color: '#10b981',
      icon: CheckCircle,
    },
    {
      name: 'Em Entrega',
      value: Math.floor(baseOrders * 0.25) + Math.floor(Math.random() * 3), // ~25% em entrega
      color: '#8b5cf6',
      icon: Truck,
    },
    {
      name: 'Entregue',
      value: Math.floor(baseOrders * 0.25) + Math.floor(Math.random() * 5), // ~25% entregues
      color: '#06b6d4',
      icon: CheckCircle,
    },
  ];
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '7days', label: 'Últimos 7 dias', days: 7 },
  { value: '30days', label: 'Últimos 30 dias', days: 30 },
  { value: '90days', label: 'Últimos 90 dias', days: 90 },
  { value: 'custom', label: 'Personalizado', days: 0 },
];

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  { value: 'area', label: 'Área', icon: Activity },
  { value: 'bar', label: 'Barras', icon: BarChart3 },
  { value: 'line', label: 'Linha', icon: TrendingUp },
];

const COMPARISON_OPTIONS = [
  { value: 'sales-orders', label: 'Vendas vs Pedidos', icon: BarChart3 },
  { value: 'revenue-costs', label: 'Receita vs Custos', icon: TrendingUp },
  { value: 'orders-status', label: 'Pedidos por Status', icon: PieChartIcon },
  { value: 'products-performance', label: 'Performance de Produtos', icon: Activity },
];

const COMPARISON_METRICS: Record<string, ComparisonMetric[]> = {
  'sales-orders': [
    { key: 'sales', label: 'Receita (€)', color: '#FF6B00', format: (v) => `€${v.toFixed(2)}`, description: 'Valor total das vendas' },
    { key: 'orders', label: 'Pedidos', color: '#10b981', format: (v) => `${v}`, description: 'Número total de pedidos' },
  ],
  'revenue-costs': [
    { key: 'revenue', label: 'Receita Líquida (€)', color: '#FF6B00', format: (v) => `€${v.toFixed(2)}`, description: 'Receita após descontos' },
    { key: 'costs', label: 'Custos (€)', color: '#ef4444', format: (v) => `€${v.toFixed(2)}`, description: 'Custos operacionais' },
    { key: 'profit', label: 'Lucro (€)', color: '#10b981', format: (v) => `€${v.toFixed(2)}`, description: 'Lucro bruto (receita - custos)' },
  ],
  'orders-status': [
    { key: 'pending', label: 'Pendentes', color: '#fbbf24', format: (v) => `${v}`, description: 'Pedidos aguardando confirmação' },
    { key: 'confirmed', label: 'Confirmados', color: '#10b981', format: (v) => `${v}`, description: 'Pedidos confirmados' },
    { key: 'preparing', label: 'Preparando', color: '#8b5cf6', format: (v) => `${v}`, description: 'Pedidos em preparação' },
    { key: 'delivering', label: 'Em Entrega', color: '#06b6d4', format: (v) => `${v}`, description: 'Pedidos sendo entregues' },
  ],
  'products-performance': [
    { key: 'topProducts', label: 'Produtos Top', color: '#FF6B00', format: (v) => `${v}`, description: 'Produtos mais vendidos' },
    { key: 'avgPrice', label: 'Preço Médio (€)', color: '#10b981', format: (v) => `€${v.toFixed(2)}`, description: 'Preço médio dos produtos' },
    { key: 'categories', label: 'Categorias', color: '#8b5cf6', format: (v) => `${v}`, description: 'Performance por categoria' },
  ],
};

export function DashboardCharts() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('sales-orders');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  });

  // Função para buscar dados reais do banco
  const fetchRealData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/dashboard/charts?period=${chartPeriod}`);
      if (response.ok) {
        const data = await response.json();

        // Processar dados de vendas dos últimos 7 dias
        if (data.salesData && data.salesData.length > 0) {
          const processedSalesData = data.salesData.map((item: any) => ({
            date: new Date(item.date).toLocaleDateString('pt-PT', { weekday: 'short' }),
            sales: Math.round(item.sales),
            orders: item.orders,
          }));
          setSalesData(processedSalesData);
        }

        // Processar dados de status dos pedidos
        if (data.orderStatusData && data.orderStatusData.length > 0) {
          const processedOrderData = data.orderStatusData.map((item: any) => ({
            name: item.name,
            value: item.value,
            color: getStatusColor(item.name),
            icon: getStatusIcon(item.name),
          }));
          setOrderStatusData(processedOrderData);
        }
      }
    } catch (error) {
      console.log('Usando dados mockados (API não disponível):', error);
      // Manter dados mockados se a API falhar
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Função auxiliar para obter cor do status
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Pendente': '#fbbf24',
      'Confirmado': '#10b981',
      'Em Entrega': '#8b5cf6',
      'Entregue': '#06b6d4',
      'Cancelado': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  // Função auxiliar para obter ícone do status
  const getStatusIcon = (status: string): React.ElementType => {
    const icons: Record<string, React.ElementType> = {
      'Pendente': Clock,
      'Confirmado': CheckCircle,
      'Em Entrega': Truck,
      'Entregue': CheckCircle,
      'Cancelado': X,
    };
    return icons[status] || Clock;
  };

  // Buscar dados reais na montagem e atualizar a cada 30 segundos
  useEffect(() => {
    fetchRealData();

    const interval = setInterval(() => {
      fetchRealData();
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]); // Re-executar quando o período mudar

  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
  const averageOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00';

  // Função para renderizar o gráfico baseado no tipo selecionado
  const renderChart = () => {
    const commonProps = {
      data: salesData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ead9cd" />
            <XAxis dataKey="date" stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ead9cd',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value, name) => [`€${value}`, 'Vendas']}
              labelStyle={{ color: '#333333' }}
            />
            <Bar dataKey="sales" fill="#FF6B00" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ead9cd" />
            <XAxis dataKey="date" stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ead9cd',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value, name) => [`€${value}`, 'Vendas']}
              labelStyle={{ color: '#333333' }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#FF6B00"
              strokeWidth={3}
              dot={{ fill: '#FF6B00', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#FF6B00', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        );

      default: // area
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ead9cd" />
            <XAxis dataKey="date" stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ead9cd',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value, name) => [`€${value}`, 'Vendas']}
              labelStyle={{ color: '#333333' }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#FF6B00"
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={{ fill: '#FF6B00', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#FF6B00', strokeWidth: 2, fill: '#fff' }}
            />
          </AreaChart>
        );
    }
  };

  // Função para renderizar o gráfico de comparação baseado no tipo selecionado
  const renderComparisonChart = () => {
    const metrics = COMPARISON_METRICS[comparisonType] || [];

    if (comparisonType === 'sales-orders') {
      return (
        <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ead9cd" />
          <XAxis dataKey="date" stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#FF6B00"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `€${value}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#10b981"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ead9cd',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value, name) => [
              name === 'sales' ? `€${value}` : value,
              name === 'sales' ? 'Receita' : 'Pedidos'
            ]}
            labelStyle={{ color: '#333333' }}
          />
          <Bar yAxisId="left" dataKey="sales" fill="#FF6B00" radius={[4, 4, 0, 0]} name="Receita (€)" />
          <Bar yAxisId="right" dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="Pedidos" />
        </BarChart>
      );
    }

    if (comparisonType === 'orders-status') {
      return (
        <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ead9cd" />
          <XAxis dataKey="date" stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ead9cd',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#333333' }}
          />
          {metrics.map((metric, index) => (
            <Bar
              key={metric.key}
              dataKey={metric.key}
              fill={metric.color}
              radius={[4, 4, 0, 0]}
              name={metric.label}
            />
          ))}
        </BarChart>
      );
    }

    // Para outros tipos, usar gráfico de linha
    return (
      <LineChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ead9cd" />
        <XAxis dataKey="date" stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#a16b45" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ead9cd',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: '#333333' }}
        />
        {metrics.map((metric, index) => (
          <Line
            key={metric.key}
            type="monotone"
            dataKey={metric.key}
            stroke={metric.color}
            strokeWidth={3}
            dot={{ fill: metric.color, strokeWidth: 2, r: 4 }}
            name={metric.label}
          />
        ))}
      </LineChart>
    );
  };

  // Função para obter resumo das métricas
  const getComparisonSummary = () => {
    const metrics = COMPARISON_METRICS[comparisonType] || [];
    const summaries = [];

    for (const metric of metrics) {
      let total = 0;
      let count = 0;

      salesData.forEach(item => {
        const value = (item as any)[metric.key];
        if (typeof value === 'number') {
          total += value;
          count++;
        }
      });

      const average = count > 0 ? total / count : 0;
      summaries.push({
        label: metric.label,
        value: metric.format(average),
      });
    }

    return summaries;
  };

  // Função para atualizar dados baseado no período selecionado
  const updateDataForTimeRange = (range: TimeRange) => {
    setTimeRange(range);
    // A busca de dados reais será feita automaticamente pelo useEffect ao mudar timeRange
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Gráfico de Vendas - Área */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14] lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#FF6B00]">Vendas dos Últimos 7 Dias</h2>
          <div className="flex items-center gap-2 text-sm text-[#a16b45]">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF6B00] border-t-transparent"></div>
                <span>Atualizando...</span>
              </div>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                <span>Atualizado: {lastUpdate.toLocaleTimeString('pt-PT')}</span>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">€{totalSales}</p>
            <p className="text-xs text-[#a16b45]">Total Vendido</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">{totalOrders}</p>
            <p className="text-xs text-[#a16b45]">Total Pedidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">€{averageOrderValue}</p>
            <p className="text-xs text-[#a16b45]">Ticket Médio</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Controles na parte inferior */}
        <div className="mt-4 space-y-4 border-t border-[#ead9cd] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#a16b45]" />
                <span className="text-sm font-medium text-[#333333]">Período:</span>
                <Select value={timeRange} onValueChange={(value: TimeRange) => {
                  setTimeRange(value);
                  if (value !== 'custom') {
                    updateDataForTimeRange(value);
                  }
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {timeRange === 'custom' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#a16b45]">De:</span>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-1 text-sm border border-[#ead9cd] rounded-md bg-white"
                  />
                  <span className="text-sm text-[#a16b45]">Até:</span>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-1 text-sm border border-[#ead9cd] rounded-md bg-white"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (customDateRange.start && customDateRange.end) {
                        // Buscar dados reais da API com o período personalizado
                        fetchRealData();
                      }
                    }}
                    className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                  >
                    Aplicar
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#a16b45]" />
                <span className="text-sm font-medium text-[#333333]">Tipo:</span>
                <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#a16b45]">
              <Settings className="h-4 w-4" />
              <span>Use os controles acima para personalizar a visualização</span>
            </div>
          </div>

          {timeRange === 'custom' && (
            <div className="text-xs text-[#a16b45] bg-[#fefaf3] p-2 rounded-md">
              📅 Período personalizado: Selecione as datas de início e fim, depois clique em "Aplicar" para atualizar o gráfico.
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Pedidos por Status - Pizza */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#FF6B00]">Pedidos por Status</h2>
          <div className="flex items-center gap-2 text-sm text-[#a16b45]">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF6B00] border-t-transparent"></div>
                <span>Atualizando...</span>
              </div>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                <span>Atualizado: {lastUpdate.toLocaleTimeString('pt-PT')}</span>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 text-center">
          <p className="text-3xl font-bold text-[#333333] dark:text-[#f5f1e9]">
            {orderStatusData.reduce((sum, item) => sum + item.value, 0)}
          </p>
          <p className="text-sm text-[#a16b45]">Pedidos Ativos</p>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative h-64 w-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ead9cd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`${value} pedidos`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {orderStatusData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <Icon className="h-4 w-4" style={{ color: item.color }} />
                <span className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                  {item.name}
                </span>
                <span className="text-sm text-[#a16b45]">({item.value})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico de Comparação - Dinâmico */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14] lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[#FF6B00]">
              {COMPARISON_OPTIONS.find(opt => opt.value === comparisonType)?.label || 'Comparação'}
            </h2>
            <Select value={comparisonType} onValueChange={(value: ComparisonType) => setComparisonType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPARISON_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#a16b45]">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF6B00] border-t-transparent"></div>
                <span>Atualizando...</span>
              </div>
            ) : (
              <>
                <BarChartIcon className="h-4 w-4" />
                <span>Atualizado: {lastUpdate.toLocaleTimeString('pt-PT')}</span>
              </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-4 mb-2">
            {COMPARISON_METRICS[comparisonType]?.map((metric) => (
              <div key={metric.key} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
                <span className="text-sm text-[#333333]">{metric.label}</span>
                <span className="text-xs text-[#a16b45]">({metric.description})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderComparisonChart()}
          </ResponsiveContainer>
        </div>

        {/* Resumo das métricas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#ead9cd]">
          {getComparisonSummary().map((summary, index) => (
            <div key={index} className="text-center">
              <p className="text-lg font-bold text-[#333333]">{summary.value}</p>
              <p className="text-xs text-[#a16b45]">{summary.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

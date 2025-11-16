import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { 
  ShoppingBag, 
  Euro, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { DashboardCharts } from '@/components/admin/dashboard/DashboardCharts';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { TopProducts } from '@/components/admin/dashboard/TopProducts';

export const metadata: Metadata = {
  title: 'Dashboard | Admin - SushiWorld',
  description: 'Painel administrativo do SushiWorld',
};

async function getDashboardData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [todayOrders, pendingOrders, activeOrders, todayRevenue, lastWeekRevenue, topProducts, recentOrders] =
      await Promise.all([
        prisma.order.count({
          where: {
            createdAt: { gte: today },
            status: { not: 'CANCELLED' },
          },
        }),
        prisma.order.count({
          where: { status: 'PENDING' },
        }),
        prisma.order.count({
          where: { status: { in: ['CONFIRMED', 'PREPARING', 'DELIVERING'] } },
        }),
        prisma.order.aggregate({
          where: {
            createdAt: { gte: today },
            status: { not: 'CANCELLED' },
          },
          _sum: { total: true },
        }),
        prisma.order.aggregate({
          where: {
            createdAt: { 
              gte: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
              lt: lastWeek,
            },
            status: { not: 'CANCELLED' },
          },
          _sum: { total: true },
        }),
        prisma.product.findMany({
          orderBy: { orderCount: 'desc' },
          take: 3,
          select: { name: true, orderCount: true },
        }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            total: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    const revenueChange = lastWeekRevenue._sum.total && lastWeekRevenue._sum.total > 0
      ? ((todayRevenue._sum.total || 0) - lastWeekRevenue._sum.total) / lastWeekRevenue._sum.total * 100
      : 0;

    return {
      todayOrders,
      pendingOrders,
      activeOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      revenueChange,
      topProducts,
      recentOrders,
    };
  } catch (error) {
    console.error('[Dashboard] Erro ao carregar dados:', error);
    return {
      todayOrders: 0,
      pendingOrders: 0,
      activeOrders: 0,
      todayRevenue: 0,
      revenueChange: 0,
      topProducts: [],
      recentOrders: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats = [
    {
      label: 'Pedidos Novos',
      value: data.pendingOrders,
      icon: ShoppingBag,
      change: '+5%',
      changeType: 'positive' as const,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Faturamento do Dia',
      value: `€ ${data.todayRevenue.toFixed(2)}`,
      icon: Euro,
      change: `${data.revenueChange > 0 ? '+' : ''}${data.revenueChange.toFixed(1)}%`,
      changeType: data.revenueChange >= 0 ? 'positive' as const : 'negative' as const,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Pedidos em Andamento',
      value: data.activeOrders,
      icon: Clock,
      change: '-3%',
      changeType: 'negative' as const,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Produtos Mais Vendidos',
      value: data.topProducts[0]?.name || 'N/A',
      icon: TrendingUp,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'bg-purple-100 text-purple-600',
      subtitle: data.topProducts.slice(1, 3).map(p => p.name).join(', '),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-black leading-tight tracking-tight text-[#FF6B00]">
          Dashboard
        </h1>
        <div className="text-sm text-[#a16b45]">
          Última atualização: {new Date().toLocaleTimeString('pt-PT')}
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
                <p className="text-base font-semibold leading-normal text-[#FF6B00]">
                  {stat.label}
                </p>
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
      <DashboardCharts />

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders orders={data.recentOrders} />
        </div>
        <div>
          <TopProducts products={data.topProducts} />
        </div>
      </div>
    </div>
  );
}

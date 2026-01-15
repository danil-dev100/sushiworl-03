import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Cache por 5 minutos
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    // Calcular data de início baseado no período
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (period === 'custom' && customStartDate && customEndDate) {
      // Período personalizado
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // Ajustar endDate para incluir o dia completo
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Períodos predefinidos
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = new Date(0); // Desde o início
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Buscar pedidos confirmados no período (excluir pedidos de teste)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: period === 'custom'
          ? { gte: startDate, lte: endDate }
          : { gte: startDate },
        status: {
          notIn: ['CANCELLED'],
        },
        isTest: false,
      },
      include: {
        orderItems: {
          include: {
            product: true, // Product.category é string, não relação
          },
        },
      },
    });

    // Buscar pedidos de hoje e calcular receita em uma única query otimizada
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Query otimizada: contar e somar em uma única operação
    const todayStats = await prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart },
        status: { notIn: ['CANCELLED'] },
        isTest: false,
      },
      _count: true,
      _sum: { total: true },
    });

    const todayOrders = todayStats._count;
    const todayRevenue = todayStats._sum.total || 0;

    // Contar pedidos por status em uma única query
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
      where: {
        isTest: false,
      },
    });

    const pendingOrders = statusCounts.find(s => s.status === 'PENDING')?._count || 0;
    const activeOrders = statusCounts
      .filter(s => ['CONFIRMED', 'PREPARING', 'DELIVERING'].includes(s.status))
      .reduce((sum, s) => sum + s._count, 0);

    // Calcular receita total do período
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Calcular ticket médio
    const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Contar clientes únicos
    const uniqueCustomers = new Set(orders.map(order => order.customerEmail)).size;

    // Calcular mudança de receita (comparar com período anterior) - query otimizada
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

    const previousStats = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        status: { notIn: ['CANCELLED'] },
        isTest: false,
      },
      _sum: { total: true },
    });

    const previousRevenue = previousStats._sum.total || 0;
    const revenueChange = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Top produtos
    const productSales: { [key: string]: { name: string; count: number } } = {};

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.product) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.product.name,
              count: 0,
            };
          }
          productSales[item.productId].count += item.quantity;
        }
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        name: data.name,
        orderCount: data.count,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    // Pedidos recentes (excluir pedidos de teste)
    const recentOrders = await prisma.order.findMany({
      where: {
        isTest: false,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    // Receita por categoria (category é string no Product)
    const categoryRevenue: { [key: string]: { name: string; revenue: number; orderCount: number } } = {};

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.product && item.product.category) {
          const categoryName = item.product.category; // category é string
          if (!categoryRevenue[categoryName]) {
            categoryRevenue[categoryName] = {
              name: categoryName,
              revenue: 0,
              orderCount: 0,
            };
          }
          categoryRevenue[categoryName].revenue += item.priceAtTime * item.quantity;
          categoryRevenue[categoryName].orderCount += 1;
        }
      });
    });

    const categoryRevenueArray = Object.values(categoryRevenue)
      .map(cat => ({
        name: cat.name,
        revenue: Number(cat.revenue.toFixed(2)),
        orderCount: cat.orderCount,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      todayOrders,
      pendingOrders,
      activeOrders,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      revenueChange: Number(revenueChange.toFixed(1)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageTicket: Number(averageTicket.toFixed(2)),
      totalOrders: orders.length,
      uniqueCustomers,
      categoryRevenue: categoryRevenueArray,
      topProducts,
      recentOrders,
    });
  } catch (error) {
    console.error('[Dashboard API] Erro:', error);
    console.error('[Dashboard API] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('[Dashboard API] Error message:', error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      {
        error: 'Erro ao buscar dados do dashboard',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
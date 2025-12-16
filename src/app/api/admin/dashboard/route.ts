import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
            product: true,
          },
        },
      },
    });

    // Buscar pedidos de hoje
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
        status: {
          notIn: ['CANCELLED'],
        },
        isTest: false,
      },
    });

    // Contar pedidos pendentes e ativos
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });

    const activeOrders = await prisma.order.count({
      where: {
        status: {
          in: ['CONFIRMED', 'PREPARING', 'DELIVERING'],
        },
      },
    });

    // Calcular receita de hoje
    const todayOrdersData = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
        },
        status: {
          notIn: ['CANCELLED'],
        },
        isTest: false,
      },
      select: {
        total: true,
      },
    });

    const todayRevenue = todayOrdersData.reduce((sum, order) => sum + order.total, 0);

    // Calcular receita total do período
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Calcular ticket médio
    const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Contar clientes únicos
    const uniqueCustomers = new Set(orders.map(order => order.customerEmail)).size;

    // Calcular mudança de receita (comparar com período anterior)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        status: {
          notIn: ['CANCELLED'],
        },
        isTest: false,
      },
      select: {
        total: true,
      },
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
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
      categoryRevenue: [],
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
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

type PeriodParams = {
  days?: number;
  startDate?: string;
  endDate?: string;
};

function getDateRange(params: PeriodParams) {
  const endDate = params.endDate ? new Date(params.endDate) : new Date();
  const startDate = params.startDate
    ? new Date(params.startDate)
    : new Date(endDate.getTime() - (params.days || 7) * 24 * 60 * 60 * 1000);

  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const { startDate, endDate } = getDateRange({
      days,
      startDate: startDateParam || undefined,
      endDate: endDateParam || undefined,
    });

    console.log('[Analytics API] Período:', { startDate, endDate, days });

    // Período anterior para comparação
    const previousStartDate = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime())
    );

    // Buscar pedidos do período atual
    const currentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Buscar pedidos do período anterior
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    // Calcular métricas
    const currentRevenue = currentOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const previousRevenue = previousOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;
    const orderGrowth = previousOrderCount > 0
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
      : 0;

    // Clientes únicos
    const uniqueCustomers = new Set(
      currentOrders.map((order) => order.userId).filter(Boolean)
    ).size;
    const previousUniqueCustomers = new Set(
      previousOrders.map((order) => order.userId).filter(Boolean)
    ).size;
    const customerGrowth = previousUniqueCustomers > 0
      ? ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100
      : 0;

    // Ticket médio
    const avgTicket = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const previousAvgTicket =
      previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
    const avgTicketGrowth = previousAvgTicket > 0
      ? ((avgTicket - previousAvgTicket) / previousAvgTicket) * 100
      : 0;

    // LTV simplificado (média de pedidos por cliente * ticket médio)
    const ordersPerCustomer = uniqueCustomers > 0 ? currentOrderCount / uniqueCustomers : 0;
    const ltv = avgTicket * ordersPerCustomer;

    // CAC (simplificado - assumindo custo de marketing)
    // Você pode implementar tracking de gastos com marketing
    const cac = 0; // Placeholder

    // Taxa de retenção (clientes que fizeram mais de 1 pedido)
    const repeatCustomers = await prisma.user.count({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });
    const retentionRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

    // Vendas por categoria
    const salesByCategory: Record<string, number> = {};
    currentOrders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const category = item.product?.category || 'Outros';
        salesByCategory[category] =
          (salesByCategory[category] || 0) + Number(item.priceAtTime ?? 0) * item.quantity;
      });
    });

    // Evolução diária de pedidos
    const dailyOrders: Record<string, number> = {};
    currentOrders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    // Primeiras compras (simplificado - verificar se usuário tem apenas este pedido)
    const userOrderCounts = new Map<string, number>();
    currentOrders.forEach((order) => {
      if (order.userId) {
        userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1);
      }
    });
    
    const firstPurchases = Array.from(userOrderCounts.values()).filter(count => count === 1).length;

    const firstPurchaseRate = currentOrderCount > 0 ? (firstPurchases / currentOrderCount) * 100 : 0;

    // Promoções usadas
    const promotionsUsed = await prisma.promotion.findMany({
      where: {
        usageCount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        usageCount: true,
        discountValue: true,
        discountType: true,
      },
    });

    // Métricas de marketing por tipo
    const promotionsByType = promotionsUsed.reduce<Record<string, number>>((acc, promo) => {
      acc[promo.type] = (acc[promo.type] || 0) + promo.usageCount;
      return acc;
    }, {});

    // Calcular economia total das promoções
    const totalSavings = promotionsUsed.reduce((sum, promo) => {
      const discountValue = promo.discountType === 'FIXED' 
        ? promo.discountValue * promo.usageCount
        : 0; // Para porcentagem, precisaria do valor dos pedidos
      return sum + discountValue;
    }, 0);

    return NextResponse.json({
      period: {
        startDate,
        endDate,
        days,
      },
      metrics: {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth,
        },
        orders: {
          current: currentOrderCount,
          previous: previousOrderCount,
          growth: orderGrowth,
        },
        customers: {
          current: uniqueCustomers,
          previous: previousUniqueCustomers,
          growth: customerGrowth,
        },
        avgTicket: {
          current: avgTicket,
          previous: previousAvgTicket,
          growth: avgTicketGrowth,
        },
        ltv,
        cac,
        retentionRate,
        firstPurchaseRate,
      },
      charts: {
        salesByCategory,
        dailyOrders,
      },
      marketing: {
        promotions: promotionsUsed,
        promotionsByType,
        totalSavings,
        totalPromotionUses: promotionsUsed.reduce((sum, p) => sum + p.usageCount, 0),
      },
    });
  } catch (error) {
    console.error('[Analytics API][GET] Erro ao buscar métricas:', error);
    
    // Retornar erro detalhado para debug
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar métricas',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


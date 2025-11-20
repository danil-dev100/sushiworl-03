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

    // Primeiras compras vs pedidos recorrentes
    const userOrderCounts = new Map<string, number>();
    let newOrders = 0;
    let recurringOrders = 0;

    for (const order of currentOrders) {
      if (order.userId) {
        // Verificar se é primeira compra do usuário
        const previousOrders = await prisma.order.count({
          where: {
            userId: order.userId,
            createdAt: {
              lt: order.createdAt,
            },
          },
        });

        if (previousOrders === 0) {
          newOrders++;
        } else {
          recurringOrders++;
        }
      } else {
        // Se não tem userId, considera como novo (guest)
        newOrders++;
      }
    }

    const firstPurchaseRate = currentOrderCount > 0 ? (newOrders / currentOrderCount) * 100 : 0;

    // Calcular valores com e sem desconto
    const revenueWithDiscount = currentRevenue;
    const revenueWithoutDiscount = currentOrders.reduce(
      (sum, order) => sum + order.subtotal,
      0
    );

    // Promoções usadas com evolução
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
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            total: true,
            discount: true,
          },
        },
      },
    });

    // Evolução diária de cada promoção
    const promotionsWithEvolution = promotionsUsed.map((promo) => {
      const evolutionMap = new Map<string, { uses: number; revenue: number }>();
      
      promo.orders.forEach((order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        const current = evolutionMap.get(date) || { uses: 0, revenue: 0 };
        evolutionMap.set(date, {
          uses: current.uses + 1,
          revenue: current.revenue + order.total,
        });
      });

      const evolution = Array.from(evolutionMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        id: promo.id,
        name: promo.name,
        type: promo.type,
        usageCount: promo.usageCount,
        discountValue: promo.discountValue,
        discountType: promo.discountType,
        evolution,
      };
    });

    // Métricas de marketing por tipo
    const promotionsByType = promotionsWithEvolution.reduce<Record<string, number>>((acc, promo) => {
      acc[promo.type] = (acc[promo.type] || 0) + promo.usageCount;
      return acc;
    }, {});

    // Calcular economia total das promoções
    const totalSavings = currentOrders.reduce((sum, order) => sum + order.discount, 0);

    // Dados de UTM
    const utmOrders = currentOrders.filter((order) => order.utmSource);
    
    // Agrupar por fonte UTM
    const utmSourcesMap = new Map<string, {
      orders: number;
      revenue: number;
      customers: Set<string>;
      evolution: Map<string, { orders: number; revenue: number }>;
    }>();

    utmOrders.forEach((order) => {
      const source = order.utmSource || 'unknown';
      const date = order.createdAt.toISOString().split('T')[0];
      
      if (!utmSourcesMap.has(source)) {
        utmSourcesMap.set(source, {
          orders: 0,
          revenue: 0,
          customers: new Set(),
          evolution: new Map(),
        });
      }

      const sourceData = utmSourcesMap.get(source)!;
      sourceData.orders++;
      sourceData.revenue += order.total;
      if (order.userId) sourceData.customers.add(order.userId);

      const evolutionData = sourceData.evolution.get(date) || { orders: 0, revenue: 0 };
      sourceData.evolution.set(date, {
        orders: evolutionData.orders + 1,
        revenue: evolutionData.revenue + order.total,
      });
    });

    const utmSources = Array.from(utmSourcesMap.entries()).map(([source, data]) => ({
      source,
      orders: data.orders,
      revenue: data.revenue,
      customers: data.customers.size,
      avgTicket: data.orders > 0 ? data.revenue / data.orders : 0,
      evolution: Array.from(data.evolution.entries())
        .map(([date, evo]) => ({ date, ...evo }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));

    // Dados de campanhas UTM detalhadas
    const utmCampaignsMap = new Map<string, {
      campaign: string;
      source: string;
      medium: string;
      orders: number;
      revenue: number;
      customers: Set<string>;
    }>();

    currentOrders.forEach((order) => {
      if (!order.utmSource) return;

      // Buscar dados completos de UTM do usuário
      const key = `${order.utmSource}-${order.userId || 'guest'}`;
      const campaign = 'campaign'; // Placeholder - precisa ser capturado do usuário
      const medium = 'medium'; // Placeholder
      
      if (!utmCampaignsMap.has(key)) {
        utmCampaignsMap.set(key, {
          campaign: campaign,
          source: order.utmSource,
          medium: medium,
          orders: 0,
          revenue: 0,
          customers: new Set(),
        });
      }

      const campaignData = utmCampaignsMap.get(key)!;
      campaignData.orders++;
      campaignData.revenue += order.total;
      if (order.userId) campaignData.customers.add(order.userId);
    });

    const utmCampaigns = Array.from(utmCampaignsMap.values()).map((data) => ({
      campaign: data.campaign,
      source: data.source,
      medium: data.medium,
      orders: data.orders,
      revenue: data.revenue,
      customers: data.customers.size,
    }));

    const totalUTMOrders = utmOrders.length;
    const totalUTMRevenue = utmOrders.reduce((sum, order) => sum + order.total, 0);

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
        revenueWithoutDiscount,
        revenueWithDiscount,
        orders: {
          current: currentOrderCount,
          previous: previousOrderCount,
          growth: orderGrowth,
        },
        newOrders,
        recurringOrders,
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
        promotions: promotionsWithEvolution,
        promotionsByType,
        totalSavings,
        totalPromotionUses: promotionsWithEvolution.reduce((sum, p) => sum + p.usageCount, 0),
      },
      utm: {
        sources: utmSources,
        campaigns: utmCampaigns,
        totalUTMOrders,
        totalUTMRevenue,
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


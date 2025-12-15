import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar dados de vendas dos últimos 7 dias (excluir pedidos de teste)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesData = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        SUM(total) as sales,
        COUNT(*) as orders
      FROM "Order"
      WHERE "createdAt" >= ${sevenDaysAgo}
        AND status != 'CANCELLED'
        AND "isTest" = false
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") DESC
      LIMIT 7
    `;

    // Buscar dados de status dos pedidos (excluir pedidos de teste)
    const orderStatusData = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        isTest: false,
      },
    });

    // Mapear status para nomes legíveis
    const statusMapping: Record<string, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      PREPARING: 'Preparando',
      DELIVERING: 'Em Entrega',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado',
    };

    const processedOrderStatusData = orderStatusData.map((item) => ({
      name: statusMapping[item.status] || item.status,
      value: item._count.status,
    }));

    return NextResponse.json({
      salesData: salesData || [],
      orderStatusData: processedOrderStatusData || [],
      lastUpdate: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dashboard Charts API] Erro:', error);
    // Retornar dados vazios em caso de erro - o frontend usará dados mockados
    return NextResponse.json({
      salesData: [],
      orderStatusData: [],
      error: 'Dados não disponíveis',
    });
  }
}

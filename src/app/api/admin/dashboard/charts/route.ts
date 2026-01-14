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

    // Obter período da query string
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7days';

    // Calcular data de início baseado no período
    const now = new Date();
    let startDate: Date;
    let days: number;

    switch (period) {
      case '7days':
        days = 7;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        days = 30;
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        days = 90;
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        days = 7;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const salesData = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        SUM(total) as sales,
        COUNT(*) as orders
      FROM "Order"
      WHERE "createdAt" >= ${startDate}
        AND status != 'CANCELLED'
        AND "isTest" = false
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") DESC
      LIMIT ${days}
    `;

    // Buscar dados de status dos pedidos (excluir pedidos de teste)
    const orderStatusData = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: {
        createdAt: {
          gte: startDate,
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
    console.error('[Dashboard Charts API] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('[Dashboard Charts API] Error message:', error instanceof Error ? error.message : String(error));

    // Retornar dados vazios em caso de erro - o frontend usará dados mockados
    return NextResponse.json(
      {
        salesData: [],
        orderStatusData: [],
        error: 'Dados não disponíveis',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

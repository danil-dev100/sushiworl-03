import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    // SEGURANÇA: Bloquear em produção
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Endpoint de debug não disponível em produção' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      counts: {},
      errors: [],
    };

    // Verificar tabelas principais
    try {
      const orderCount = await prisma.order.count();
      diagnostics.counts.orders = orderCount;
      diagnostics.tables.Order = 'OK';
    } catch (e: any) {
      diagnostics.tables.Order = 'ERRO';
      diagnostics.errors.push({ table: 'Order', error: e.message });
    }

    try {
      const productCount = await prisma.product.count();
      diagnostics.counts.products = productCount;
      diagnostics.tables.Product = 'OK';
    } catch (e: any) {
      diagnostics.tables.Product = 'ERRO';
      diagnostics.errors.push({ table: 'Product', error: e.message });
    }

    try {
      const userCount = await prisma.user.count();
      diagnostics.counts.users = userCount;
      diagnostics.tables.User = 'OK';
    } catch (e: any) {
      diagnostics.tables.User = 'ERRO';
      diagnostics.errors.push({ table: 'User', error: e.message });
    }

    // Verificar tabela AuditLog
    try {
      const auditCount = await prisma.auditLog.count();
      diagnostics.counts.auditLogs = auditCount;
      diagnostics.tables.AuditLog = 'OK';
    } catch (e: any) {
      diagnostics.tables.AuditLog = 'ERRO - Tabela pode não existir';
      diagnostics.errors.push({ table: 'AuditLog', error: e.message });
    }

    // Verificar tabela CustomMetric
    try {
      const metricCount = await prisma.customMetric.count();
      diagnostics.counts.customMetrics = metricCount;
      diagnostics.tables.CustomMetric = 'OK';
    } catch (e: any) {
      diagnostics.tables.CustomMetric = 'ERRO - Tabela pode não existir';
      diagnostics.errors.push({ table: 'CustomMetric', error: e.message });
    }

    // Buscar últimos pedidos para verificar dados
    try {
      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          isTest: true,
        },
      });
      diagnostics.recentOrders = recentOrders;
    } catch (e: any) {
      diagnostics.errors.push({ query: 'recentOrders', error: e.message });
    }

    // Contar pedidos por status
    try {
      const statusCounts = await prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: { isTest: false },
      });
      diagnostics.ordersByStatus = statusCounts;
    } catch (e: any) {
      diagnostics.errors.push({ query: 'ordersByStatus', error: e.message });
    }

    // Verificar pedidos dos últimos 30 dias
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30Days = await prisma.order.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          isTest: false,
        },
      });
      diagnostics.counts.ordersLast30Days = last30Days;
    } catch (e: any) {
      diagnostics.errors.push({ query: 'ordersLast30Days', error: e.message });
    }

    // Testar raw query (como a do dashboard)
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const salesDataRaw = await prisma.$queryRaw<Array<{ date: Date; sales: any; orders: any }>>`
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
        LIMIT 7
      `;

      diagnostics.rawQueryResult = salesDataRaw.map(item => ({
        date: item.date,
        sales: Number(item.sales || 0),
        orders: Number(item.orders || 0),
      }));
    } catch (e: any) {
      diagnostics.errors.push({ query: 'rawSalesQuery', error: e.message });
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('[Debug API] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro no diagnóstico',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

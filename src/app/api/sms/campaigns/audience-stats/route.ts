import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Obter estatísticas de audiência
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const audienceType = searchParams.get('type') || 'all';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let whereTotal: any = {};
    let whereWithPhone: any = { phone: { not: null } };

    switch (audienceType) {
      case 'active':
        // Clientes com pedidos nos últimos 30 dias
        const activeCustomerIds = await prisma.order.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { customerId: true },
          distinct: ['customerId'],
        });
        const activeIds = activeCustomerIds.map(o => o.customerId).filter(Boolean) as string[];
        whereTotal.id = { in: activeIds };
        whereWithPhone.id = { in: activeIds };
        break;

      case 'inactive':
        // Clientes sem pedidos há mais de 60 dias
        const recentCustomerIds = await prisma.order.findMany({
          where: {
            createdAt: { gte: sixtyDaysAgo },
          },
          select: { customerId: true },
          distinct: ['customerId'],
        });
        const recentIds = recentCustomerIds.map(o => o.customerId).filter(Boolean) as string[];
        whereTotal.id = { notIn: recentIds };
        whereWithPhone.id = { notIn: recentIds };
        break;

      case 'new':
        // Clientes cadastrados nos últimos 7 dias
        whereTotal.createdAt = { gte: sevenDaysAgo };
        whereWithPhone.createdAt = { gte: sevenDaysAgo };
        break;

      case 'all':
      default:
        // Todos os clientes
        break;
    }

    // Contar total de clientes no segmento
    const total = await prisma.customer.count({
      where: whereTotal,
    });

    // Contar clientes com telefone no segmento
    const withPhone = await prisma.customer.count({
      where: whereWithPhone,
    });

    return NextResponse.json({
      total,
      withPhone,
      percentage: total > 0 ? Math.round((withPhone / total) * 100) : 0,
    });
  } catch (error) {
    console.error('[SMS Audience Stats] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas' },
      { status: 500 }
    );
  }
}

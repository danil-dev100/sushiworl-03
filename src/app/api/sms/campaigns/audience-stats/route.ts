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

    // Base: apenas usuários com role CUSTOMER
    let whereTotal: any = { role: 'CUSTOMER' };
    let whereWithPhone: any = { role: 'CUSTOMER', phone: { not: null } };

    switch (audienceType) {
      case 'active':
        // Clientes com pedidos nos últimos 30 dias
        const activeOrders = await prisma.order.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            userId: { not: null },
          },
          select: { userId: true },
          distinct: ['userId'],
        });
        const activeIds = activeOrders.map(o => o.userId).filter(Boolean) as string[];
        if (activeIds.length > 0) {
          whereTotal.id = { in: activeIds };
          whereWithPhone.id = { in: activeIds };
        } else {
          return NextResponse.json({ total: 0, withPhone: 0, percentage: 0 });
        }
        break;

      case 'inactive':
        // Clientes sem pedidos há mais de 60 dias
        const recentOrders = await prisma.order.findMany({
          where: {
            createdAt: { gte: sixtyDaysAgo },
            userId: { not: null },
          },
          select: { userId: true },
          distinct: ['userId'],
        });
        const recentIds = recentOrders.map(o => o.userId).filter(Boolean) as string[];
        if (recentIds.length > 0) {
          whereTotal.id = { notIn: recentIds };
          whereWithPhone.id = { notIn: recentIds };
        }
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
    const total = await prisma.user.count({
      where: whereTotal,
    });

    // Contar clientes com telefone no segmento
    const withPhone = await prisma.user.count({
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

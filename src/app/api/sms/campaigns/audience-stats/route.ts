import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Fórmula para evitar sobreposição de públicos:
 *
 * REGRA GERAL: Só envia para clientes que JÁ FIZERAM COMPRA
 *
 * Públicos Pós-Primeira Compra (follow-up):
 * - first_purchase_24h: Primeira compra entre 24h e 72h atrás (exclusivo)
 * - first_purchase_72h: Primeira compra entre 72h e 7 dias atrás (exclusivo)
 *
 * Públicos de Reengajamento (última compra):
 * - last_purchase_7d: Última compra entre 7 e 14 dias atrás (exclusivo)
 * - last_purchase_14d: Última compra entre 14 e 21 dias atrás (exclusivo)
 * - last_purchase_21d: Última compra entre 21 e 30 dias atrás (exclusivo)
 *
 * Públicos Inativos (win-back):
 * - inactive_30d: Última compra entre 30 e 45 dias atrás (exclusivo)
 * - inactive_45d: Última compra entre 45 e 60 dias atrás (exclusivo)
 * - inactive_60d: Última compra há 60+ dias
 *
 * Públicos Gerais:
 * - active: Compraram nos últimos 30 dias
 * - new: Cadastrados nos últimos 7 dias E já fizeram pelo menos 1 compra
 * - all: Todos os clientes que já fizeram pelo menos 1 compra
 */

// Helper para calcular datas
function getDateRange(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

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

    // Datas de referência (em dias)
    const hours24 = getDateRange(1);
    const hours72 = getDateRange(3);
    const days7 = getDateRange(7);
    const days14 = getDateRange(14);
    const days21 = getDateRange(21);
    const days30 = getDateRange(30);
    const days45 = getDateRange(45);
    const days60 = getDateRange(60);

    let userIds: string[] = [];
    let description = '';

    switch (audienceType) {
      case 'all': {
        // Todos os clientes que já fizeram pelo menos 1 pedido
        const orders = await prisma.order.findMany({
          where: { userId: { not: null } },
          select: { userId: true },
          distinct: ['userId'],
        });
        userIds = orders.map(o => o.userId).filter(Boolean) as string[];
        description = 'Todos os clientes com pelo menos 1 compra';
        break;
      }

      case 'active': {
        // Clientes que compraram nos últimos 30 dias
        const orders = await prisma.order.findMany({
          where: {
            userId: { not: null },
            createdAt: { gte: days30 },
          },
          select: { userId: true },
          distinct: ['userId'],
        });
        userIds = orders.map(o => o.userId).filter(Boolean) as string[];
        description = 'Clientes ativos (compraram nos últimos 30 dias)';
        break;
      }

      case 'new': {
        // Clientes cadastrados nos últimos 7 dias que já fizeram pelo menos 1 pedido
        const newUsers = await prisma.user.findMany({
          where: {
            role: 'CUSTOMER',
            createdAt: { gte: days7 },
          },
          select: { id: true },
        });
        const newUserIds = newUsers.map(u => u.id);

        if (newUserIds.length > 0) {
          const orders = await prisma.order.findMany({
            where: {
              userId: { in: newUserIds },
            },
            select: { userId: true },
            distinct: ['userId'],
          });
          userIds = orders.map(o => o.userId).filter(Boolean) as string[];
        }
        description = 'Novos clientes (últimos 7 dias) com pelo menos 1 compra';
        break;
      }

      case 'first_purchase_24h': {
        // Clientes cuja PRIMEIRA compra foi entre 24h e 72h atrás
        // Buscar todos os usuários e suas primeiras compras
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _min: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const firstOrder = u._min.createdAt;
            if (!firstOrder) return false;
            // Entre 24h e 72h atrás (exclusivo no limite superior)
            return firstOrder <= hours24 && firstOrder > hours72;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Primeira compra entre 24h e 72h atrás';
        break;
      }

      case 'first_purchase_72h': {
        // Clientes cuja PRIMEIRA compra foi entre 72h e 7 dias atrás
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _min: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const firstOrder = u._min.createdAt;
            if (!firstOrder) return false;
            // Entre 72h e 7 dias atrás (exclusivo no limite superior)
            return firstOrder <= hours72 && firstOrder > days7;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Primeira compra entre 3 e 7 dias atrás';
        break;
      }

      case 'last_purchase_7d': {
        // Clientes cuja ÚLTIMA compra foi entre 7 e 14 dias atrás
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _max: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const lastOrder = u._max.createdAt;
            if (!lastOrder) return false;
            // Entre 7 e 14 dias atrás (exclusivo no limite superior)
            return lastOrder <= days7 && lastOrder > days14;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Última compra entre 7 e 14 dias atrás';
        break;
      }

      case 'last_purchase_14d': {
        // Clientes cuja ÚLTIMA compra foi entre 14 e 21 dias atrás
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _max: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const lastOrder = u._max.createdAt;
            if (!lastOrder) return false;
            return lastOrder <= days14 && lastOrder > days21;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Última compra entre 14 e 21 dias atrás';
        break;
      }

      case 'last_purchase_21d': {
        // Clientes cuja ÚLTIMA compra foi entre 21 e 30 dias atrás
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _max: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const lastOrder = u._max.createdAt;
            if (!lastOrder) return false;
            return lastOrder <= days21 && lastOrder > days30;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Última compra entre 21 e 30 dias atrás';
        break;
      }

      case 'inactive_30d': {
        // Clientes cuja ÚLTIMA compra foi entre 30 e 45 dias atrás
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _max: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const lastOrder = u._max.createdAt;
            if (!lastOrder) return false;
            return lastOrder <= days30 && lastOrder > days45;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Última compra entre 30 e 45 dias atrás';
        break;
      }

      case 'inactive_45d': {
        // Clientes cuja ÚLTIMA compra foi entre 45 e 60 dias atrás
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _max: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const lastOrder = u._max.createdAt;
            if (!lastOrder) return false;
            return lastOrder <= days45 && lastOrder > days60;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Última compra entre 45 e 60 dias atrás';
        break;
      }

      case 'inactive_60d':
      case 'inactive': {
        // Clientes cuja ÚLTIMA compra foi há 60+ dias
        const usersWithOrders = await prisma.order.groupBy({
          by: ['userId'],
          _max: { createdAt: true },
          where: { userId: { not: null } },
        });

        userIds = usersWithOrders
          .filter(u => {
            const lastOrder = u._max.createdAt;
            if (!lastOrder) return false;
            return lastOrder <= days60;
          })
          .map(u => u.userId)
          .filter(Boolean) as string[];
        description = 'Última compra há mais de 60 dias';
        break;
      }

      case 'list': {
        // Lista de contatos importada - não usa users do sistema
        return NextResponse.json({
          total: 0,
          withPhone: 0,
          percentage: 0,
          description: 'Usar lista de contatos importada',
          isContactList: true,
        });
      }

      default:
        return NextResponse.json({
          total: 0,
          withPhone: 0,
          percentage: 0,
          description: 'Tipo de audiência não reconhecido',
        });
    }

    if (userIds.length === 0) {
      return NextResponse.json({
        total: 0,
        withPhone: 0,
        percentage: 0,
        description,
      });
    }

    // Contar total de clientes no segmento
    const total = userIds.length;

    // Contar clientes com telefone no segmento
    const withPhone = await prisma.user.count({
      where: {
        id: { in: userIds },
        phone: { not: null },
      },
    });

    return NextResponse.json({
      total,
      withPhone,
      percentage: total > 0 ? Math.round((withPhone / total) * 100) : 0,
      description,
    });
  } catch (error) {
    console.error('[SMS Audience Stats] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas' },
      { status: 500 }
    );
  }
}

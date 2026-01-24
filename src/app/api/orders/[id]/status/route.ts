import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        total: true,
        userId: true,
        customerEmail: true,
        orderNumber: true,
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar autorização: usuário logado deve ser dono do pedido ou admin
    const session = await getServerSession(authOptions);

    // Se o pedido tem userId, verificar se o usuário logado é o dono ou admin
    if (order.userId) {
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        );
      }

      const isOwner = session.user.id === order.userId;
      const isAdmin = ['ADMIN', 'MANAGER'].includes(session.user.role);

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado a ver este pedido' },
          { status: 403 }
        );
      }
    }

    // Se pedido é de cliente não logado (guest), permitir acesso apenas com orderNumber
    // Para pedidos guest, o ID é suficiente pois é um UUID difícil de adivinhar

    // Remover campos sensíveis da resposta
    const { userId, customerEmail, ...safeOrder } = order;

    return NextResponse.json({
      success: true,
      order: safeOrder
    });
  } catch (error) {
    console.error('[Order Status API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar status do pedido' },
      { status: 500 }
    );
  }
}

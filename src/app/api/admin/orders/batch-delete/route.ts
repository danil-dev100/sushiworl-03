import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs de pedidos inválidos' },
        { status: 400 }
      );
    }

    // Verificar se os pedidos existem
    const orders = await prisma.order.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais pedidos não foram encontrados' },
        { status: 404 }
      );
    }

    // Deletar os pedidos e seus itens relacionados
    await prisma.$transaction(async (tx) => {
      // Primeiro deletar os OrderItems
      await tx.orderItem.deleteMany({
        where: {
          orderId: {
            in: orderIds,
          },
        },
      });

      // Depois deletar os pedidos
      await tx.order.deleteMany({
        where: {
          id: {
            in: orderIds,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `${orders.length} pedido(s) deletado(s) com sucesso`,
      deletedOrders: orders.map(o => `#SW${o.orderNumber.toString().padStart(5, '0')}`),
    });

  } catch (error) {
    console.error('Erro ao deletar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageOrders } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerWebhooks, formatOrderPayload, WebhookEvent } from '@/lib/webhooks';
import { logUpdate } from '@/lib/audit-log';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageOrders(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        deliveryArea: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageOrders(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validar status
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Buscar pedido antes de atualizar para audit log
    const oldOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        orderNumber: true,
      },
    });

    // Atualizar pedido
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === 'CONFIRMED' && { acceptedAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
      include: {
        orderItems: true,
        user: true,
      },
    });

    // Disparar webhook baseado no novo status
    const eventMap: Record<string, WebhookEvent> = {
      'CONFIRMED': 'order.confirmed',
      'PREPARING': 'order.preparing',
      'DELIVERING': 'order.delivering',
      'DELIVERED': 'order.delivered',
      'CANCELLED': 'order.cancelled',
    };

    const event = eventMap[status];
    if (event) {
      console.log(`[Order API] ✅ Disparando webhook: ${event} para pedido #${updatedOrder.orderNumber}`);
      triggerWebhooks(event, formatOrderPayload(updatedOrder)).catch(error => {
        console.error(`[Order API] ❌ Erro ao disparar webhook ${event}:`, error);
      });
    }

    // Registrar mudança de status no audit log
    if (oldOrder) {
      await logUpdate(
        'Order',
        id,
        { status: oldOrder.status },
        { status: updatedOrder.status },
        {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
        request
      );
    }

    // TODO: Enviar notificação ao cliente (email/SMS)

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Não deletar, apenas cancelar
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json(cancelledOrder);
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar pedido' },
      { status: 500 }
    );
  }
}


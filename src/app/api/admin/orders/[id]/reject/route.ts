import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isRestaurantOpen } from '@/lib/restaurant-status';
import { triggerWebhooks, formatOrderPayload } from '@/lib/webhooks';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;
    const body = await req.json();
    const { reason: customReason } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Pedido já foi processado' },
        { status: 400 }
      );
    }

    // Verificar status do restaurante para determinar mensagem contextual
    const { isOpen, reason: statusReason } = await isRestaurantOpen();

    let rejectionReason = customReason;
    let redirectReason = 'high-demand'; // Default

    if (!isOpen) {
      if (statusReason === 'closed') {
        rejectionReason = 'Restaurante fechado no momento';
        redirectReason = 'closed';
      } else if (statusReason === 'offline') {
        rejectionReason = 'Restaurante offline - não aceitando pedidos';
        redirectReason = 'offline';
      }
    } else if (!customReason) {
      rejectionReason = 'Alta demanda - não aceitando novos pedidos no momento';
      redirectReason = 'high-demand';
    }

    // Atualizar pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        observations: rejectionReason
      }
    });

    console.log(`[Reject Order] Pedido ${orderId} recusado. Motivo: ${rejectionReason}`);

    // Disparar webhooks para o evento order.cancelled
    triggerWebhooks('order.cancelled', formatOrderPayload(updatedOrder)).catch(error => {
      console.error('[Reject Order] Erro ao disparar webhooks:', error);
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      redirectUrl: `/pedido-recusado?reason=${redirectReason}`,
      message: rejectionReason
    });
  } catch (error) {
    console.error('[Reject Order API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao recusar pedido' },
      { status: 500 }
    );
  }
}

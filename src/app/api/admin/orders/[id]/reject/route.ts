import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isRestaurantOpen } from '@/lib/restaurant-status';
import { triggerWebhooks, formatOrderPayload } from '@/lib/webhooks';
import { emailService } from '@/lib/email-service';

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

    // Enviar email de pedido cancelado
    try {
      const cancelledTemplate = await prisma.emailTemplate.findUnique({
        where: { name: 'Pedido Cancelado' }
      });

      if (cancelledTemplate && order.customerEmail) {
        // Buscar pedido completo com itens
        const fullOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { orderItems: true }
        });

        if (fullOrder) {
          // Substituir variáveis no template
          let emailHtml = cancelledTemplate.htmlContent;
          let emailSubject = cancelledTemplate.subject;

          // Substituir no subject
          emailSubject = emailSubject.replace(/\{\{orderNumber\}\}/g, fullOrder.orderNumber?.toString() || '');

          // Substituir no HTML
          emailHtml = emailHtml.replace(/\{\{customerName\}\}/g, fullOrder.customerName || '');
          emailHtml = emailHtml.replace(/\{\{orderNumber\}\}/g, fullOrder.orderNumber?.toString() || '');
          emailHtml = emailHtml.replace(/\{\{valor_total\}\}/g, `€${fullOrder.total.toFixed(2)}`);

          const dataFormatada = new Date(fullOrder.createdAt).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          emailHtml = emailHtml.replace(/\{\{data_pedido\}\}/g, dataFormatada);

          const listaProdutos = fullOrder.orderItems
            .map(item => `• ${item.quantity}x ${item.name} - €${item.priceAtTime.toFixed(2)}`)
            .join('\n');
          emailHtml = emailHtml.replace(/\{\{lista_produtos\}\}/g, listaProdutos);

          // Buscar configurações
          const settings = await prisma.settings.findFirst();
          const companyName = settings?.companyName || 'SushiWorld';
          const phone = settings?.phone || 'Entre em contato conosco';

          emailHtml = emailHtml.replace(/\{\{nome_da_loja\}\}/g, companyName);
          emailHtml = emailHtml.replace(/\{\{telefone_loja\}\}/g, phone);

          // Enviar email
          await emailService.sendEmail({
            to: order.customerEmail,
            subject: emailSubject,
            html: emailHtml,
          });

          console.log(`[Reject Order] ✅ Email de pedido cancelado enviado para ${order.customerEmail}`);
        }
      }
    } catch (emailError) {
      console.error('[Reject Order] ⚠️ Erro ao enviar email (não crítico):', emailError);
      // Não falhar a rejeição se o email falhar
    }

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

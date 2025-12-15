import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmailService } from '@/lib/email-service';

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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        },
        deliveryArea: {
          select: {
            name: true
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

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Pedido já foi processado' },
        { status: 400 }
      );
    }

    // Atualizar status do pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED'
      }
    });

    // Enviar e-mail de confirmação (não-bloqueante)
    sendConfirmationEmail(order).catch(error => {
      console.error('[Accept Order] Erro ao enviar e-mail:', error);
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pedido aceito com sucesso! E-mail de confirmação sendo enviado.'
    });
  } catch (error) {
    console.error('[Accept Order API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao aceitar pedido' },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(order: any) {
  try {
    const emailService = new EmailService();
    await emailService.initialize();

    const itemsList = order.orderItems
      .map((item: any) => {
        const productName = item.product?.name || item.name;
        return `<tr><td style="padding:10px;border-bottom:1px solid #eee">${item.quantity}x</td><td style="padding:10px;border-bottom:1px solid #eee">${productName}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">€${item.priceAtTime.toFixed(2)}</td></tr>`;
      }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido Confirmado</title></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px"><div style="background-color:#FF6B00;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0"><h1 style="margin:0">✅ Pedido Confirmado!</h1></div><div style="background-color:#f9f9f9;padding:30px;border-radius:0 0 10px 10px"><p style="font-size:18px">Olá <strong>${order.customerName}</strong>,</p><p>Seu pedido foi <strong>confirmado</strong> e está sendo preparado!</p><div style="background-color:white;padding:20px;border-radius:8px;margin:20px 0"><h2 style="color:#FF6B00;margin-top:0">Detalhes do Pedido</h2><p><strong>Número:</strong> #${order.orderNumber}</p><table style="width:100%;margin-top:20px;border-collapse:collapse"><thead><tr style="background-color:#f5f5f5"><th style="padding:10px;text-align:left">Qtd</th><th style="padding:10px;text-align:left">Item</th><th style="padding:10px;text-align:right">Preço</th></tr></thead><tbody>${itemsList}</tbody></table><div style="margin-top:20px;padding-top:20px;border-top:2px solid #FF6B00"><p style="font-size:18px"><strong>Subtotal:</strong> <span style="float:right">€${order.subtotal.toFixed(2)}</span></p><p><strong>Taxa de Entrega:</strong> <span style="float:right">€${order.deliveryFee.toFixed(2)}</span></p><p style="font-size:20px;color:#FF6B00"><strong>Total:</strong> <span style="float:right">€${order.total.toFixed(2)}</span></p></div></div><div style="background-color:#e8f5e9;padding:15px;border-radius:8px"><p style="margin:0"><strong>⏱️ Tempo Estimado:</strong> 30-45 minutos</p></div><p style="margin-top:30px">Obrigado pela sua preferência!<br>Equipe SushiWorld</p></div></body></html>`;

    await emailService.sendEmail({
      to: order.customerEmail,
      subject: `✅ Pedido #${order.orderNumber} Confirmado - SushiWorld`,
      html,
      text: `Seu pedido #${order.orderNumber} foi confirmado! Total: €${order.total.toFixed(2)}. Tempo estimado: 30-45 minutos.`
    });

    console.log(`[Accept Order] E-mail enviado para ${order.customerEmail}`);
  } catch (error) {
    console.error('[Accept Order] Erro ao enviar e-mail:', error);
  }
}

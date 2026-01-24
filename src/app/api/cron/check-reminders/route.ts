import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { flowExecutionService } from '@/lib/flow-execution-service';

// Vercel Cron - roda a cada 5 minutos
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (Vercel Cron envia header especial)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      // Em produção, verifica o CRON_SECRET; em dev, permite sem auth
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] Verificando lembretes de pedidos agendados...');

    const now = new Date();

    // Buscar todos os fluxos ativos com trigger scheduled_order_reminder
    const activeFlows = await prisma.emailAutomation.findMany({
      where: {
        isActive: true,
        isDraft: false,
      },
    });

    // Encontrar o tempo de lembrete configurado nos fluxos
    let reminderMinutes = 60; // Padrão: 1 hora antes

    for (const flow of activeFlows) {
      const nodes = (flow.flow as any)?.nodes || [];
      const triggerNode = nodes.find((n: any) => n.type === 'trigger');

      if (triggerNode?.data?.eventType === 'scheduled_order_reminder' || triggerNode?.data?.event === 'scheduled_order_reminder') {
        // Verificar se há um nó de delay no fluxo
        const delayNode = nodes.find((n: any) => n.type === 'delay' || n.type === 'wait');
        if (delayNode?.data) {
          const duration = delayNode.data.duration || delayNode.data.delayValue || 60;
          const unit = delayNode.data.unit || delayNode.data.delayType || 'minutes';

          switch (unit) {
            case 'minutes':
              reminderMinutes = duration;
              break;
            case 'hours':
              reminderMinutes = duration * 60;
              break;
          }
        }
        break;
      }
    }

    // Janela de busca: pedidos com scheduledFor dentro do tempo de lembrete
    // Por exemplo, se reminderMinutes = 60, busca pedidos agendados para daqui 55-65 minutos
    const windowStart = new Date(now.getTime() + (reminderMinutes - 5) * 60 * 1000);
    const windowEnd = new Date(now.getTime() + (reminderMinutes + 5) * 60 * 1000);

    console.log(`[Cron] Buscando pedidos agendados entre ${windowStart.toISOString()} e ${windowEnd.toISOString()}`);

    const scheduledOrders = await prisma.order.findMany({
      where: {
        isScheduled: true,
        scheduledFor: {
          gte: windowStart,
          lte: windowEnd,
        },
        status: {
          notIn: ['CANCELLED', 'DELIVERED']
        },
        reminderSent: false,
      },
      include: {
        orderItems: true,
      }
    });

    console.log(`[Cron] Encontrados ${scheduledOrders.length} pedidos para lembrete`);

    const results = [];

    for (const order of scheduledOrders) {
      try {
        console.log(`[Cron] Enviando lembrete para pedido #${order.orderNumber} (${order.customerEmail})`);

        // Disparar evento de lembrete
        await flowExecutionService.triggerEvent('scheduled_order_reminder', {
          userId: order.userId || undefined,
          email: order.customerEmail,
          orderId: order.id,
          eventData: {
            orderNumber: order.orderNumber,
            total: order.total,
            itemsCount: order.orderItems.length,
            customerName: order.customerName,
            scheduledFor: order.scheduledFor,
          }
        });

        // Marcar lembrete como enviado
        await prisma.order.update({
          where: { id: order.id },
          data: { reminderSent: true }
        });

        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          email: order.customerEmail,
          status: 'sent'
        });

        console.log(`[Cron] ✅ Lembrete enviado para pedido #${order.orderNumber}`);

      } catch (error) {
        console.error(`[Cron] Erro ao enviar lembrete para pedido #${order.orderNumber}:`, error);
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          email: order.customerEmail,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: scheduledOrders.length,
      results,
      reminderMinutes,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    });

  } catch (error) {
    console.error('[Cron] Erro ao verificar lembretes:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

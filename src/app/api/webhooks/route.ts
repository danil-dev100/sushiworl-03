import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * Endpoint público para receber webhooks de plataformas externas (INBOUND)
 * URL para configurar em plataformas externas: https://seu-dominio.com/api/webhooks
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Pega o corpo da requisição
    const body = await request.json();
    const event = body.event || 'unknown';

    // Pega a assinatura do header
    const signature = request.headers.get('x-webhook-signature');
    const webhookUrl = request.url;

    console.log('[Webhook INBOUND] Recebido:', { event, webhookUrl });

    // Busca todos os webhooks INBOUND ativos que escutam este evento
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        direction: 'INBOUND',
        events: {
          has: event,
        },
      },
    });

    if (webhooks.length === 0) {
      console.log('[Webhook INBOUND] Nenhum webhook configurado para o evento:', event);
      return NextResponse.json({
        success: true,
        message: 'Webhook recebido, mas nenhum handler configurado'
      });
    }

    // Processa cada webhook configurado
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
        let errorMessage: string | null = null;

        try {
          // Valida assinatura se o webhook tiver secret configurado
          if (webhook.secret && signature) {
            const expectedSignature = crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(body))
              .digest('hex');

            if (signature !== expectedSignature) {
              throw new Error('Assinatura inválida');
            }
          }

          // Aqui você pode processar o webhook e executar ações específicas
          // Por exemplo: criar pedido, atualizar status, etc.
          console.log(`[Webhook INBOUND] Processando webhook "${webhook.name}":`, body);

          // Processar evento baseado no tipo
          switch (event) {
            case 'order.created':
              console.log('[Webhook INBOUND] 📦 Pedido criado externamente:', body.data?.orderNumber || body.data?.id);
              // Aqui você pode criar um pedido no sistema se vier de uma plataforma externa
              // Exemplo: iFood, Rappi, etc.
              if (body.data) {
                // Validar dados necessários
                if (!body.data.orderNumber || !body.data.items) {
                  throw new Error('Dados incompletos para criar pedido');
                }
                // Lógica de criação seria implementada aqui
                console.log('[Webhook INBOUND] ✅ Pedido validado e pronto para criação');
              }
              break;

            case 'order.confirmed':
              console.log('[Webhook INBOUND] ✅ Pedido confirmado externamente:', body.data?.orderNumber || body.data?.id);
              if (body.data?.orderId) {
                // Buscar pedido e atualizar status
                const order = await prisma.order.findFirst({
                  where: {
                    OR: [
                      { id: body.data.orderId },
                      { orderNumber: body.data.orderNumber },
                    ],
                  },
                });

                if (order) {
                  await prisma.order.update({
                    where: { id: order.id },
                    data: {
                      status: 'CONFIRMED',
                      acceptedAt: new Date(),
                    },
                  });
                  console.log('[Webhook INBOUND] ✅ Pedido confirmado:', order.orderNumber);
                }
              }
              break;

            case 'payment.confirmed':
              console.log('[Webhook INBOUND] 💰 Pagamento confirmado:', body.data?.paymentId || body.data?.orderId);
              if (body.data?.orderId) {
                // Buscar pedido e atualizar status de pagamento
                const order = await prisma.order.findFirst({
                  where: {
                    OR: [
                      { id: body.data.orderId },
                      { orderNumber: body.data.orderNumber },
                    ],
                  },
                });

                if (order) {
                  await prisma.order.update({
                    where: { id: order.id },
                    data: {
                      paymentStatus: 'PAID',
                      paidAt: new Date(),
                    },
                  });
                  console.log('[Webhook INBOUND] ✅ Pagamento confirmado para pedido:', order.orderNumber);
                }
              }
              break;

            case 'order.cancelled':
              console.log('[Webhook INBOUND] ❌ Pedido cancelado externamente:', body.data?.orderNumber || body.data?.id);
              if (body.data?.orderId) {
                // Buscar pedido e cancelar
                const order = await prisma.order.findFirst({
                  where: {
                    OR: [
                      { id: body.data.orderId },
                      { orderNumber: body.data.orderNumber },
                    ],
                  },
                });

                if (order && order.status !== 'DELIVERED') {
                  await prisma.order.update({
                    where: { id: order.id },
                    data: {
                      status: 'CANCELLED',
                      cancelledAt: new Date(),
                      cancelReason: body.data.reason || 'Cancelado externamente via webhook',
                    },
                  });
                  console.log('[Webhook INBOUND] ✅ Pedido cancelado:', order.orderNumber);
                }
              }
              break;

            case 'customer.created':
              console.log('[Webhook INBOUND] 👤 Cliente criado externamente:', body.data?.email || body.data?.id);
              // Aqui você pode sincronizar clientes de plataformas externas
              if (body.data?.email) {
                // Verificar se cliente já existe
                const existingUser = await prisma.user.findUnique({
                  where: { email: body.data.email },
                });

                if (!existingUser) {
                  console.log('[Webhook INBOUND] ✅ Cliente novo, pronto para criar');
                  // Lógica de criação seria implementada aqui
                } else {
                  console.log('[Webhook INBOUND] ℹ️ Cliente já existe:', body.data.email);
                }
              }
              break;

            default:
              console.log('[Webhook INBOUND] ⚠️ Evento não reconhecido:', event);
              console.log('[Webhook INBOUND] Dados recebidos:', body);
          }

        } catch (error) {
          status = 'FAILED';
          errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error(`[Webhook INBOUND] Erro ao processar webhook "${webhook.name}":`, error);
        }

        const duration = Date.now() - startTime;

        // Registra o log
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            status,
            statusCode: 200,
            errorMessage,
            duration,
            requestBody: body,
          },
        });

        // Atualiza estatísticas
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            ...(status === 'SUCCESS'
              ? { successCount: { increment: 1 } }
              : { failureCount: { increment: 1 } }),
          },
        });

        return { webhookId: webhook.id, status };
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: 'Webhook processado',
      webhooksProcessed: webhooks.length,
      successCount,
      failureCount,
      duration: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[Webhook INBOUND] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar webhook'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para verificar se o serviço de webhooks está ativo
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Serviço de webhooks ativo',
    endpoint: '/api/webhooks',
    methods: ['POST'],
    info: {
      description: 'Endpoint para receber webhooks de plataformas externas',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'HMAC SHA256 signature (opcional, se configurado secret)',
      },
      bodyFormat: {
        event: 'Nome do evento (ex: order.created, payment.confirmed)',
        data: 'Dados do evento',
        timestamp: 'ISO 8601 timestamp (opcional)',
      },
    },
  });
}

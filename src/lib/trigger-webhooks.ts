import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Função utilitária para disparar webhooks (a ser chamada de outros lugares do sistema)
export async function triggerWebhooks(
  event: string,
  payload: Record<string, unknown>
) {
  try {
    // Busca todos os webhooks ativos que escutam este evento
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        direction: 'OUTBOUND',
        events: {
          has: event,
        },
      },
    });

    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const startTime = Date.now();
        let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
        let statusCode: number | null = null;
        let errorMessage: string | null = null;

        try {
          const fullPayload = {
            event,
            timestamp: new Date().toISOString(),
            data: payload,
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'SushiWorld-Webhook/1.0',
          };

          if (webhook.headers && typeof webhook.headers === 'object') {
            Object.assign(headers, webhook.headers);
          }

          if (webhook.secret) {
            const crypto = await import('crypto');
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(fullPayload))
              .digest('hex');
            headers['X-Webhook-Signature'] = signature;
          }

          const response = await fetch(webhook.url, {
            method: webhook.method,
            headers,
            body: webhook.method !== 'GET' ? JSON.stringify(fullPayload) : undefined,
          });

          statusCode = response.status;

          if (!response.ok) {
            status = 'FAILED';
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (error) {
          status = 'FAILED';
          errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        }

        const duration = Date.now() - startTime;

        // Registra o log
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event,
            status,
            statusCode,
            errorMessage,
            duration,
            requestBody: payload as Prisma.InputJsonValue,
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

        return { webhookId: webhook.id, status, statusCode, duration };
      })
    );

    return results;
  } catch (error) {
    console.error('[Webhooks] Erro ao disparar webhooks:', error);
    return [];
  }
}

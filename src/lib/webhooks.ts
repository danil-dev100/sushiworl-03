import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * Tipos de eventos disponíveis no sistema
 */
export type WebhookEvent =
  | 'order.created'
  | 'order.confirmed'
  | 'order.cancelled'
  | 'order.preparing'
  | 'order.delivering'
  | 'order.delivered'
  | 'payment.confirmed'
  | 'customer.created';

/**
 * Payload genérico para webhooks
 */
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Dispara webhooks para um evento específico
 * @param event - Tipo do evento
 * @param data - Dados do evento
 */
export async function triggerWebhooks(
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  try {
    // Buscar todos os webhooks ativos que escutam este evento
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        direction: 'OUTBOUND',
        events: {
          has: event,
        },
      },
    });

    console.log(`[Webhooks] Disparando ${webhooks.length} webhooks para evento: ${event}`);

    // Disparar todos os webhooks em paralelo
    const promises = webhooks.map((webhook) =>
      sendWebhook(webhook, event, data)
    );

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('[Webhooks] Erro ao disparar webhooks:', error);
  }
}

/**
 * Envia uma requisição HTTP para um webhook
 * @param webhook - Dados do webhook
 * @param event - Tipo do evento
 * @param data - Dados do evento
 */
async function sendWebhook(
  webhook: {
    id: string;
    url: string;
    method: string;
    secret: string | null;
    headers: any;
  },
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  const startTime = Date.now();
  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let statusCode: number | null = null;
  let errorMessage: string | null = null;
  let responseBody: any = null;

  try {
    // Montar payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Montar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SushiWorld-Webhook/1.0',
      'X-Webhook-Event': event,
      'X-Webhook-ID': webhook.id,
    };

    // Adicionar headers customizados
    if (webhook.headers && typeof webhook.headers === 'object') {
      Object.assign(headers, webhook.headers);
    }

    // Adicionar assinatura HMAC se houver secret
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
      headers['X-Webhook-Signature-Algorithm'] = 'sha256';
    }

    console.log(`[Webhooks] Enviando para: ${webhook.url}`);

    // Enviar requisição
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: webhook.method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
    });

    statusCode = response.status;

    // Tentar ler o corpo da resposta
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch {
      // Ignorar erro ao ler corpo da resposta
    }

    if (!response.ok) {
      status = 'FAILED';
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    console.log(`[Webhooks] Resposta: ${statusCode} em ${Date.now() - startTime}ms`);
  } catch (error) {
    status = 'FAILED';
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout de 10 segundos excedido';
      }
    } else {
      errorMessage = 'Erro desconhecido';
    }
    console.error(`[Webhooks] Erro ao enviar: ${errorMessage}`);
  }

  const duration = Date.now() - startTime;

  // Registrar log no banco de dados
  try {
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event,
        status,
        statusCode,
        errorMessage,
        duration,
        requestBody: {
          event,
          timestamp: new Date().toISOString(),
          data,
        },
        responseBody,
      },
    });

    // Atualizar estatísticas do webhook
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        ...(status === 'SUCCESS'
          ? { successCount: { increment: 1 } }
          : { failureCount: { increment: 1 } }),
      },
    });
  } catch (dbError) {
    console.error('[Webhooks] Erro ao registrar log:', dbError);
  }
}

/**
 * Valida assinatura HMAC de um webhook recebido
 * @param payload - Corpo da requisição
 * @param signature - Assinatura recebida no header
 * @param secret - Secret configurado
 * @returns true se a assinatura for válida
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Formata payload de pedido para webhook
 * @param order - Dados do pedido
 * @returns Payload formatado
 */
export function formatOrderPayload(order: any): Record<string, any> {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    items: order.items?.map((item: any) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
    })) || [],
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
    delivery: order.deliveryOption === 'DELIVERY' ? {
      address: order.deliveryAddress,
      city: order.deliveryCity,
      postalCode: order.deliveryPostalCode,
    } : null,
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

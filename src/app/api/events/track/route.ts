import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * POST /api/events/track
 * Recebe eventos do frontend e processa server-side
 * - Registra logs
 * - Envia para CAPI (Meta Conversions API)
 * - Envia para Google Ads API
 * - etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, eventId, payload, integrations, utm } = body;

    if (!event || !eventId) {
      return NextResponse.json(
        { error: 'Evento ou eventId ausente' },
        { status: 400 }
      );
    }

    console.log(`[Events Track API] Recebido: ${event}`, {
      eventId,
      integrations: integrations?.length || 0,
    });

    // Processar cada integração
    const results = await Promise.allSettled(
      (integrations || []).map(async (integration: any) => {
        try {
          // Buscar credenciais completas do banco
          const integrationData = await prisma.integration.findUnique({
            where: { id: integration.id },
            select: {
              id: true,
              platform: true,
              type: true,
              pixelId: true,
              accessToken: true,
              measurementId: true,
              apiKey: true,
            },
          });

          if (!integrationData) {
            throw new Error('Integração não encontrada');
          }

          let status: 'sent' | 'failed' | 'pending' = 'sent';
          let statusCode: number | null = null;
          let errorMessage: string | null = null;

          // Enviar para Meta Conversions API se for Facebook e tiver accessToken
          if (
            integrationData.platform === 'FACEBOOK' &&
            integrationData.accessToken &&
            integrationData.pixelId
          ) {
            try {
              const capiResult = await sendToMetaCAPI(
                integrationData.pixelId,
                integrationData.accessToken,
                event,
                eventId,
                payload,
                request
              );
              statusCode = capiResult.statusCode;
              if (!capiResult.success) {
                status = 'failed';
                errorMessage = capiResult.error || 'Erro desconhecido';
              }
            } catch (error) {
              status = 'failed';
              errorMessage = error instanceof Error ? error.message : 'Erro ao enviar CAPI';
              console.error('[CAPI] Erro:', error);
            }
          }

          // Registrar log no banco
          await prisma.trackingEvent.create({
            data: {
              integrationId: integrationData.id,
              eventType: event,
              eventData: payload,
              pageUrl: payload.pageUrl || null,
              referrer: payload.referrer || null,
              gclid: utm?.gclid || null,
              fbclid: utm?.fbclid || null,
              ttclid: utm?.ttclid || null,
              utmSource: utm?.utmSource || null,
              utmMedium: utm?.utmMedium || null,
              utmCampaign: utm?.utmCampaign || null,
              utmTerm: utm?.utmTerm || null,
              utmContent: utm?.utmContent || null,
              platform: integrationData.platform,
              status,
              statusCode,
              errorMessage,
            },
          });

          return { success: status === 'sent', platform: integrationData.platform };
        } catch (error) {
          console.error(`[Events Track] Erro ao processar integração:`, error);
          return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
        }
      })
    );

    const successCount = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
    });
  } catch (error) {
    console.error('[Events Track API] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao processar evento' },
      { status: 500 }
    );
  }
}

/**
 * Envia evento para Meta Conversions API (CAPI)
 * Documentação: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
async function sendToMetaCAPI(
  pixelId: string,
  accessToken: string,
  eventName: string,
  eventId: string,
  payload: any,
  request: NextRequest
): Promise<{ success: boolean; statusCode: number; error?: string }> {
  try {
    // Mapear nome do evento para formato do Facebook
    const fbEventMap: Record<string, string> = {
      page_view: 'PageView',
      sign_up: 'CompleteRegistration',
      add_to_cart: 'AddToCart',
      view_cart: 'ViewContent',
      begin_checkout: 'InitiateCheckout',
      purchase: 'Purchase',
      cart_abandonment: 'AddToCart',
    };

    const fbEventName = fbEventMap[eventName] || 'CustomEvent';

    // Capturar IP e User-Agent
    const clientIpAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    const clientUserAgent = request.headers.get('user-agent') || '';

    // Montar user_data (dados do usuário hasheados)
    const userData: any = {
      client_ip_address: clientIpAddress,
      client_user_agent: clientUserAgent,
    };

    // Hash de email/telefone se disponível (SHA-256)
    if (payload.customer?.email) {
      userData.em = hashSHA256(payload.customer.email.toLowerCase().trim());
    }
    if (payload.customer?.phone) {
      // Remover caracteres não numéricos
      const phone = payload.customer.phone.replace(/\D/g, '');
      userData.ph = hashSHA256(phone);
    }

    // Montar custom_data
    const customData: any = {
      content_type: 'product',
    };

    if (payload.value) customData.value = payload.value;
    if (payload.currency) customData.currency = payload.currency;
    if (payload.orderId) customData.order_id = payload.orderId;
    if (payload.items) {
      customData.content_ids = payload.items.map((item: any) => item.id || item.name);
      customData.contents = payload.items.map((item: any) => ({
        id: item.id || item.name,
        quantity: item.quantity || 1,
        item_price: item.price || 0,
      }));
    }

    // Montar payload da API
    const capiPayload = {
      data: [
        {
          event_name: fbEventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId, // IMPORTANTE: mesmo ID do pixel para deduplicação
          event_source_url: payload.pageUrl || 'https://sushiworld.pt',
          action_source: 'website',
          user_data: userData,
          custom_data: customData,
        },
      ],
    };

    console.log(`[CAPI] Enviando ${fbEventName} para Pixel ${pixelId}`);

    // Enviar para Facebook
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...capiPayload,
          access_token: accessToken,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[CAPI] Erro na resposta:', result);
      return {
        success: false,
        statusCode: response.status,
        error: result.error?.message || 'Erro desconhecido',
      };
    }

    console.log('[CAPI] Sucesso:', result);

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('[CAPI] Exceção:', error);
    return {
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Hash SHA-256 para CAPI (requerido pela LGPD/GDPR)
 */
function hashSHA256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

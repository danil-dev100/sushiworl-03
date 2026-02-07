import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Função para enviar evento para Facebook CAPI
async function sendToFacebookCAPI(
  pixelId: string,
  accessToken: string,
  eventName: string,
  eventData: Record<string, unknown>
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: eventData.pageUrl || 'https://sushiworld.com',
            user_data: {
              client_ip_address: '0.0.0.0',
              client_user_agent: 'test-event',
            },
            custom_data: {
              value: eventData.value || 0,
              currency: eventData.currency || 'EUR',
            },
          }],
          access_token: accessToken,
          test_event_code: 'TEST_EVENT', // Remove in production
        }),
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar para Facebook CAPI:', error);
    return false;
  }
}

// Mapear eventos para nomes do Facebook
const FB_EVENT_MAP: Record<string, string> = {
  page_view: 'PageView',
  sign_up: 'CompleteRegistration',
  add_to_cart: 'AddToCart',
  view_cart: 'ViewContent',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  cart_abandonment: 'CustomEvent',
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventType, testData } = body;

    // Buscar integrações ativas
    const integrations = await prisma.integration.findMany({
      where: { isActive: true },
    });

    let platformsSent = 0;
    const results: Array<{ platform: string; success: boolean; error?: string }> = [];

    for (const integration of integrations) {
      let success = false;
      let errorMessage = '';

      try {
        // Facebook CAPI
        if (integration.platform === 'FACEBOOK' && integration.pixelId && integration.accessToken) {
          const fbEventName = FB_EVENT_MAP[eventType] || eventType;
          success = await sendToFacebookCAPI(
            integration.pixelId,
            integration.accessToken,
            fbEventName,
            testData
          );
        }
        // Google Analytics (apenas log, envio real via gtag no client)
        else if (integration.platform === 'GOOGLE_ANALYTICS') {
          // GA4 é enviado pelo cliente via gtag
          success = true;
        }
        // Outras plataformas
        else {
          success = true; // Simular sucesso para teste
        }

        if (success) platformsSent++;
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      }

      results.push({
        platform: integration.platform,
        success,
        error: errorMessage || undefined,
      });

      // Salvar log do evento
      await prisma.trackingEvent.create({
        data: {
          integrationId: integration.id,
          eventType,
          eventData: testData,
          pageUrl: testData.pageUrl || null,
          platform: integration.platform,
          status: success ? 'sent' : 'failed',
          statusCode: success ? 200 : 500,
          errorMessage: errorMessage || null,
          gclid: testData.gclid || null,
          fbclid: testData.fbclid || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      platformsSent,
      results,
    });
  } catch (error) {
    console.error('[Test Event API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar evento de teste' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/events/config
 * Retorna configuração de pixels ativos para o frontend
 * (Sem autenticação - dados públicos necessários para tracking)
 */
export async function GET() {
  try {
    // Buscar apenas integrações ativas
    const integrations = await prisma.integration.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        platform: true,
        type: true,
        pixelId: true,
        measurementId: true,
        isActive: true,
        config: true,
      },
    });

    // Formatar integrações com eventos
    const formattedIntegrations = integrations.map(integration => ({
      id: integration.id,
      platform: integration.platform,
      type: integration.type,
      pixelId: integration.pixelId,
      measurementId: integration.measurementId,
      isActive: integration.isActive,
      events:
        // Pegar do config.events ou usar fallback padrão
        Array.isArray((integration.config as any)?.events) && (integration.config as any).events.length > 0
          ? (integration.config as any).events
          : [
              'page_view',
              'sign_up',
              'add_to_cart',
              'view_cart',
              'begin_checkout',
              'purchase',
              'cart_abandonment',
            ],
    }));

    return NextResponse.json({
      integrations: formattedIntegrations,
    });
  } catch (error) {
    console.error('[Events Config API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração', integrations: [] },
      { status: 500 }
    );
  }
}

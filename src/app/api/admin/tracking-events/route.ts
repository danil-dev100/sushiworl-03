import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/tracking-events
 * Retorna eventos de tracking com UTM parameters agrupados
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Buscar eventos recentes
    const events = await prisma.trackingEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        pageUrl: true,
        referrer: true,
        gclid: true,
        fbclid: true,
        ttclid: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmTerm: true,
        utmContent: true,
        platform: true,
        status: true,
      },
    });

    // Estatísticas agrupadas por campanha
    const campaignStats = await prisma.trackingEvent.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: {
        utmCampaign: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 20,
    });

    // Estatísticas por tipo de evento
    const eventTypeStats = await prisma.trackingEvent.groupBy({
      by: ['eventType'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Total de eventos
    const totalEvents = await prisma.trackingEvent.count();

    return NextResponse.json({
      events,
      campaignStats: campaignStats.map(stat => ({
        source: stat.utmSource,
        medium: stat.utmMedium,
        campaign: stat.utmCampaign,
        count: stat._count.id,
      })),
      eventTypeStats: eventTypeStats.map(stat => ({
        type: stat.eventType,
        count: stat._count.id,
      })),
      totalEvents,
    });
  } catch (error) {
    console.error('[Tracking Events API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Listar links UTM gerados com estatísticas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar eventos de cliques em links UTM
    const utmClicks = await prisma.analyticsEvent.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: {
        utmSource: {
          not: null,
        },
        eventName: 'page_view', // Considera page_view como clique
      },
      _count: {
        id: true,
      },
    });

    // Buscar pedidos por UTM para calcular conversões
    const utmOrders = await prisma.order.groupBy({
      by: ['utmSource'],
      where: {
        utmSource: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Criar mapa de conversões por source
    const conversionsMap = new Map(
      utmOrders.map((order) => [
        order.utmSource!,
        {
          conversions: order._count.id,
          revenue: order._sum.total || 0,
        },
      ])
    );

    // Combinar dados de cliques e conversões
    const utmLinks = utmClicks
      .filter((click) => click.utmSource && click.utmMedium && click.utmCampaign)
      .map((click) => {
        const source = click.utmSource!;
        const conversionData = conversionsMap.get(source) || {
          conversions: 0,
          revenue: 0,
        };

        const clicks = click._count.id;
        const conversions = conversionData.conversions;
        const revenue = conversionData.revenue;
        const avgOrderValue = conversions > 0 ? revenue / conversions : 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

        return {
          id: `${source}-${click.utmMedium}-${click.utmCampaign}`,
          url: `?utm_source=${source}&utm_medium=${click.utmMedium}&utm_campaign=${click.utmCampaign}`,
          utmSource: source,
          utmMedium: click.utmMedium!,
          utmCampaign: click.utmCampaign!,
          clicks,
          conversions,
          revenue,
          avgOrderValue,
          conversionRate,
        };
      })
      .sort((a, b) => b.clicks - a.clicks); // Ordenar por mais cliques

    return NextResponse.json({
      utmLinks,
      summary: {
        totalLinks: utmLinks.length,
        totalClicks: utmLinks.reduce((sum, link) => sum + link.clicks, 0),
        totalConversions: utmLinks.reduce((sum, link) => sum + link.conversions, 0),
        totalRevenue: utmLinks.reduce((sum, link) => sum + link.revenue, 0),
      },
    });
  } catch (error) {
    console.error('[UTM Links API][GET] Erro:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro ao buscar links UTM',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POST - Salvar novo link UTM gerado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { url, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = body;

    if (!url || !utmSource || !utmMedium || !utmCampaign) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: url, utmSource, utmMedium, utmCampaign' },
        { status: 400 }
      );
    }

    // Criar evento de analytics para registrar a criação do link
    await prisma.analyticsEvent.create({
      data: {
        eventName: 'utm_link_created',
        eventData: {
          url,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          createdBy: session.user.id,
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Link UTM registrado com sucesso',
    });
  } catch (error) {
    console.error('[UTM Links API][POST] Erro:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro ao salvar link UTM',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}


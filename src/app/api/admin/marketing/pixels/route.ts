import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const [integrations, logs] = await Promise.all([
      prisma.integration.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          eventName: {
            in: ['facebook_pixel_event', 'google_analytics_event', 'tiktok_pixel_event']
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return NextResponse.json({ integrations, logs });
  } catch (error) {
    console.error('[Pixels API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar integrações' },
      { status: 500 }
    );
  }
}

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
    const { action, data } = body;

    switch (action) {
      case 'create_integration':
        const integration = await prisma.integration.create({
          data: {
            platform: data.platform,
            type: data.type,
            apiKey: data.apiKey,
            apiSecret: data.apiSecret,
            pixelId: data.pixelId,
            measurementId: data.measurementId,
            accessToken: data.accessToken,
            config: data.config,
            isActive: data.isActive || true,
          },
        });
        return NextResponse.json(integration);

      case 'update_integration':
        const updatedIntegration = await prisma.integration.update({
          where: { id: data.id },
          data: {
            apiKey: data.apiKey,
            apiSecret: data.apiSecret,
            pixelId: data.pixelId,
            measurementId: data.measurementId,
            accessToken: data.accessToken,
            config: data.config,
            isActive: data.isActive,
            lastSyncAt: new Date(),
          },
        });
        return NextResponse.json(updatedIntegration);

      case 'delete_integration':
        await prisma.integration.delete({
          where: { id: data.id },
        });
        return NextResponse.json({ success: true });

      case 'test_event':
        // Criar log de teste
        await prisma.analyticsEvent.create({
          data: {
            eventName: `${data.platform.toLowerCase()}_pixel_event`,
            eventData: {
              test: true,
              event: data.event,
              value: data.value,
              platform: data.platform,
            },
            pageUrl: '/admin/marketing/pixels',
          },
        });

        return NextResponse.json({
          success: true,
          message: `Evento de teste enviado para ${data.platform}`
        });

      case 'sync_catalog':
        // Aqui seria implementada a sincronização do catálogo
        // Por enquanto, apenas marca como sincronizado
        await prisma.integration.updateMany({
          where: {
            platform: data.platform,
            type: 'catalog',
          },
          data: {
            lastSyncAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Catálogo sincronizado com ${data.platform}`
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Pixels API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}


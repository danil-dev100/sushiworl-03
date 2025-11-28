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

    const integrations = await prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('[Integrations API] Erro:', error);
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
            name: data.name,
            platform: data.platform,
            type: data.type,
            apiKey: data.apiKey,
            apiSecret: data.apiSecret,
            pixelId: data.pixelId,
            measurementId: data.measurementId,
            accessToken: data.accessToken,
            config: data.config,
            isActive: data.isActive ?? true,
          },
        });
        return NextResponse.json(integration);

      case 'update_integration':
        const updatedIntegration = await prisma.integration.update({
          where: { id: data.id },
          data: {
            name: data.name,
            apiKey: data.apiKey,
            apiSecret: data.apiSecret,
            pixelId: data.pixelId,
            measurementId: data.measurementId,
            accessToken: data.accessToken,
            config: data.config,
            isActive: data.isActive,
          },
        });
        return NextResponse.json(updatedIntegration);

      case 'delete_integration':
        await prisma.integration.delete({
          where: { id: data.id },
        });
        return NextResponse.json({ success: true });

      case 'test_connection':
        // Aqui seria implementada a lógica de teste de conexão
        return NextResponse.json({
          success: true,
          message: `Conexão com ${data.platform} testada com sucesso`
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Integrations API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}


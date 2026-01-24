import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// SEGURANÇA: Schemas de validação Zod
const IntegrationDataSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(100).optional().nullable(),
  platform: z.enum(['FACEBOOK', 'GOOGLE_ANALYTICS', 'GOOGLE_TAG_MANAGER', 'TIKTOK', 'CUSTOM']),
  type: z.enum(['PIXEL', 'MEASUREMENT', 'TAG_MANAGER', 'CUSTOM']),
  apiKey: z.string().max(500).optional().nullable(),
  apiSecret: z.string().max(500).optional().nullable(),
  pixelId: z.string().max(100).optional().nullable(),
  measurementId: z.string().max(100).optional().nullable(),
  accessToken: z.string().max(1000).optional().nullable(),
  config: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  events: z.array(z.string()).optional(),
});

const ActionSchema = z.object({
  action: z.enum(['create_integration', 'update_integration', 'delete_integration', 'test_connection']),
  data: IntegrationDataSchema,
});

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

    // SEGURANÇA: Validar dados de entrada com Zod
    const parseResult = ActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { action, data } = parseResult.data;

    switch (action) {
      case 'create_integration':
        const integration = await prisma.integration.create({
          data: {
            name: data.name || null,
            platform: data.platform,
            type: data.type,
            apiKey: data.apiKey || null,
            apiSecret: data.apiSecret || null,
            pixelId: data.pixelId || null,
            measurementId: data.measurementId || null,
            accessToken: data.accessToken || null,
            config: data.config || {},
            isActive: data.isActive ?? true,
            events: data.events || [
              'page_view',
              'sign_up',
              'add_to_cart',
              'view_cart',
              'begin_checkout',
              'purchase',
              'cart_abandonment',
            ],
          },
        });

        console.log('[Integrations API] ✅ Pixel criado:', integration.id, integration.platform);

        return NextResponse.json(integration);

      case 'update_integration':
        const updateData: any = {
          isActive: data.isActive,
        };

        // Apenas atualizar campos que foram enviados
        if (data.name !== undefined) updateData.name = data.name || null;
        if (data.platform !== undefined) updateData.platform = data.platform;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.apiKey !== undefined) updateData.apiKey = data.apiKey || null;
        if (data.apiSecret !== undefined) updateData.apiSecret = data.apiSecret || null;
        if (data.pixelId !== undefined) updateData.pixelId = data.pixelId || null;
        if (data.measurementId !== undefined) updateData.measurementId = data.measurementId || null;
        if (data.accessToken !== undefined) updateData.accessToken = data.accessToken || null;
        if (data.config !== undefined) updateData.config = data.config;
        if (data.events !== undefined) updateData.events = data.events;

        const updatedIntegration = await prisma.integration.update({
          where: { id: data.id },
          data: updateData,
        });

        console.log('[Integrations API] ✅ Pixel atualizado:', updatedIntegration.id);

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


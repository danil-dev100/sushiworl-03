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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'inbound' ou 'outbound'

    const where: Record<string, unknown> = {};
    if (type === 'inbound') {
      where.direction = 'INBOUND';
    } else if (type === 'outbound') {
      where.direction = 'OUTBOUND';
    }

    const [webhooks, logs] = await Promise.all([
      prisma.webhook.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      // @ts-expect-error - WebhookLog model will be available after prisma generate
      prisma.webhookLog.findMany({
        orderBy: { triggeredAt: 'desc' },
        take: 50,
        include: {
          webhook: {
            select: { name: true, url: true },
          },
        },
      }),
    ]);

    return NextResponse.json({ webhooks, logs });
  } catch (error) {
    console.error('[Webhooks API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar webhooks' },
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
      case 'create_webhook': {
        const webhook = await prisma.webhook.create({
          data: {
            name: data.name,
            url: data.url,
            method: data.method || 'POST',
            events: data.events || [],
            headers: data.headers || null,
            secret: data.secret || null,
            isActive: data.isActive ?? true,
            direction: data.direction || 'OUTBOUND',
          } as Record<string, unknown>,
        });
        return NextResponse.json(webhook);
      }

      case 'update_webhook': {
        const updatedWebhook = await prisma.webhook.update({
          where: { id: data.id },
          data: {
            name: data.name,
            url: data.url,
            method: data.method,
            events: data.events,
            headers: data.headers,
            secret: data.secret,
            isActive: data.isActive,
          } as Record<string, unknown>,
        });
        return NextResponse.json(updatedWebhook);
      }

      case 'delete_webhook': {
        await prisma.webhook.delete({
          where: { id: data.id },
        });
        return NextResponse.json({ success: true });
      }

      case 'test_webhook': {
        const webhook = await prisma.webhook.findUnique({
          where: { id: data.id },
        });

        if (!webhook) {
          return NextResponse.json(
            { error: 'Webhook não encontrado' },
            { status: 404 }
          );
        }

        const startTime = Date.now();
        let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
        let statusCode: number | null = null;
        let errorMessage: string | null = null;

        try {
          // Envia requisição de teste
          const testPayload = {
            event: 'test',
            timestamp: new Date().toISOString(),
            data: {
              message: 'Teste de webhook do SushiWorld',
              webhookId: webhook.id,
              webhookName: webhook.name,
            },
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'SushiWorld-Webhook/1.0',
          };

          // Adiciona headers customizados
          if (webhook.headers && typeof webhook.headers === 'object') {
            Object.assign(headers, webhook.headers);
          }

          // Adiciona assinatura se houver secret
          if (webhook.secret) {
            const crypto = await import('crypto');
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(testPayload))
              .digest('hex');
            headers['X-Webhook-Signature'] = signature;
          }

          const response = await fetch(webhook.url, {
            method: webhook.method,
            headers,
            body: webhook.method !== 'GET' ? JSON.stringify(testPayload) : undefined,
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
            event: 'test',
            status,
            statusCode,
            errorMessage,
            duration,
            requestBody: {
              event: 'test',
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Atualiza estatísticas do webhook
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            ...(status === 'SUCCESS'
              ? { successCount: { increment: 1 } }
              : { failureCount: { increment: 1 } }),
          },
        });

        if (status === 'SUCCESS') {
          return NextResponse.json({
            success: true,
            message: `Teste enviado com sucesso (${statusCode}) em ${duration}ms`,
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `Teste falhou: ${errorMessage}`,
          });
        }
      }

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Webhooks API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

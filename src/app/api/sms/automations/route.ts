import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação
const createAutomationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  triggerType: z.string().optional(),
  triggerValue: z.any().optional(),
  nodes: z.any().optional(),
  edges: z.any().optional(),
  isActive: z.boolean().optional(),
});

// GET - Listar automações
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const automations = await prisma.smsAutomation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    // Formatar para o frontend
    const formattedAutomations = automations.map((automation) => {
      const nodes = automation.nodes as any[] || [];
      const edges = automation.edges as any[] || [];

      // Contar execuções baseado nos logs
      return {
        id: automation.id,
        name: automation.name,
        description: automation.description,
        isActive: automation.isActive,
        triggerType: automation.triggerType,
        triggerValue: automation.triggerValue,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        totalExecutions: automation._count.logs,
        successCount: 0, // Será calculado abaixo
        failureCount: 0, // Será calculado abaixo
        createdAt: automation.createdAt.toISOString(),
        updatedAt: automation.updatedAt.toISOString(),
      };
    });

    // Buscar contagens de sucesso/falha para cada automação
    for (const automation of formattedAutomations) {
      const [successCount, failureCount] = await Promise.all([
        prisma.smsAutomationLog.count({
          where: {
            automationId: automation.id,
            status: 'sent',
          },
        }),
        prisma.smsAutomationLog.count({
          where: {
            automationId: automation.id,
            status: 'failed',
          },
        }),
      ]);
      automation.successCount = successCount;
      automation.failureCount = failureCount;
    }

    return NextResponse.json({ automations: formattedAutomations });
  } catch (error) {
    console.error('[SMS Automations GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar automações' },
      { status: 500 }
    );
  }
}

// POST - Criar nova automação
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validar dados
    const validationResult = createAutomationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const automation = await prisma.smsAutomation.create({
      data: {
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType || null,
        triggerValue: data.triggerValue || null,
        nodes: data.nodes || [],
        edges: data.edges || [],
        isActive: data.isActive || false,
      },
    });

    console.log('[SMS Automations] Automação criada:', automation.id);

    return NextResponse.json({
      success: true,
      automation,
    });
  } catch (error) {
    console.error('[SMS Automations POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar automação' },
      { status: 500 }
    );
  }
}

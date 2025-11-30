import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email-marketing/flows - Lista todos os fluxos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const flows = await prisma.emailAutomation.findMany({
      where: {
        createdBy: session.user.id
      },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { logs: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular métricas
    const flowsWithMetrics = flows.map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      isActive: flow.isActive,
      isDraft: flow.isDraft,
      totalExecutions: flow._count.logs,
      successCount: flow.logs.filter(log => log.status === 'SUCCESS').length,
      failureCount: flow.logs.filter(log => log.status === 'FAILED').length,
      createdAt: flow.createdAt.toISOString(),
      updatedAt: flow.updatedAt.toISOString(),
      nodesCount: flow.flow ? (flow.flow as any).nodes?.length || 0 : 0,
      edgesCount: flow.flow ? (flow.flow as any).edges?.length || 0 : 0,
    }));

    return NextResponse.json({
      flows: flowsWithMetrics,
      total: flowsWithMetrics.length
    });

  } catch (error) {
    console.error('Erro ao buscar fluxos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/email-marketing/flows - Criar novo fluxo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, flow, isActive, isDraft } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome do fluxo é obrigatório' },
        { status: 400 }
      );
    }

    const newFlow = await prisma.emailAutomation.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        flow: flow || { nodes: [], edges: [] },
        isActive: isActive || false,
        isDraft: isDraft !== false, // Default to draft
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      flow: {
        id: newFlow.id,
        name: newFlow.name,
        description: newFlow.description,
        isActive: newFlow.isActive,
        isDraft: newFlow.isDraft,
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        createdAt: newFlow.createdAt.toISOString(),
        updatedAt: newFlow.updatedAt.toISOString(),
        nodesCount: flow?.nodes?.length || 0,
        edgesCount: flow?.edges?.length || 0,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


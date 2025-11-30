import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/email-marketing/flows/[id]/duplicate - Duplicar fluxo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Buscar o fluxo original
    const originalFlow = await prisma.emailAutomation.findUnique({
      where: { id: id },
    });

    if (!originalFlow) {
      return NextResponse.json({ error: 'Fluxo não encontrado' }, { status: 404 });
    }

    if (originalFlow.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Criar cópia do fluxo
    const duplicatedFlow = await prisma.emailAutomation.create({
      data: {
        name: `${originalFlow.name} (Cópia)`,
        description: originalFlow.description,
        flow: originalFlow.flow ?? {},
        isActive: false, // Sempre criar como inativo
        isDraft: true, // Sempre criar como rascunho
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      flow: {
        id: duplicatedFlow.id,
        name: duplicatedFlow.name,
        description: duplicatedFlow.description,
        isActive: duplicatedFlow.isActive,
        isDraft: duplicatedFlow.isDraft,
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        createdAt: duplicatedFlow.createdAt.toISOString(),
        updatedAt: duplicatedFlow.updatedAt.toISOString(),
        nodesCount: originalFlow.flow ? (originalFlow.flow as any).nodes?.length || 0 : 0,
        edgesCount: originalFlow.flow ? (originalFlow.flow as any).edges?.length || 0 : 0,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao duplicar fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


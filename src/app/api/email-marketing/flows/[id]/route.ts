import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email-marketing/flows/[id] - Buscar fluxo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const flow = await prisma.emailAutomation.findUnique({
      where: { id: id },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!flow) {
      return NextResponse.json({ error: 'Fluxo não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário tem permissão para ver este fluxo
    // Permite ver fluxos próprios OU fluxos públicos (não drafts) como templates
    const isOwner = flow.createdBy === session.user.id;
    const isPublicTemplate = !flow.isDraft;

    if (!isOwner && !isPublicTemplate) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({
      flow: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        flow: flow.flow,
        isActive: flow.isActive,
        isDraft: flow.isDraft,
        createdAt: flow.createdAt.toISOString(),
        updatedAt: flow.updatedAt.toISOString(),
        totalExecutions: flow.logs.length,
        successCount: flow.logs.filter(log => log.status === 'SUCCESS').length,
        failureCount: flow.logs.filter(log => log.status === 'FAILED').length,
        logs: flow.logs.map(log => ({
          id: log.id,
          status: log.status,
          executedAt: log.executedAt.toISOString(),
          errorMessage: log.errorMessage,
        })),
      }
    });

  } catch (error) {
    console.error('Erro ao buscar fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/email-marketing/flows/[id] - Atualizar fluxo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { name, description, flow, isActive, isDraft } = body;

    // Verificar se o fluxo existe e pertence ao usuário
    const existingFlow = await prisma.emailAutomation.findUnique({
      where: { id: id },
    });

    if (!existingFlow) {
      return NextResponse.json({ error: 'Fluxo não encontrado' }, { status: 404 });
    }

    if (existingFlow.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { error: 'Nome do fluxo é obrigatório' },
        { status: 400 }
      );
    }

    const updatedFlow = await prisma.emailAutomation.update({
      where: { id: id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(flow !== undefined && { flow }),
        ...(isActive !== undefined && { isActive }),
        ...(isDraft !== undefined && { isDraft }),
      },
    });

    return NextResponse.json({
      flow: {
        id: updatedFlow.id,
        name: updatedFlow.name,
        description: updatedFlow.description,
        flow: updatedFlow.flow,
        isActive: updatedFlow.isActive,
        isDraft: updatedFlow.isDraft,
        updatedAt: updatedFlow.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/email-marketing/flows/[id] - Atualização parcial (ex: alternar status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();

    // Verificar se o fluxo existe e pertence ao usuário
    const existingFlow = await prisma.emailAutomation.findUnique({
      where: { id: id },
    });

    if (!existingFlow) {
      return NextResponse.json({ error: 'Fluxo não encontrado' }, { status: 404 });
    }

    if (existingFlow.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const updatedFlow = await prisma.emailAutomation.update({
      where: { id: id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      flow: {
        id: updatedFlow.id,
        isActive: updatedFlow.isActive,
        isDraft: updatedFlow.isDraft,
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/email-marketing/flows/[id] - Excluir fluxo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se o fluxo existe e pertence ao usuário
    const existingFlow = await prisma.emailAutomation.findUnique({
      where: { id: id },
    });

    if (!existingFlow) {
      return NextResponse.json({ error: 'Fluxo não encontrado' }, { status: 404 });
    }

    if (existingFlow.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Excluir o fluxo (os logs serão excluídos automaticamente devido ao cascade)
    await prisma.emailAutomation.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao excluir fluxo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


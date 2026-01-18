import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação para atualização
const updateAutomationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  triggerType: z.string().optional().nullable(),
  triggerValue: z.any().optional(),
  nodes: z.any().optional(),
  edges: z.any().optional(),
  isActive: z.boolean().optional(),
});

// GET - Buscar automação específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const automation = await prisma.smsAutomation.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!automation) {
      return NextResponse.json(
        { error: 'Automação não encontrada' },
        { status: 404 }
      );
    }

    // Calcular métricas
    const successCount = automation.logs.filter((l) => l.status === 'sent').length;
    const failureCount = automation.logs.filter((l) => l.status === 'failed').length;

    return NextResponse.json({
      automation: {
        ...automation,
        totalExecutions: automation.logs.length,
        successCount,
        failureCount,
      },
    });
  } catch (error) {
    console.error('[SMS Automation GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar automação' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar automação
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validar dados
    const validationResult = updateAutomationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Verificar se existe
    const existing = await prisma.smsAutomation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Automação não encontrada' },
        { status: 404 }
      );
    }

    const data = validationResult.data;

    const automation = await prisma.smsAutomation.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.triggerType !== undefined && { triggerType: data.triggerType }),
        ...(data.triggerValue !== undefined && { triggerValue: data.triggerValue }),
        ...(data.nodes !== undefined && { nodes: data.nodes }),
        ...(data.edges !== undefined && { edges: data.edges }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    console.log('[SMS Automation] Automação atualizada:', id);

    return NextResponse.json({
      success: true,
      automation,
    });
  } catch (error) {
    console.error('[SMS Automation PATCH] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar automação' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir automação
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar se existe
    const existing = await prisma.smsAutomation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Automação não encontrada' },
        { status: 404 }
      );
    }

    // Excluir (logs serão excluídos em cascata)
    await prisma.smsAutomation.delete({
      where: { id },
    });

    console.log('[SMS Automation] Automação excluída:', id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[SMS Automation DELETE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir automação' },
      { status: 500 }
    );
  }
}

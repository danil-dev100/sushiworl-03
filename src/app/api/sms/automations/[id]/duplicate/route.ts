import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Duplicar automação
export async function POST(
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

    // Buscar automação original
    const original = await prisma.smsAutomation.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json(
        { error: 'Automação não encontrada' },
        { status: 404 }
      );
    }

    // Criar cópia
    const duplicate = await prisma.smsAutomation.create({
      data: {
        name: `${original.name} (Cópia)`,
        description: original.description,
        triggerType: original.triggerType,
        triggerValue: original.triggerValue ?? undefined,
        nodes: original.nodes || [],
        edges: original.edges || [],
        isActive: false, // Sempre começa desativada
      },
    });

    console.log('[SMS Automation] Automação duplicada:', id, '->', duplicate.id);

    return NextResponse.json({
      success: true,
      automation: duplicate,
    });
  } catch (error) {
    console.error('[SMS Automation Duplicate] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao duplicar automação' },
      { status: 500 }
    );
  }
}

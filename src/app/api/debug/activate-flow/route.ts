import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // ✅ SEGURANÇA: Verificar autenticação e permissões
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores podem ativar fluxos.' },
        { status: 401 }
      );
    }

    const { flowId } = await request.json();

    if (!flowId) {
      return NextResponse.json(
        { error: 'flowId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se fluxo existe antes de ativar
    const existingFlow = await prisma.emailAutomation.findUnique({
      where: { id: flowId },
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Fluxo não encontrado' },
        { status: 404 }
      );
    }

    // Ativar o fluxo
    const updated = await prisma.emailAutomation.update({
      where: { id: flowId },
      data: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: `Fluxo "${updated.name}" ativado com sucesso!`,
      flow: {
        id: updated.id,
        name: updated.name,
        isActive: updated.isActive,
        isDraft: updated.isDraft,
      }
    });

  } catch (error) {
    console.error('[Activate Flow] Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao ativar fluxo',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

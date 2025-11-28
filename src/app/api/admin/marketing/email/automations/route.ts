import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }

    const automations = await prisma.emailAutomation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error('Erro ao buscar automações:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, flow, isActive, isDraft } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Nome da automação é obrigatório' },
        { status: 400 }
      );
    }

    const automation = await prisma.emailAutomation.create({
      data: {
        name,
        description,
        flow,
        isActive: isActive || false,
        isDraft: isDraft || true,
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error('Erro ao criar automação:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}



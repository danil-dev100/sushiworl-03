import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      subject,
      htmlContent,
      buttonText,
      buttonUrl,
      buttonColor,
    } = body;

    if (!name || !subject || !htmlContent) {
      return NextResponse.json(
        { message: 'Nome, assunto e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        subject,
        htmlContent,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        buttonColor: buttonColor || '#FF6B00',
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.emailTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Template removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover template:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}



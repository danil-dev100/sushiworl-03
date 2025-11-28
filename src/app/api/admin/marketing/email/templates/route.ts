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

    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
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

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        htmlContent,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        buttonColor: buttonColor || '#FF6B00',
        fromName: 'SushiWorld',
        fromEmail: 'pedidosushiworld@gmail.com',
        isActive: true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}



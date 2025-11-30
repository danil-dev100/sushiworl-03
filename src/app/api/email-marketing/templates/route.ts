import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email-marketing/templates - Lista todos os templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        subject: true,
        fromName: true,
        fromEmail: true,
        buttonText: true,
        buttonUrl: true,
        buttonColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/email-marketing/templates - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      subject,
      htmlContent,
      buttonText,
      buttonUrl,
      buttonColor,
      fromName,
      fromEmail,
    } = body;

    // Validações
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome do template é obrigatório' },
        { status: 400 }
      );
    }

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: 'Assunto é obrigatório' },
        { status: 400 }
      );
    }

    if (!htmlContent?.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo HTML é obrigatório' },
        { status: 400 }
      );
    }

    const newTemplate = await prisma.emailTemplate.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        htmlContent: htmlContent.trim(),
        fromName: fromName?.trim() || 'SushiWorld',
        fromEmail: fromEmail?.trim() || 'pedidos@sushiworld.com',
        buttonText: buttonText?.trim() || null,
        buttonUrl: buttonUrl?.trim() || null,
        buttonColor: buttonColor?.trim() || '#FF6B00',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        subject: true,
        fromName: true,
        fromEmail: true,
        buttonText: true,
        buttonUrl: true,
        buttonColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      template: newTemplate
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

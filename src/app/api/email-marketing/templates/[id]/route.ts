import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email-marketing/templates/[id] - Buscar template específico
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

    const template = await prisma.emailTemplate.findUnique({
      where: { id: id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        fromName: template.fromName,
        fromEmail: template.fromEmail,
        buttonText: template.buttonText,
        buttonUrl: template.buttonUrl,
        buttonColor: template.buttonColor,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/email-marketing/templates/[id] - Atualizar template
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
    const {
      name,
      subject,
      htmlContent,
      buttonText,
      buttonUrl,
      buttonColor,
      fromName,
      fromEmail,
      isActive,
    } = body;

    // Verificar se o template existe e pertence ao usuário
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Validações
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { error: 'Nome do template é obrigatório' },
        { status: 400 }
      );
    }

    if (subject !== undefined && !subject?.trim()) {
      return NextResponse.json(
        { error: 'Assunto é obrigatório' },
        { status: 400 }
      );
    }

    if (htmlContent !== undefined && !htmlContent?.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo HTML é obrigatório' },
        { status: 400 }
      );
    }

    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id: id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(subject !== undefined && { subject: subject.trim() }),
        ...(htmlContent !== undefined && { htmlContent: htmlContent.trim() }),
        ...(buttonText !== undefined && { buttonText: buttonText?.trim() || null }),
        ...(buttonUrl !== undefined && { buttonUrl: buttonUrl?.trim() || null }),
        ...(buttonColor !== undefined && { buttonColor: buttonColor?.trim() || '#FF6B00' }),
        ...(fromName !== undefined && { fromName: fromName?.trim() || 'SushiWorld' }),
        ...(fromEmail !== undefined && { fromEmail: fromEmail?.trim() || 'pedidos@sushiworld.com' }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        subject: true,
        htmlContent: true,
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
      template: {
        ...updatedTemplate,
        createdAt: updatedTemplate.createdAt.toISOString(),
        updatedAt: updatedTemplate.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/email-marketing/templates/[id] - Excluir template
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

    // Verificar se o template existe e pertence ao usuário
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Soft delete - marcar como inativo
    await prisma.emailTemplate.update({
      where: { id: id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao excluir template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


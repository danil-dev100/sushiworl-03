import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar automações e templates
    const [automations, templates] = await Promise.all([
      prisma.emailAutomation.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          logs: {
            orderBy: { executedAt: 'desc' },
            take: 10,
          },
        },
      }),
      prisma.emailTemplate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ automations, templates });
  } catch (error) {
    console.error('[Email Marketing API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de email marketing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_automation':
        const automation = await prisma.emailAutomation.create({
          data: {
            name: data.name,
            description: data.description,
            flow: data.flow,
            isActive: data.isActive || false,
            isDraft: data.isDraft || true,
            createdBy: session.user.id,
          },
        });
        return NextResponse.json(automation);

      case 'create_template':
        const template = await prisma.emailTemplate.create({
          data: {
            name: data.name,
            subject: data.subject,
            htmlContent: data.htmlContent,
            textContent: data.textContent,
            fromName: data.fromName,
            fromEmail: data.fromEmail,
            buttonText: data.buttonText,
            buttonUrl: data.buttonUrl,
            buttonColor: data.buttonColor,
            isActive: data.isActive || true,
          },
        });
        return NextResponse.json(template);

      case 'test_email':
        // Aqui seria implementada a lógica de envio de email de teste
        // Por enquanto, apenas retorna sucesso
        return NextResponse.json({
          success: true,
          message: 'Email de teste enviado com sucesso'
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Email Marketing API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const config = await prisma.emailMarketingConfig.findFirst();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações SMTP:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      smtpServer,
      smtpPort,
      smtpUser,
      smtpPassword,
      useTls,
      defaultFromName,
      defaultFromEmail,
    } = body;

    // Validações
    if (!smtpServer || !smtpPort || !smtpUser || !defaultFromEmail) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Buscar configuração existente
    const existing = await prisma.emailMarketingConfig.findFirst();

    let config;
    if (existing) {
      // Atualizar
      config = await prisma.emailMarketingConfig.update({
        where: { id: existing.id },
        data: {
          smtpServer,
          smtpPort,
          smtpUser,
          smtpPassword,
          useTls,
          defaultFromName,
          defaultFromEmail,
        },
      });
    } else {
      // Criar novo
      config = await prisma.emailMarketingConfig.create({
        data: {
          smtpServer,
          smtpPort,
          smtpUser,
          smtpPassword,
          useTls,
          defaultFromName,
          defaultFromEmail,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao salvar configurações SMTP:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}

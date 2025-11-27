import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Verificar se a tabela existe tentando buscar
    // @ts-ignore - CompanySettings será criado após executar a migration
    const settings = await prisma.companySettings?.findFirst({
      select: {
        printerSettings: true,
      },
    }).catch(() => null);

    return NextResponse.json(settings?.printerSettings || null);
  } catch (error) {
    console.error('Erro ao buscar configurações de impressora:', error);
    // Retornar null se a tabela não existir ainda
    return NextResponse.json(null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // @ts-ignore - CompanySettings será criado após executar a migration
    if (!prisma.companySettings) {
      return NextResponse.json(
        { error: 'Execute a migration do Prisma primeiro: npx prisma migrate dev' },
        { status: 503 }
      );
    }

    // Buscar configurações existentes
    // @ts-ignore
    let settings = await prisma.companySettings.findFirst().catch(() => null);

    if (settings) {
      // Atualizar existente
      // @ts-ignore
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          printerSettings: config,
        },
      });
    } else {
      // Criar novo
      // @ts-ignore
      settings = await prisma.companySettings.create({
        data: {
          printerSettings: config,
        },
      });
    }

    return NextResponse.json({
      success: true,
      printerSettings: settings.printerSettings,
    });
  } catch (error) {
    console.error('Erro ao salvar configurações de impressora:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações. Verifique se a migration foi executada.' },
      { status: 500 }
    );
  }
}

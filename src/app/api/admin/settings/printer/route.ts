import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.companySettings.findFirst({
      select: {
        printerSettings: true,
      },
    });

    return NextResponse.json(settings?.printerSettings || null);
  } catch (error) {
    console.error('Erro ao buscar configurações de impressora:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // Buscar configurações existentes
    let settings = await prisma.companySettings.findFirst();

    if (settings) {
      // Atualizar existente
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          printerSettings: config,
        },
      });
    } else {
      // Criar novo
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
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}

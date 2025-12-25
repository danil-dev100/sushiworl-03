import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageSettings } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO DE SEGURANÇA: Validar autenticação antes de retornar dados sensíveis
    const session = await getServerSession(authOptions);

    if (!session || !canManageSettings(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado. Esta rota requer permissões de administrador.' },
        { status: 401 }
      );
    }

    const settings = await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: 'Configurações não encontradas' },
        { status: 404 }
      );
    }

    // ✅ Retornar TODOS os dados apenas para usuários autenticados
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageSettings(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Buscar configurações existentes
    const existingSettings = await prisma.settings.findFirst();

    let updatedSettings;

    if (existingSettings) {
      // Atualizar
      updatedSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          companyName: body.companyName,
          billingName: body.billingName,
          nif: body.nif,
          address: body.address,
          phone: body.phone,
          email: body.email,
          websiteUrl: body.websiteUrl,
          vatRate: body.vatRate,
          vatType: body.vatType,
          openingHours: body.openingHours,
          printerType: body.printerType,
          printerName: body.printerName,
          paperSize: body.paperSize,
          printSettings: body.printSettings,
          additionalItems: body.additionalItems,
          checkoutAdditionalItems: body.checkoutAdditionalItems,
        },
      });
    } else {
      // Criar
      updatedSettings = await prisma.settings.create({
        data: body,
      });
    }

    // Revalidar páginas que usam as configurações
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/carrinho');
    revalidatePath('/checkout');
    revalidatePath('/admin/configuracoes/empresa');

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}


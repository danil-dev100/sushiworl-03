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
    console.log('[Settings API] 📡 PUT request recebido');
    const session = await getServerSession(authOptions);

    if (!session || !canManageSettings(session.user.role)) {
      console.log('[Settings API] ❌ Não autorizado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[Settings API] 📦 Dados recebidos:', {
      companyName: body.companyName,
      openingHoursKeys: Object.keys(body.openingHours || {}),
      openingHours: body.openingHours
    });

    // Buscar configurações existentes
    const existingSettings = await prisma.settings.findFirst();
    console.log('[Settings API] 🔍 Settings existentes encontrados:', !!existingSettings);

    let updatedSettings;

    if (existingSettings) {
      console.log('[Settings API] ♻️ Atualizando settings existentes...');
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
      console.log('[Settings API] ✅ Settings atualizados com sucesso');
      console.log('[Settings API] 📝 openingHours salvo:', updatedSettings.openingHours);
    } else {
      console.log('[Settings API] ✨ Criando novo settings...');
      // Criar
      updatedSettings = await prisma.settings.create({
        data: body,
      });
      console.log('[Settings API] ✅ Settings criado com sucesso');
    }

    // Revalidar páginas que usam as configurações
    console.log('[Settings API] 🔄 Revalidando páginas...');
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/carrinho');
    revalidatePath('/checkout');
    revalidatePath('/admin/configuracoes/empresa');
    revalidatePath('/api/store/status'); // API de status do restaurante
    revalidatePath('/api/settings/restaurant-status'); // API de horários
    console.log('[Settings API] ✅ Páginas e APIs revalidadas');

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('[Settings API] ❌ Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}


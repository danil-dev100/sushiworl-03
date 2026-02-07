import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache de 5 minutos (itens adicionais mudam raramente)
export const revalidate = 300;

/**
 * GET /api/cart/additional-items
 * Retorna itens adicionais configurados para o carrinho (PÚBLICO - sem autenticação)
 */
export async function GET() {
  try {
    console.log('[Cart Additional Items API] 🔍 Buscando itens adicionais...');

    const settings = await prisma.settings.findFirst({
      select: {
        additionalItems: true
      }
    });

    console.log('[Cart Additional Items API] 📊 Settings encontrado:', !!settings);

    if (!settings) {
      console.log('[Cart Additional Items API] ⚠️ Settings não encontrado');
      return NextResponse.json({
        success: true,
        items: []
      });
    }

    console.log('[Cart Additional Items API] 📦 additionalItems raw:', settings.additionalItems);
    console.log('[Cart Additional Items API] 📊 Tipo:', typeof settings.additionalItems);
    console.log('[Cart Additional Items API] 📊 É array?', Array.isArray(settings.additionalItems));

    const items = settings.additionalItems || [];

    // Filtrar apenas itens ativos
    const activeItems = Array.isArray(items)
      ? items.filter((item: any) => item.isActive === true)
      : [];

    console.log('[Cart Additional Items API] ✅ Total de itens:', Array.isArray(items) ? items.length : 0);
    console.log('[Cart Additional Items API] ✅ Itens ativos:', activeItems.length);

    if (activeItems.length > 0) {
      console.log('[Cart Additional Items API] Detalhes:');
      activeItems.forEach((item: any, idx: number) => {
        console.log(`  ${idx + 1}. ${item.name} - €${item.price} ${item.isRequired ? '(Obrigatório)' : ''}`);
      });
    }

    return NextResponse.json({
      success: true,
      items: activeItems
    });
  } catch (error) {
    console.error('[Cart Additional Items API] ❌ Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar itens adicionais',
        items: []
      },
      { status: 500 }
    );
  }
}

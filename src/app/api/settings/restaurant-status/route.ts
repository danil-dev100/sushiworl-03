import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isRestaurantOpen } from '@/lib/restaurant-status';

/**
 * GET /api/settings/restaurant-status
 * Retorna o status atual do restaurante (online/offline + horário)
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        isOnline: true,
        openingHours: true
      }
    });

    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Configurações não encontradas'
      }, { status: 404 });
    }

    // Verificar status completo (online + horário)
    const status = await isRestaurantOpen();

    return NextResponse.json({
      success: true,
      isOnline: settings.isOnline,
      isOpen: status.isOpen,
      reason: status.reason,
      message: status.message,
      openingHours: settings.openingHours
    });
  } catch (error) {
    console.error('[API] Erro ao buscar status do restaurante:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar status do restaurante'
    }, { status: 500 });
  }
}

/**
 * POST /api/settings/restaurant-status
 * Atualiza o status do restaurante (online/offline)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isOnline } = body;

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Campo isOnline deve ser boolean'
      }, { status: 400 });
    }

    // Buscar configuração existente
    const existing = await prisma.settings.findFirst();

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Configurações não encontradas. Crie as configurações primeiro.'
      }, { status: 404 });
    }

    // Atualizar status
    const updated = await prisma.settings.update({
      where: { id: existing.id },
      data: { isOnline },
      select: {
        isOnline: true,
        updatedAt: true
      }
    });

    console.log(`[API] Status do restaurante atualizado: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    return NextResponse.json({
      success: true,
      isOnline: updated.isOnline,
      message: `Restaurante agora está ${isOnline ? 'ONLINE' : 'OFFLINE'}`
    });
  } catch (error) {
    console.error('[API] Erro ao atualizar status do restaurante:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar status do restaurante'
    }, { status: 500 });
  }
}

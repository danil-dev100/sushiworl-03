import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isOpenNow, getNextOpeningTime } from '@/lib/utils';

// Desabilitar cache para sempre retornar horário atualizado
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json({
        isOpen: true,
        message: null,
        nextOpeningTime: null,
      });
    }

    const openingHours = settings.openingHours as any;
    const isOpen = isOpenNow(openingHours);
    const nextOpeningTime = !isOpen ? getNextOpeningTime(openingHours) : null;

    let message = null;
    if (!isOpen && nextOpeningTime) {
      message = `Lamentamos mas não estamos abertos agora. Abriremos ${nextOpeningTime}.`;
    } else if (!isOpen) {
      message = 'Lamentamos mas não estamos abertos agora.';
    }

    return NextResponse.json({
      isOpen,
      message,
      nextOpeningTime,
      openingHours,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    });
  } catch (error) {
    console.error('[Store Status API] Erro:', error);
    return NextResponse.json({
      isOpen: true,
      message: null,
      nextOpeningTime: null,
    });
  }
}

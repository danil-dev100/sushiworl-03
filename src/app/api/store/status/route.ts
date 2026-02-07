import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isOpenNow, getNextOpeningTime } from '@/lib/utils';

// Cache de 60 segundos (reduz invocações no Vercel free plan)
export const revalidate = 60;

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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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

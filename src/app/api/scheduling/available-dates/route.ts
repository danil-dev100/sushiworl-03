import { NextResponse } from 'next/server';
import { getAvailableScheduleDates } from '@/lib/scheduling';

// Forçar rota dinâmica para evitar cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/scheduling/available-dates
 * Retorna todas as datas e horários disponíveis para agendamento
 */
export async function GET() {
  try {
    const { availableDates, openingHours, schedulingMinTime, schedulingEnabled } = await getAvailableScheduleDates();

    // Criar resposta com headers anti-cache
    const response = NextResponse.json({
      success: true,
      availableDates,
      openingHours,
      schedulingMinTime,
      schedulingEnabled
    });

    // Headers para evitar cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('[Available Dates API] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar datas disponíveis'
      },
      { status: 500 }
    );
  }
}

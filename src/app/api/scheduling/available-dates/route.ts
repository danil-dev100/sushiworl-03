import { NextResponse } from 'next/server';
import { getAvailableScheduleDates } from '@/lib/scheduling';

/**
 * GET /api/scheduling/available-dates
 * Retorna todas as datas e horários disponíveis para agendamento
 */
export async function GET() {
  try {
    const { availableDates, openingHours, schedulingMinTime, schedulingEnabled } = await getAvailableScheduleDates();

    return NextResponse.json({
      success: true,
      availableDates,
      openingHours,
      schedulingMinTime,
      schedulingEnabled
    });
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

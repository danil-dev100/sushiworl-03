import { NextRequest, NextResponse } from 'next/server';
import { validateScheduleDateTime } from '@/lib/scheduling';

/**
 * POST /api/scheduling/validate
 * Valida se uma data/hora específica está disponível para agendamento
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scheduledDate, scheduledTime } = body;

    if (!scheduledDate || !scheduledTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'scheduledDate e scheduledTime são obrigatórios'
        },
        { status: 400 }
      );
    }

    const validation = await validateScheduleDateTime(scheduledDate, scheduledTime);

    return NextResponse.json({
      success: validation.isValid,
      isValid: validation.isValid,
      reason: validation.reason
    });
  } catch (error) {
    console.error('[Validate Schedule API] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao validar agendamento'
      },
      { status: 500 }
    );
  }
}

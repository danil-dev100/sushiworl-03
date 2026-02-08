import { NextRequest, NextResponse } from 'next/server';
import { flowExecutionService } from '@/lib/flow-execution-service';

// Vercel Cron - roda a cada 5 minutos para processar emails com delay
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (Vercel Cron envia header especial)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron Email Queue] Processando fila de emails...');

    const result = await flowExecutionService.processQueuedExecutions();

    console.log(`[Cron Email Queue] Concluído: ${result.processed} processados, ${result.errors} erros`);

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('[Cron Email Queue] Erro:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simulação de banco de dados para métricas customizadas
// Em produção, isso seria uma tabela real no banco
let customMetrics: any[] = [];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { isActive } = body;

    const metricIndex = customMetrics.findIndex(m => m.id === id);
    if (metricIndex === -1) {
      return NextResponse.json(
        { error: 'Métrica não encontrada' },
        { status: 404 }
      );
    }

    customMetrics[metricIndex].isActive = isActive;

    return NextResponse.json({ metric: customMetrics[metricIndex] });
  } catch (error) {
    console.error('[Custom Metrics API] Erro ao atualizar:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar métrica' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const metricIndex = customMetrics.findIndex(m => m.id === id);
    if (metricIndex === -1) {
      return NextResponse.json(
        { error: 'Métrica não encontrada' },
        { status: 404 }
      );
    }

    const deletedMetric = customMetrics.splice(metricIndex, 1)[0];

    return NextResponse.json({ metric: deletedMetric });
  } catch (error) {
    console.error('[Custom Metrics API] Erro ao deletar:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar métrica' },
      { status: 500 }
    );
  }
}

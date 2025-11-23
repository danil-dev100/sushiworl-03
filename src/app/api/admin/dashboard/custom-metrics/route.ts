import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simulação de banco de dados para métricas customizadas
// Em produção, isso seria uma tabela real no banco
let customMetrics: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    return NextResponse.json({ metrics: customMetrics });
  } catch (error) {
    console.error('[Custom Metrics API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, formula, type, unit } = body;

    if (!name || !formula) {
      return NextResponse.json(
        { error: 'Nome e fórmula são obrigatórios' },
        { status: 400 }
      );
    }

    const newMetric = {
      id: Date.now().toString(),
      name,
      description: description || '',
      formula,
      type: type || 'financial',
      unit: unit || '€',
      isActive: true,
      createdAt: new Date(),
    };

    customMetrics.push(newMetric);

    return NextResponse.json({ metric: newMetric }, { status: 201 });
  } catch (error) {
    console.error('[Custom Metrics API] Erro ao criar:', error);
    return NextResponse.json(
      { error: 'Erro ao criar métrica' },
      { status: 500 }
    );
  }
}

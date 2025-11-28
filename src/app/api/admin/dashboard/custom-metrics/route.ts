import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const metrics = await prisma.customMetric.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ metrics });
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

    const newMetric = await prisma.customMetric.create({
      data: {
        name,
        description: description || '',
        formula,
        type: type?.toUpperCase() || 'FINANCIAL',
        unit: unit || '€',
        isActive: true,
      },
    });

    return NextResponse.json({ metric: newMetric }, { status: 201 });
  } catch (error) {
    console.error('[Custom Metrics API] Erro ao criar:', error);
    return NextResponse.json(
      { error: 'Erro ao criar métrica' },
      { status: 500 }
    );
  }
}

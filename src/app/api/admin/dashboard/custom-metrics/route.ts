import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Listar todas as métricas customizadas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar todas as métricas customizadas
    const metrics = await prisma.customMetric.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      metrics,
    });
  } catch (error) {
    console.error('[Custom Metrics API - GET] Erro:', error);
    console.error('[Custom Metrics API - GET] Stack trace:', error instanceof Error ? error.stack : 'N/A');

    return NextResponse.json(
      {
        error: 'Erro ao buscar métricas customizadas',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova métrica customizada
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, formula, type, unit } = body;

    // Validar campos obrigatórios
    if (!name || !formula) {
      return NextResponse.json(
        { error: 'Nome e fórmula são obrigatórios' },
        { status: 400 }
      );
    }

    // Mapear tipo do frontend para o enum do Prisma
    const metricTypeMap: { [key: string]: 'FINANCIAL' | 'OPERATIONAL' | 'MARKETING' | 'CUSTOMER' } = {
      financial: 'FINANCIAL',
      operational: 'OPERATIONAL',
      marketing: 'MARKETING',
      customer: 'CUSTOMER',
    };

    const prismaType = metricTypeMap[type] || 'FINANCIAL';

    // Criar métrica no banco de dados
    const metric = await prisma.customMetric.create({
      data: {
        name,
        description: description || '',
        formula,
        type: prismaType,
        unit: unit || '¬',
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Métrica customizada criada com sucesso',
        metric,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Custom Metrics API - POST] Erro:', error);
    console.error('[Custom Metrics API - POST] Stack trace:', error instanceof Error ? error.stack : 'N/A');

    return NextResponse.json(
      {
        error: 'Erro ao criar métrica customizada',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

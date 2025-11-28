import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    const metric = await prisma.customMetric.findUnique({
      where: { id },
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Métrica não encontrada' },
        { status: 404 }
      );
    }

    const updatedMetric = await prisma.customMetric.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ metric: updatedMetric });
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

    const metric = await prisma.customMetric.findUnique({
      where: { id },
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Métrica não encontrada' },
        { status: 404 }
      );
    }

    const deletedMetric = await prisma.customMetric.delete({
      where: { id },
    });

    return NextResponse.json({ metric: deletedMetric });
  } catch (error) {
    console.error('[Custom Metrics API] Erro ao deletar:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar métrica' },
      { status: 500 }
    );
  }
}

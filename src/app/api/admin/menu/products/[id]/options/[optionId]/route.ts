import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { optionId } = await params;

    const option = await prisma.productOption.update({
      where: { id: optionId },
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
        minSelection: body.minSelection,
        maxSelection: body.maxSelection,
        allowMultiple: body.allowMultiple,
        displayAt: body.displayAt,
        isPaid: body.isPaid,
        basePrice: body.basePrice,
      },
      include: {
        choices: true,
      },
    });

    // Revalidar páginas que mostram produtos
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/admin/cardapio');

    return NextResponse.json({ option });
  } catch (error) {
    console.error('[Product Options API] Erro ao atualizar opção:', error);
    return NextResponse.json({ error: 'Erro ao atualizar opção' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { optionId } = await params;

    // Soft delete - marcar como inativo
    await prisma.productOption.update({
      where: { id: optionId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Product Options API] Erro ao remover opção:', error);
    return NextResponse.json({ error: 'Erro ao remover opção' }, { status: 500 });
  }
}

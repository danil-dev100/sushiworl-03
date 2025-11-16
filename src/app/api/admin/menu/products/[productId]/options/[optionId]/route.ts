import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string; optionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Deletar escolhas antigas e criar novas
    await prisma.productOptionChoice.deleteMany({
      where: { optionId: params.optionId },
    });

    const option = await prisma.productOption.update({
      where: { id: params.optionId },
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
        minSelection: body.minSelection || 0,
        maxSelection: body.maxSelection || 1,
        allowMultiple: body.allowMultiple || false,
        displayAt: body.displayAt || 'CART',
        isPaid: body.isPaid || false,
        basePrice: body.basePrice || 0,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder || 0,
        choices: {
          create: (body.choices || []).map((choice: any, index: number) => ({
            name: choice.name,
            price: choice.price || 0,
            isDefault: choice.isDefault || false,
            isActive: choice.isActive ?? true,
            sortOrder: choice.sortOrder ?? index,
          })),
        },
      },
      include: {
        choices: true,
      },
    });

    return NextResponse.json({ option });
  } catch (error) {
    console.error('[Product Options API] Erro ao atualizar opção:', error);
    return NextResponse.json({ error: 'Erro ao atualizar opção' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string; optionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await prisma.productOption.delete({
      where: { id: params.optionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Product Options API] Erro ao deletar opção:', error);
    return NextResponse.json({ error: 'Erro ao deletar opção' }, { status: 500 });
  }
}


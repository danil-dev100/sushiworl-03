import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH - Atualizar área de entrega
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      polygon,
      color,
      deliveryType,
      deliveryFee,
      minOrderValue,
      isActive,
    } = body;

    const deliveryArea = await prisma.deliveryArea.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(polygon && { polygon }),
        ...(color && { color }),
        ...(deliveryType && { deliveryType }),
        ...(deliveryFee !== undefined && { deliveryFee }),
        ...(minOrderValue !== undefined && { minOrderValue }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    revalidatePath('/admin/configuracoes/areas-entrega');

    return NextResponse.json(deliveryArea);
  } catch (error) {
    console.error('[Delivery Areas API][PATCH] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar área de entrega' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir área de entrega
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.deliveryArea.delete({
      where: { id },
    });

    revalidatePath('/admin/configuracoes/areas-entrega');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Delivery Areas API][DELETE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir área de entrega' },
      { status: 500 }
    );
  }
}


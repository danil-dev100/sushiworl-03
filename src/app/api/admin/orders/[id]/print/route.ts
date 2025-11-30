import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageOrders } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageOrders(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id: id },
      select: {
        id: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.printHistory.create({
        data: {
          orderId: order.id,
          printerName: 'Impressora Virtual',
          paperSize: '80mm',
          status: 'SUCCESS',
          errorMessage: null,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          printedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar impressão:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar impressão.' },
      { status: 500 }
    );
  }
}



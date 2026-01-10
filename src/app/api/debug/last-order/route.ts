import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Buscar último pedido criado
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: true,
      },
    });

    if (!lastOrder) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum pedido encontrado',
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: lastOrder.id,
        orderNumber: lastOrder.orderNumber,
        customerEmail: lastOrder.customerEmail,
        status: lastOrder.status,
        createdAt: lastOrder.createdAt,
        total: lastOrder.total,
        items: lastOrder.orderItems.length,
      },
      redirectUrl: `/obrigado?orderId=${lastOrder.id}`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}

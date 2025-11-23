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

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Buscar todos os pedidos do mês atual
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfMonth },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Criar CSV
    const csvHeaders = [
      'Número do Pedido',
      'Data/Hora',
      'Cliente',
      'Email',
      'Telefone',
      'Status',
      'Produtos',
      'Quantidade Total',
      'Valor Total',
      'Método de Pagamento',
      'Endereço de Entrega',
      'Observações',
    ];

    const csvRows = orders.map(order => {
      const products = order.orderItems
        .map(item => `${item.product?.name || 'Produto'} (${item.quantity}x)`)
        .join('; ');

      const totalQuantity = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

      return [
        order.orderNumber,
        order.createdAt.toLocaleString('pt-PT'),
        order.customerName,
        order.customerEmail || '',
        order.customerPhone || '',
        order.status,
        products,
        totalQuantity,
        order.total.toFixed(2),
        order.paymentMethod,
        order.deliveryAddress ? JSON.stringify(order.deliveryAddress) : '',
        order.observations || '',
      ];
    });

    // Converter para CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row =>
        row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Retornar como arquivo CSV
    const response = new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=relatorio-pedidos-${today.toISOString().split('T')[0]}.csv`,
      },
    });

    return response;

  } catch (error) {
    console.error('[Dashboard Export CSV] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório CSV' },
      { status: 500 }
    );
  }
}

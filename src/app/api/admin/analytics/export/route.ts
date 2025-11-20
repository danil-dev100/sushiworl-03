import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

type PeriodParams = {
  days?: number;
  startDate?: string;
  endDate?: string;
};

function getDateRange(params: PeriodParams) {
  const endDate = params.endDate ? new Date(params.endDate) : new Date();
  const startDate = params.startDate
    ? new Date(params.startDate)
    : new Date(endDate.getTime() - (params.days || 7) * 24 * 60 * 60 * 1000);

  return { startDate, endDate };
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const { startDate, endDate } = getDateRange({
      days,
      startDate: startDateParam || undefined,
      endDate: endDateParam || undefined,
    });

    // Buscar pedidos com todos os detalhes
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        promotion: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Criar CSV
    const headers = [
      'ID Pedido',
      'Data',
      'Cliente',
      'Email',
      'Telefone',
      'Status',
      'Subtotal',
      'Desconto',
      'Taxa Entrega',
      'Total',
      'Forma Pagamento',
      'Promoção',
      'Código Cupom',
      'UTM Source',
      'Produtos',
      'Categorias',
    ];

    const rows = orders.map((order) => {
      const produtos = order.orderItems.map((item) => `${item.name} (${item.quantity}x)`).join('; ');
      const categorias = [...new Set(order.orderItems.map((item) => item.product?.category || 'N/A'))].join('; ');

      return [
        order.orderNumber,
        order.createdAt.toISOString().split('T')[0],
        order.customerName,
        order.customerEmail,
        order.customerPhone,
        order.status,
        order.subtotal.toFixed(2),
        order.discount.toFixed(2),
        order.deliveryFee.toFixed(2),
        order.total.toFixed(2),
        order.paymentMethod,
        order.promotion?.name || '-',
        order.couponCode || '-',
        order.utmSource || '-',
        produtos,
        categorias,
      ];
    });

    // Montar CSV
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Adicionar BOM para UTF-8 (para Excel abrir corretamente)
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Export API][GET] Erro ao exportar:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro ao exportar dados',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}


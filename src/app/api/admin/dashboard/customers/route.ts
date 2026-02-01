import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canAccessFinancial } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/dashboard/customers
 * Retorna dados agregados dos clientes com seus pedidos e gastos
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canAccessFinancial(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtro de data
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const whereClause: any = {
      status: {
        notIn: ['CANCELLED'],
      },
      // Excluir pedidos de teste para mostrar apenas clientes reais
      isTest: false,
    };

    if (startDate || endDate) {
      whereClause.createdAt = dateFilter;
    }

    // Buscar todos os pedidos com os dados dos clientes
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        deliveryAddress: true,
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[Customers API] Total de pedidos encontrados:', orders.length);

    // Agregar dados por cliente (usando email ou telefone como identificador único)
    const customerMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      address: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: Date;
    }>();

    orders.forEach((order) => {
      // Normalizar valores: tratar strings vazias como null
      const email = order.customerEmail?.trim() || null;
      const phone = order.customerPhone?.trim() || null;
      const name = order.customerName?.trim() || null;

      // Usar email como chave primária, ou telefone se email não existir, ou nome como último recurso
      const key = email || phone || name;

      if (!key) {
        console.log('[Customers API] Pedido sem identificador de cliente:', order);
        return;
      }

      const existing = customerMap.get(key);

      // Extrair endereço do JSON
      let address = '';
      if (order.deliveryAddress) {
        const addr = order.deliveryAddress as any;
        address = addr.fullAddress || addr.street ||
          [addr.street, addr.number, addr.city, addr.postalCode].filter(Boolean).join(', ') || '';
      }

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
          // Atualizar dados mais recentes
          if (name) existing.name = name;
          if (phone) existing.phone = phone;
          if (address) existing.address = address;
        }
      } else {
        customerMap.set(key, {
          name: name || '',
          email: email || '',
          phone: phone || '',
          address: address,
          orderCount: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
        });
      }
    });

    console.log('[Customers API] Total de clientes agregados:', customerMap.size);

    // Converter para array e ordenar por total gasto (maiores primeiro)
    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((customer, index) => ({
        id: index + 1,
        ...customer,
      }));

    // Calcular totais
    const totalCustomers = customers.length;
    const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return NextResponse.json({
      customers,
      summary: {
        totalCustomers,
        totalOrders,
        totalRevenue,
        averageOrdersPerCustomer: totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(1) : 0,
        averageSpentPerCustomer: totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('[Customers API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados dos clientes' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/dashboard/customers/export
 * Exporta dados dos clientes em CSV
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canAccessFinancial(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    // Construir filtro de data
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const whereClause: any = {
      status: {
        notIn: ['CANCELLED'],
      },
      // Excluir pedidos de teste para mostrar apenas clientes reais
      isTest: false,
    };

    if (startDate || endDate) {
      whereClause.createdAt = dateFilter;
    }

    // Buscar todos os pedidos
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        deliveryAddress: true,
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agregar dados por cliente
    const customerMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      address: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: Date;
    }>();

    orders.forEach((order) => {
      // Normalizar valores: tratar strings vazias como null
      const email = order.customerEmail?.trim() || null;
      const phone = order.customerPhone?.trim() || null;
      const name = order.customerName?.trim() || null;

      const key = email || phone || name;
      if (!key) return;

      const existing = customerMap.get(key);

      let address = '';
      if (order.deliveryAddress) {
        const addr = order.deliveryAddress as any;
        address = addr.fullAddress || addr.street ||
          [addr.street, addr.number, addr.city, addr.postalCode].filter(Boolean).join(', ') || '';
      }

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
          if (name) existing.name = name;
          if (phone) existing.phone = phone;
          if (address) existing.address = address;
        }
      } else {
        customerMap.set(key, {
          name: name || '',
          email: email || '',
          phone: phone || '',
          address: address,
          orderCount: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
        });
      }
    });

    // Converter para array e ordenar
    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Gerar CSV
    const headers = ['Nome', 'Email', 'Telefone', 'Endereço', 'Qtd Pedidos', 'Total Gasto (€)', 'Último Pedido'];
    const rows = customers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      c.orderCount.toString(),
      c.totalSpent.toFixed(2),
      c.lastOrderDate.toLocaleDateString('pt-PT'),
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n');

    // Retornar CSV com headers corretos
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Customers Export API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados dos clientes' },
      { status: 500 }
    );
  }
}

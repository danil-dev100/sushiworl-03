import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrdersFilters } from '@/components/admin/orders/OrdersFilters';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gestão de Pedidos | Admin - SushiWorld',
  description: 'Gerencie os pedidos do restaurante',
};

interface PageProps {
  searchParams: {
    status?: string;
    search?: string;
    date?: string;
  };
}

async function getOrders(searchParams: PageProps['searchParams']) {
  const { status, search, date } = searchParams;

  const where: any = {};

  // Filtro por status
  if (status && status !== 'all') {
    where.status = status.toUpperCase();
  }

  // Filtro por busca (número do pedido ou nome do cliente)
  if (search) {
    where.OR = [
      { orderNumber: { equals: parseInt(search) || 0 } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search } },
    ];
  }

  // Filtro por data
  if (date) {
    const selectedDate = new Date(date);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    where.createdAt = {
      gte: selectedDate,
      lt: nextDay,
    };
  } else if (!status || status === 'today') {
    // Por padrão, mostrar pedidos de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    where.createdAt = {
      gte: today,
      lt: tomorrow,
    };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
      deliveryArea: {
        select: {
          name: true,
        },
      },
    },
  });

  // Contar pedidos por status
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
    where: {
      createdAt: where.createdAt,
    },
  });

  const counts = {
    all: orders.length,
    pending: statusCounts.find((s) => s.status === 'PENDING')?._count || 0,
    confirmed: statusCounts.find((s) => s.status === 'CONFIRMED')?._count || 0,
    preparing: statusCounts.find((s) => s.status === 'PREPARING')?._count || 0,
    delivering: statusCounts.find((s) => s.status === 'DELIVERING')?._count || 0,
    delivered: statusCounts.find((s) => s.status === 'DELIVERED')?._count || 0,
    cancelled: statusCounts.find((s) => s.status === 'CANCELLED')?._count || 0,
  };

  return { orders, counts };
}

export default async function PedidosPage({ searchParams }: PageProps) {
  const { orders, counts } = await getOrders(searchParams);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-black text-[#FF6B00]">Pedidos</h1>
        <p className="mt-1 text-sm text-[#a16b45]">
          Gerencie os pedidos do restaurante
        </p>
      </header>

      {/* Filters */}
      <OrdersFilters counts={counts} currentStatus={searchParams.status} />

      {/* Search */}
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4 dark:bg-[#2a1e14] md:flex-row md:items-center">
        <div className="relative flex-grow">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a16b45]" />
          <input
            type="text"
            name="search"
            placeholder="Buscar por ID, cliente, telefone..."
            defaultValue={searchParams.search}
            className="w-full rounded-md border border-[#ead9cd] bg-[#f5f1e9] py-2 pl-10 pr-4 text-sm text-[#333333] placeholder-[#a16b45] focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
          />
        </div>
        <input
          type="date"
          name="date"
          defaultValue={searchParams.date}
          className="rounded-md border border-[#ead9cd] bg-[#f5f1e9] px-4 py-2 text-sm text-[#333333] focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
        />
      </div>

      {/* Orders Table */}
      <OrdersTable orders={orders} />

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#ead9cd] bg-white p-12 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
          <div className="text-center">
            <p className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
              Nenhum pedido encontrado
            </p>
            <p className="mt-1 text-sm text-[#a16b45]">
              Tente ajustar os filtros ou aguarde novos pedidos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

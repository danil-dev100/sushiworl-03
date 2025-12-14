import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { PedidosClientWrapper } from './PedidosClientWrapper';

export const metadata: Metadata = {
  title: 'Gestão de Pedidos | Admin - SushiWorld',
  description: 'Gerencie os pedidos do restaurante',
};

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  priceAtTime: number;
  productId: string;
  orderId: string;
  createdAt: Date;
  product?: {
    name: string | null;
    imageUrl: string | null;
  } | null;
  selectedOptions?: Record<string, unknown> | null;
};

type Order = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNif?: string | null;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  paymentMethod: string;
  createdAt: Date;
  observations?: string | null;
  deliveryAddress?: Record<string, unknown> | null;
  deliveryArea?: {
    name: string | null;
  } | null;
  orderItems: OrderItem[];
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    date?: string;
  }>;
}

async function getOrders(searchParams: Awaited<PageProps['searchParams']>) {
  const { status, search, date} = searchParams;

  const where: any = {};

  // Filtro por status - APLICAR SEMPRE que houver um status específico
  if (status === 'pending') {
    where.status = 'PENDING';
  } else if (status === 'confirmed') {
    where.status = 'CONFIRMED';
  } else if (status === 'preparing') {
    where.status = 'PREPARING';
  } else if (status === 'delivering') {
    where.status = 'DELIVERING';
  } else if (status === 'delivered') {
    where.status = 'DELIVERED';
  } else if (status === 'cancelled') {
    where.status = 'CANCELLED';
  }
  // Se status for 'all' ou 'today' ou undefined, não aplicar filtro de status

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
    // Se uma data específica foi selecionada, usar ela
    const selectedDate = new Date(date);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    where.createdAt = {
      gte: selectedDate,
      lt: nextDay,
    };
  } else if (status === 'today' || !status) {
    // Quando selecionado "Hoje" ou padrão (sem status), mostrar apenas pedidos de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    where.createdAt = {
      gte: today,
      lt: tomorrow,
    };
  }
  // Se status for 'all' ou outro status específico (pending, confirmed, etc) sem data, não aplicar filtro de data

  const ordersFromDb = await prisma.order.findMany({
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

  // Mapear para o tipo esperado pelo componente
  const orders: Order[] = ordersFromDb.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerNif: order.customerNif,
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    discount: order.discount,
    deliveryFee: order.deliveryFee,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    observations: order.observations,
    deliveryAddress: order.deliveryAddress ? (order.deliveryAddress as Record<string, unknown>) : null,
    deliveryArea: order.deliveryArea,
    orderItems: order.orderItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
      productId: item.productId,
      orderId: item.orderId,
      createdAt: item.createdAt,
      product: item.product,
      selectedOptions: item.selectedOptions ? (item.selectedOptions as Record<string, unknown>) : null,
    })),
  }));

  // Contar pedidos por status (usando os mesmos filtros, exceto status)
  const countWhere: any = {};
  if (where.createdAt) {
    countWhere.createdAt = where.createdAt;
  }
  if (where.OR) {
    countWhere.OR = where.OR;
  }

  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
    where: countWhere,
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
  const resolvedSearchParams = await searchParams;
  const [{ orders, counts }, products] = await Promise.all([
    getOrders(resolvedSearchParams),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        price: true,
      },
    }),
  ]);

  return (
    <Suspense fallback={<div className="p-8">Carregando pedidos...</div>}>
      <PedidosClientWrapper
        initialData={{ orders, counts }}
        products={products}
      />
    </Suspense>
  );
}

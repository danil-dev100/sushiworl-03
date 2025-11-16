'use client';

import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrdersFilters } from '@/components/admin/orders/OrdersFilters';
import { TestOrderDialog } from '@/components/admin/orders/TestOrderDialog';
import { useOrdersPolling } from '@/hooks/useOrdersPolling';
import { useSearchParams, useRouter } from 'next/navigation';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  priceAtTime: number;
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
  createdAt: string | Date;
  observations?: string | null;
  deliveryAddress?: Record<string, unknown> | null;
  deliveryArea?: {
    name: string | null;
  } | null;
  orderItems: OrderItem[];
};

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type OrdersData = {
  orders: Order[];
  counts: {
    all: number;
    pending: number;
    confirmed: number;
    preparing: number;
    delivering: number;
    delivered: number;
    cancelled: number;
  };
};

interface OrdersPageContentProps {
  initialData: OrdersData;
  products: ProductOption[];
}

export function OrdersPageContent({ initialData, products }: OrdersPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, refetch } = useOrdersPolling(initialData, 2000); // Polling a cada 2 segundos

  const handleOrderCreated = async () => {
    // Atualizar imediatamente após criar pedido
    await refetch();
    
    // Se não estiver na aba "Pendentes", redirecionar para lá para ver o novo pedido
    const currentStatus = searchParams.get('status');
    if (currentStatus !== 'pending') {
      // Aguardar um pouco para garantir que o pedido foi salvo no banco
      setTimeout(async () => {
        router.push('/admin/pedidos?status=pending');
        // Aguardar a navegação e então atualizar novamente
        setTimeout(() => {
          refetch();
        }, 300);
      }, 500);
    } else {
      // Se já está em "Pendentes", apenas atualizar
      setTimeout(() => {
        refetch();
      }, 500);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#FF6B00]">Pedidos</h1>
          <p className="mt-1 text-sm text-[#a16b45]">
            Gerencie os pedidos do restaurante
          </p>
        </div>
        <TestOrderDialog products={products} onOrderCreated={handleOrderCreated} />
      </header>

      {/* Filters */}
      <OrdersFilters counts={data.counts} currentStatus={searchParams.get('status') || undefined} />

      {/* Orders Table */}
      <OrdersTable orders={data.orders} />
    </div>
  );
}


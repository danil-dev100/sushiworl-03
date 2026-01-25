'use client';

import { OrdersPageContent } from '@/components/admin/orders/OrdersPageContent';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { RestaurantStatusToggle } from '@/components/admin/RestaurantStatusToggle';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

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
  isScheduled?: boolean;
  scheduledFor?: string | Date | null;
  checkoutAdditionalItems?: Array<{ name: string; price: number }> | null;
  globalOptions?: Array<{ optionId: string; optionName: string; choices: Array<{ choiceId: string; choiceName: string; price: number; quantity?: number }> }> | null;
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
    scheduled: number;
  };
};

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

interface PedidosClientWrapperProps {
  initialData: OrdersData;
  products: ProductOption[];
}

export function PedidosClientWrapper({
  initialData,
  products
}: PedidosClientWrapperProps) {
  // ✅ Ler currentStatus DIRETO da URL ao invés de prop do servidor
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status');

  // ============================================
  // HOOK UNIFICADO - ÚNICA FONTE DE VERDADE
  // ============================================
  const {
    orders: allOrders,
    isPlaying,
    stopNotification,
    isConnected
  } = useOrdersRealtime(true, initialData.orders);

  // ============================================
  // FILTRO POR STATUS
  // ============================================
  const mergedData = useMemo(() => {
    let filteredOrders = allOrders;

    if (currentStatus === 'pending') {
      filteredOrders = allOrders.filter(o => o.status === 'PENDING');
    } else if (currentStatus === 'confirmed') {
      filteredOrders = allOrders.filter(o => o.status === 'CONFIRMED');
    } else if (currentStatus === 'scheduled') {
      filteredOrders = allOrders.filter(o => o.isScheduled === true);
    } else if (currentStatus === 'all') {
      filteredOrders = allOrders; // Todos
    } else {
      // Default (Hoje) - mostrar pedidos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
    }

    return {
      ...initialData,
      orders: filteredOrders
    };
  }, [currentStatus, allOrders, initialData]);

  // Função vazia para compatibilidade (não usamos mais)
  const refreshOrders = async () => {
    // noop - Realtime gerencia automaticamente
  };

  return (
    <>
      {/* Toggle de Status do Restaurante */}
      <div className="mx-6 mt-6 mb-4 flex justify-end">
        <RestaurantStatusToggle />
      </div>

      <OrdersPageContent
        initialData={mergedData}
        products={products}
        newOrdersCount={0}
        isPlaying={isPlaying}
        stopNotification={stopNotification}
        refreshOrders={refreshOrders}
      />
    </>
  );
}

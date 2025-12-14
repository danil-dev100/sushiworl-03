'use client';

import { OrdersPageContent } from '@/components/admin/orders/OrdersPageContent';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
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
  // REALTIME (Fonte Principal)
  // ============================================
  const {
    orders: realtimeOrders,
    isPlaying: realtimeIsPlaying,
    stopNotification: realtimeStopNotification,
    isConnected
  } = useOrdersRealtime(true, initialData.orders);

  // ============================================
  // POLLING (Fallback Silencioso - apenas sincroniza)
  // ============================================
  const {
    newOrdersCount,
    refreshOrders
  } = useOrderPolling(true);

  // Usar dados do REALTIME como fonte principal
  const isPlaying = realtimeIsPlaying;
  const stopNotification = realtimeStopNotification;

  // ============================================
  // MERGE DE DADOS (CRÍTICO!)
  // ============================================
  const mergedData = useMemo(() => {
    // ✅ SEMPRE usar REALTIME, filtrando por status
    let filteredOrders = realtimeOrders;

    if (currentStatus === 'pending') {
      filteredOrders = realtimeOrders.filter(o => o.status === 'PENDING');
    } else if (currentStatus === 'confirmed') {
      filteredOrders = realtimeOrders.filter(o => o.status === 'CONFIRMED');
    } else if (currentStatus === 'all') {
      filteredOrders = realtimeOrders; // Todos
    } else {
      // Default (Hoje) - mostrar pedidos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredOrders = realtimeOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
    }

    return {
      ...initialData,
      orders: filteredOrders
    };
  }, [currentStatus, realtimeOrders, initialData]);

  console.log('🎨 [ClientWrapper] Renderizando:', {
    currentStatus: currentStatus || 'default (hoje)',
    displayCount: mergedData.orders.length,
    source: 'REALTIME',
    realtimeConnected: isConnected,
    realtimeOrdersTotal: realtimeOrders.length,
    realtimeOrdersFiltered: mergedData.orders.length
  });

  return (
    <>
      {/* DEBUG - Remover depois de funcionar */}
      <div className="mx-6 mt-6 mb-4 p-4 bg-green-500 text-white rounded-lg">
        <p className="font-bold text-lg">✅ REALTIME ATIVO (TODAS AS ABAS)</p>
        <p className="mt-1">Status atual: <strong>{currentStatus || 'default (hoje)'}</strong></p>
        <p>Fonte de dados: <strong>REALTIME</strong></p>
        <p>Conexão Realtime: <strong>{isConnected ? '🟢 CONECTADO' : '🔴 DESCONECTADO'}</strong></p>
        <p>Total no Realtime: <strong>{realtimeOrders.length}</strong></p>
        <p>Total filtrado: <strong>{mergedData.orders.length}</strong></p>
        {mergedData.orders.length > 0 && (
          <p className="text-sm mt-1">
            IDs: {mergedData.orders.map(o => o.id.slice(-6)).join(', ')}
          </p>
        )}
      </div>

      <OrdersPageContent
        initialData={mergedData}
        products={products}
        newOrdersCount={newOrdersCount}
        isPlaying={isPlaying}
        stopNotification={stopNotification}
        refreshOrders={refreshOrders}
      />
    </>
  );
}

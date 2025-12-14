'use client';

import { OrdersPageContent } from '@/components/admin/orders/OrdersPageContent';
import { useOrderPolling } from '@/hooks/useOrderPolling';
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
  currentStatus: string | null;
}

export function PedidosClientWrapper({
  initialData,
  products,
  currentStatus
}: PedidosClientWrapperProps) {
  // ✅ Hook de polling funciona aqui porque é CLIENT COMPONENT
  const { orders: pollingOrders } = useOrderPolling(true);

  // Mesclar dados: Se estiver em "Pendentes", usar polling, senão usar server
  const mergedData = useMemo(() => {
    if (currentStatus === 'pending') {
      // Usar pedidos do polling na aba Pendentes
      console.log('🟢 [ClientWrapper] Usando POLLING para Pendentes:', {
        pollingCount: pollingOrders.length,
        pollingIds: pollingOrders.map(o => o.id.slice(-6))
      });

      return {
        ...initialData,
        orders: pollingOrders
      };
    } else {
      // Usar dados do servidor para outras abas
      console.log('🔵 [ClientWrapper] Usando SERVER para', currentStatus || 'default:', {
        serverCount: initialData.orders.length
      });

      return initialData;
    }
  }, [currentStatus, pollingOrders, initialData]);

  console.log('🎨 [ClientWrapper] Renderizando:', {
    currentStatus: currentStatus || 'default (hoje)',
    displayCount: mergedData.orders.length,
    source: currentStatus === 'pending' ? 'POLLING' : 'SERVER'
  });

  return (
    <>
      {/* DEBUG - Remover depois de funcionar */}
      <div className="mx-6 mt-6 mb-4 p-4 bg-green-500 text-white rounded-lg">
        <p className="font-bold text-lg">✅ CLIENT COMPONENT ATIVO</p>
        <p className="mt-1">Status atual: <strong>{currentStatus || 'default (hoje)'}</strong></p>
        <p>Fonte de dados: <strong>{currentStatus === 'pending' ? 'POLLING' : 'SERVER'}</strong></p>
        <p>Total de pedidos: <strong>{mergedData.orders.length}</strong></p>
        {mergedData.orders.length > 0 && (
          <p className="text-sm mt-1">
            IDs: {mergedData.orders.map(o => o.id.slice(-6)).join(', ')}
          </p>
        )}
      </div>

      <OrdersPageContent
        initialData={mergedData}
        products={products}
      />
    </>
  );
}

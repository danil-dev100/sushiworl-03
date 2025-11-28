import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

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

export function useOrdersPolling(initialData: OrdersData, interval = 2000) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<OrdersData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const fetchOrders = useCallback(async (force = false) => {
    try {
      // Evitar múltiplas requisições simultâneas
      if (!force && isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      const params = new URLSearchParams();
      
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const date = searchParams.get('date');

      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (date) params.set('date', date);

      // Adicionar timestamp para evitar cache
      params.set('_t', Date.now().toString());

      const response = await fetch(`/api/admin/orders/list?${params.toString()}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos');
      }

      const newData: OrdersData = await response.json();
      setData(newData);
    } catch (error) {
      console.error('[useOrdersPolling] Erro ao buscar pedidos:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [searchParams]);

  useEffect(() => {
    // Buscar imediatamente quando os parâmetros mudarem
    fetchOrders(true);

    // Configurar polling mais frequente
    const intervalId = setInterval(() => {
      fetchOrders(false);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchOrders, interval]);

  // Refetch manual (para quando um pedido é criado)
  const refetch = useCallback(async () => {
    await fetchOrders(true);
  }, [fetchOrders]);

  return { data, setData, isLoading, refetch };
}


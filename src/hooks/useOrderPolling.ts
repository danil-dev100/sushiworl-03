'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getNotificationSound } from '@/lib/notification-sound';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  priceAtTime: number;
  product?: {
    name: string | null;
    imageUrl: string | null;
  } | null;
  selectedOptions?: Record<string, unknown> | null;
}

interface Order {
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
}

export function useOrderPolling(enabled: boolean = true) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundRef = useRef(getNotificationSound());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedOrdersRef = useRef<Set<string>>(new Set());
  const lastCheckRef = useRef<Date>(new Date());

  const fetchOrders = useCallback(async () => {
    try {
      console.log('[Polling] Verificando novos pedidos...');

      const res = await fetch('/api/admin/orders/pending');
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      const currentOrders: Order[] = data.orders || [];

      const newOrders = currentOrders.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        const isNew = orderDate > lastCheckRef.current;
        const notNotified = !notifiedOrdersRef.current.has(order.id);
        return isNew && notNotified && order.status === 'PENDING';
      });

      if (newOrders.length > 0) {
        console.log('NOVOS PEDIDOS:', newOrders.length);

        newOrders.forEach((order: Order) => {
          notifiedOrdersRef.current.add(order.id);
        });

        soundRef.current.playUrgentAlert();
        setIsPlaying(true);

        newOrders.forEach((order: Order) => {
          toast.success(`Novo Pedido #${order.orderNumber || order.id.slice(-6)}`, {
            duration: Infinity,
            description: `Cliente: ${order.customerName || 'Não informado'}`
          });
        });

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          newOrders.forEach((order: Order) => {
            new Notification('Novo Pedido SushiWorld!', {
              body: `Pedido #${order.orderNumber || order.id.slice(-6)}`,
              icon: '/logo.png',
              requireInteraction: true
            });
          });
        }

        setNewOrdersCount(prev => prev + newOrders.length);
      }

      setOrders(currentOrders);
      lastCheckRef.current = new Date();

      const hasPending = currentOrders.some((o: Order) => o.status === 'PENDING');
      if (!hasPending && isPlaying) {
        soundRef.current.stopAlert();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [isPlaying]);

  const handleOrderAccepted = useCallback((orderId: string) => {
    notifiedOrdersRef.current.delete(orderId);
    setNewOrdersCount(prev => Math.max(0, prev - 1));
    soundRef.current.playSuccessBeep();
    fetchOrders();
  }, [fetchOrders]);

  const stopNotification = useCallback(() => {
    if (isPlaying) {
      soundRef.current.stopAlert();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!enabled) return;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      soundRef.current.stopAlert();
    };
  }, [enabled, fetchOrders]);

  // Sincronizar estado isPlaying com o soundRef
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const actualIsPlaying = soundRef.current.getIsPlaying();
      if (actualIsPlaying !== isPlaying) {
        setIsPlaying(actualIsPlaying);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [isPlaying]);

  useEffect(() => {
    return () => soundRef.current.cleanup();
  }, []);

  return {
    orders,
    newOrdersCount,
    isPlaying,
    stopNotification,
    handleOrderAccepted,
    refreshOrders: fetchOrders
  };
}

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
  const isMountedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('🔄 [Polling] Verificando novos pedidos...', new Date().toISOString());

      const res = await fetch('/api/admin/orders/pending', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      console.log('📡 [Polling] Response status:', res.status);

      if (!res.ok) {
        console.error('❌ [Polling] Response não OK:', res.status);
        return;
      }

      const data = await res.json();
      console.log('📦 [Polling] Data recebido:', {
        success: data.success,
        ordersCount: data.orders?.length || 0
      });

      if (!data.success) {
        console.error('❌ [Polling] API retornou erro');
        return;
      }

      const currentOrders: Order[] = data.orders || [];
      console.log('📊 [Polling] Total de pedidos:', currentOrders.length);

      const newOrders = currentOrders.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        const isNew = orderDate > lastCheckRef.current;
        const notNotified = !notifiedOrdersRef.current.has(order.id);
        const isPending = order.status === 'PENDING';

        console.log(`🔍 [Check] Pedido ${order.id.slice(-6)}:`, {
          orderDate: orderDate.toISOString(),
          lastCheck: lastCheckRef.current.toISOString(),
          isNew,
          notNotified,
          isPending,
          willNotify: isNew && notNotified && isPending
        });

        return isNew && notNotified && isPending;
      });

      if (newOrders.length > 0) {
        console.log('🆕🆕🆕 NOVOS PEDIDOS DETECTADOS:', newOrders.length);
        console.log('🆕 IDs:', newOrders.map(o => o.id.slice(-6)));

        newOrders.forEach((order: Order) => {
          notifiedOrdersRef.current.add(order.id);
          console.log('✅ Pedido marcado como notificado:', order.id.slice(-6));
        });

        console.log('🔊 Tentando tocar som...');
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

      console.log('📝 [Update] Atualizando state com', currentOrders.length, 'pedidos');
      setOrders(currentOrders);
      lastCheckRef.current = new Date();
      console.log('⏰ [Update] lastCheck atualizado para:', lastCheckRef.current.toISOString());

      const hasPending = currentOrders.some((o: Order) => o.status === 'PENDING');
      console.log('🔔 [Status] Tem pedidos pendentes?', hasPending);

      // Usar soundRef.current.getIsPlaying() ao invés do state para evitar re-render
      const currentlyPlaying = soundRef.current.getIsPlaying();
      if (!hasPending && currentlyPlaying) {
        console.log('🔇 [Sound] Parando som (sem pendentes)');
        soundRef.current.stopAlert();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('❌❌❌ [Polling] ERRO FATAL:', error);
    }
  }, []); // REMOVIDO isPlaying das dependências!

  const handleOrderAccepted = useCallback((orderId: string) => {
    notifiedOrdersRef.current.delete(orderId);
    setNewOrdersCount(prev => Math.max(0, prev - 1));
    soundRef.current.playSuccessBeep();
    fetchOrders();
  }, [fetchOrders]);

  const stopNotification = useCallback(() => {
    // Usar soundRef diretamente ao invés do state para evitar dependência
    const currentlyPlaying = soundRef.current.getIsPlaying();
    if (currentlyPlaying) {
      soundRef.current.stopAlert();
      setIsPlaying(false);
    }
  }, []); // REMOVIDO isPlaying das dependências!

  // Proteção contra montagem dupla
  useEffect(() => {
    if (isMountedRef.current) {
      console.warn('⚠️ [Polling] Hook já foi montado, ignorando segunda montagem');
      return;
    }
    isMountedRef.current = true;
    console.log('✅ [Polling] Hook montado pela primeira vez');

    return () => {
      console.log('🧹 [Polling] Desmontando hook');
      isMountedRef.current = false;
    };
  }, []);

  // Efeito de polling principal
  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ [Polling] Hook DESABILITADO');
      return;
    }

    if (!isMountedRef.current) {
      console.log('⏸️ [Polling] Hook não montado ainda, aguardando...');
      return;
    }

    console.log('▶️▶️▶️ [Polling] Hook INICIADO - enabled:', enabled);

    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      console.log('🧹 [Polling] Limpando intervalo anterior');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      console.log('🔔 [Permissions] Pedindo permissão para notificações...');
      Notification.requestPermission();
    }

    console.log('🚀 [Polling] Primeira busca imediata...');
    fetchOrders();

    console.log('⏰ [Polling] Configurando intervalo de 3s...');
    intervalRef.current = setInterval(() => {
      console.log('⏰ TICK - Executando fetch agendado');
      fetchOrders();
    }, 3000);

    return () => {
      console.log('🛑 [Polling] Cleanup - parando intervalo');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      soundRef.current.stopAlert();
    };
  }, [enabled, fetchOrders]); // fetchOrders agora é estável (deps vazias)

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

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getNotificationSound } from '@/lib/notification-sound';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TIPOS (reutilizando estrutura existente)
// ============================================

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

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook para escutar mudanças em tempo real na tabela 'orders'
 *
 * Eventos suportados:
 * - INSERT: Novo pedido criado
 * - UPDATE: Status de pedido atualizado
 *
 * Segurança:
 * - Usa anon key (público)
 * - RLS deve estar configurado no Supabase
 * - Apenas pedidos PENDING são monitorados para som/notificação
 *
 * @param enabled - Se true, conecta ao Realtime
 * @param initialOrders - Pedidos iniciais do servidor (SSR)
 * @returns { orders, isPlaying, stopNotification, isConnected }
 */
export function useOrdersRealtime(
  enabled: boolean = true,
  initialOrders: Order[] = []
) {
  // ============================================
  // ESTADO
  // ============================================

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // ============================================
  // REFS (não causam re-render)
  // ============================================

  const soundRef = useRef(getNotificationSound());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const notifiedOrdersRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(false);

  // ============================================
  // FUNÇÃO: PARAR NOTIFICAÇÃO
  // ============================================

  const stopNotification = useCallback(() => {
    const currentlyPlaying = soundRef.current.getIsPlaying();
    if (currentlyPlaying) {
      soundRef.current.stopAlert();
      setIsPlaying(false);
    }
  }, []);

  // ============================================
  // FUNÇÃO: NOTIFICAR NOVO PEDIDO
  // ============================================

  const notifyNewOrder = useCallback((order: Order) => {
    // Evitar notificação duplicada
    if (notifiedOrdersRef.current.has(order.id)) {
      return;
    }

    console.log('[REALTIME] 🆕 Novo pedido detectado:', order.id.slice(-6));
    notifiedOrdersRef.current.add(order.id);

    // Som (apenas para PENDING)
    if (order.status === 'PENDING') {
      console.log('[REALTIME] 🔊 Tocando som...');
      soundRef.current.playUrgentAlert();
      setIsPlaying(true);
    }

    // Toast
    toast.success(`Novo Pedido #${order.orderNumber || order.id.slice(-6)}`, {
      duration: Infinity,
      description: `Cliente: ${order.customerName || 'Não informado'}`
    });

    // Browser notification
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('Novo Pedido SushiWorld!', {
        body: `Pedido #${order.orderNumber || order.id.slice(-6)}`,
        icon: '/logo.png',
        requireInteraction: true
      });
    }
  }, []);

  // ============================================
  // FUNÇÃO: MERGE DE DADOS (CRÍTICO!)
  // ============================================

  /**
   * Adiciona ou atualiza pedido no state
   *
   * Regras:
   * - Se pedido já existe (mesmo ID): ATUALIZAR (não duplicar)
   * - Se pedido é novo: ADICIONAR no topo
   * - Manter ordem por data de criação (mais recente primeiro)
   */
  const mergeOrder = useCallback((newOrder: Order, eventType: 'INSERT' | 'UPDATE') => {
    setOrders(prev => {
      const existingIndex = prev.findIndex(o => o.id === newOrder.id);

      if (existingIndex !== -1) {
        // ✅ UPDATE: Substituir pedido existente
        console.log('[REALTIME] 📝 Atualizando pedido:', newOrder.id.slice(-6));
        const updated = [...prev];
        updated[existingIndex] = newOrder;
        return updated;
      } else {
        // ✅ INSERT: Adicionar no topo
        console.log('[REALTIME] ➕ Adicionando pedido:', newOrder.id.slice(-6));
        return [newOrder, ...prev];
      }
    });
  }, []);

  // ============================================
  // EFEITO: CONECTAR REALTIME
  // ============================================

  useEffect(() => {
    console.log('[REALTIME] 🔧 Hook useOrdersRealtime executado', {
      enabled,
      isMounted: isMountedRef.current,
      initialOrdersCount: initialOrders.length
    });

    // Proteção contra double mounting (React Strict Mode)
    if (isMountedRef.current) {
      console.warn('[REALTIME] ⚠️ Hook já montado, ignorando');
      return;
    }
    isMountedRef.current = true;

    if (!enabled) {
      console.log('[REALTIME] ⏸️ Realtime desabilitado');
      return;
    }

    console.log('[REALTIME] 🚀 Conectando ao Supabase Realtime...');

    // Criar canal
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Order'
        },
        (payload) => {
          console.log('[REALTIME] 📨 Evento INSERT recebido');
          console.log('[REALTIME] Payload:', payload.new);

          const newOrder = payload.new as Order;
          mergeOrder(newOrder, 'INSERT');

          // Notificar apenas se for PENDING
          if (newOrder.status === 'PENDING') {
            notifyNewOrder(newOrder);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order'
        },
        (payload) => {
          console.log('[REALTIME] 📨 Evento UPDATE recebido');
          console.log('[REALTIME] Pedido:', payload.new.id?.toString().slice(-6));

          const updatedOrder = payload.new as Order;
          mergeOrder(updatedOrder, 'UPDATE');

          // Parar som se pedido deixou de ser PENDING
          const wasPending = (payload.old as Order)?.status === 'PENDING';
          const isStillPending = updatedOrder.status === 'PENDING';

          if (wasPending && !isStillPending) {
            console.log('[REALTIME] 🔇 Pedido aceito/rejeitado, verificando som...');

            // Verificar se ainda há pedidos PENDING
            setOrders(currentOrders => {
              const hasPending = currentOrders.some(o =>
                o.status === 'PENDING' && o.id !== updatedOrder.id
              );

              if (!hasPending) {
                const currentlyPlaying = soundRef.current.getIsPlaying();
                if (currentlyPlaying) {
                  soundRef.current.stopAlert();
                  setIsPlaying(false);
                }
              }

              return currentOrders;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Status da conexão:', status);

        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] ✅ Conectado com sucesso!');
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME] ❌ Erro na conexão');
          setIsConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.error('[REALTIME] ⏱️ Timeout na conexão');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // ============================================
    // CLEANUP
    // ============================================

    return () => {
      console.log('[REALTIME] 🛑 Desconectando...');

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      setIsConnected(false);
    };
  }, [enabled, mergeOrder, notifyNewOrder]);

  // ============================================
  // RETORNO
  // ============================================

  return {
    orders,
    isPlaying,
    stopNotification,
    isConnected
  };
}

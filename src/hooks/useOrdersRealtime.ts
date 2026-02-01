'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getNotificationSound } from '@/lib/notification-sound';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TIPOS
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
  isScheduled?: boolean;
  scheduledFor?: string | Date | null;
  checkoutAdditionalItems?: Array<{ name: string; price: number }> | null;
  globalOptions?: Array<{ optionId: string; optionName: string; choices: Array<{ choiceId: string; choiceName: string; price: number; quantity?: number }> }> | null;
}

// ============================================
// HOOK UNIFICADO - ÚNICA FONTE DE VERDADE
// ============================================

/**
 * Hook unificado para gerenciar pedidos em tempo real
 *
 * Estratégia:
 * 1. Realtime é a fonte primária (WebSocket)
 * 2. Polling é fallback silencioso (sincroniza a cada 10s)
 * 3. Estado `orders` é a ÚNICA FONTE DE VERDADE
 * 4. Merge inteligente evita duplicação
 *
 * @param enabled - Se true, ativa Realtime + Polling
 * @param initialOrders - Pedidos iniciais do servidor (SSR)
 */
export function useOrdersRealtime(
  enabled: boolean = true,
  initialOrders: Order[] = []
) {
  // ============================================
  // ESTADO ÚNICO
  // ============================================

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // ============================================
  // REFS
  // ============================================

  const soundRef = useRef(getNotificationSound());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedOrdersRef = useRef<Set<string>>(new Set());
  const lastPollingCheckRef = useRef<Date>(new Date());

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

    console.log('[UNIFIED] 🆕 Novo pedido detectado:', order.id.slice(-6));
    notifiedOrdersRef.current.add(order.id);

    // Som (apenas para PENDING)
    if (order.status === 'PENDING') {
      console.log('[UNIFIED] 🔊 Tocando som...');
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
  // FUNÇÃO: BUSCAR PEDIDO COMPLETO
  // ============================================

  const fetchCompleteOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    // Verificar se Supabase está configurado
    if (!supabase) {
      console.warn('[UNIFIED] Supabase não configurado, não é possível buscar pedido');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          orderItems:OrderItem(
            *,
            product:Product(name, imageUrl)
          ),
          deliveryArea:DeliveryArea(name)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('[UNIFIED] Erro ao buscar pedido completo:', error);
        return null;
      }

      return data as Order;
    } catch (error) {
      console.error('[UNIFIED] Erro ao buscar pedido:', error);
      return null;
    }
  }, []);

  // ============================================
  // FUNÇÃO: MERGE INTELIGENTE (CRÍTICO!)
  // ============================================

  /**
   * Adiciona ou atualiza pedido no estado único
   *
   * Regras:
   * - Se pedido existe (mesmo ID): ATUALIZAR
   * - Se pedido é novo: ADICIONAR no topo
   * - Evita duplicação entre Realtime e Polling
   */
  const mergeOrder = useCallback((newOrder: Order, eventType: 'INSERT' | 'UPDATE' | 'POLLING') => {
    console.log(`[UNIFIED] 🔄 Merge ${eventType}:`, newOrder.id.slice(-6));

    setOrders(prev => {
      const existingIndex = prev.findIndex(o => o.id === newOrder.id);

      if (existingIndex !== -1) {
        // ✅ ATUALIZAR: Substituir pedido existente
        console.log('[UNIFIED] 📝 Atualizando pedido:', newOrder.id.slice(-6));
        const updated = [...prev];
        updated[existingIndex] = newOrder;
        return updated;
      } else {
        // ✅ INSERIR: Adicionar no topo
        console.log('[UNIFIED] ➕ Adicionando pedido ao topo:', newOrder.id.slice(-6));
        return [newOrder, ...prev];
      }
    });
  }, []);

  // ============================================
  // FUNÇÃO: SINCRONIZAR VIA POLLING (FALLBACK)
  // ============================================

  const syncViaPolling = useCallback(async () => {
    try {
      console.log('[POLLING] 🔄 Sincronizando pedidos...');

      const res = await fetch('/api/admin/orders/pending', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      const polledOrders: Order[] = data.orders || [];
      console.log('[POLLING] 📦 Recebidos:', polledOrders.length, 'pedidos');

      // Detectar novos pedidos via polling (fallback se Realtime falhar)
      const newOrders = polledOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const isNew = orderDate > lastPollingCheckRef.current;
        const notNotified = !notifiedOrdersRef.current.has(order.id);
        const isPending = order.status === 'PENDING';
        return isNew && notNotified && isPending;
      });

      // Merge todos os pedidos do polling
      polledOrders.forEach(order => {
        mergeOrder(order, 'POLLING');
      });

      // Notificar novos (apenas se Realtime não notificou)
      newOrders.forEach(order => {
        if (!notifiedOrdersRef.current.has(order.id)) {
          notifyNewOrder(order);
        }
      });

      lastPollingCheckRef.current = new Date();

      // Verificar se deve parar o som após sincronização
      setTimeout(() => {
        setOrders(currentOrders => {
          const hasPending = currentOrders.some(o => o.status === 'PENDING');

          console.log('[POLLING] Verificando som:', {
            hasPending,
            isPlaying: soundRef.current.getIsPlaying(),
            pendingCount: currentOrders.filter(o => o.status === 'PENDING').length
          });

          if (!hasPending && soundRef.current.getIsPlaying()) {
            console.log('[POLLING] 🔕 Parando som - não há pedidos PENDING');
            soundRef.current.stopAlert();
            setIsPlaying(false);
          }

          return currentOrders;
        });
      }, 100);
    } catch (error) {
      console.error('[POLLING] ❌ Erro:', error);
    }
  }, [mergeOrder, notifyNewOrder]);

  // ============================================
  // EFEITO: CONECTAR REALTIME
  // ============================================

  useEffect(() => {
    if (!enabled) {
      console.log('[UNIFIED] ⏸️ Desabilitado');
      return;
    }

    // Verificar se Supabase está configurado
    if (!supabase) {
      console.warn('[UNIFIED] ⚠️ Supabase não configurado, Realtime desabilitado');
      return;
    }

    // Prevenir múltiplas conexões
    if (channelRef.current) {
      console.log('[UNIFIED] ⚠️ Canal já existe');
      return;
    }

    console.log('[UNIFIED] 🚀 Conectando Realtime...');

    const channel = supabase
      .channel('orders-unified')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Order'
        },
        async (payload) => {
          console.log('[REALTIME] 📨 INSERT recebido');

          const orderId = (payload.new as any).id;
          const completeOrder = await fetchCompleteOrder(orderId);

          if (!completeOrder) {
            console.error('[REALTIME] ❌ Falha ao buscar pedido completo');
            return;
          }

          console.log('[REALTIME] ✅ Pedido completo:', completeOrder.id.slice(-6));
          mergeOrder(completeOrder, 'INSERT');

          // Notificar apenas PENDING
          if (completeOrder.status === 'PENDING') {
            notifyNewOrder(completeOrder);
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
        async (payload) => {
          console.log('[REALTIME] 📨 UPDATE recebido');

          const orderId = (payload.new as any).id;
          const completeOrder = await fetchCompleteOrder(orderId);

          if (!completeOrder) {
            console.error('[REALTIME] ❌ Falha ao buscar pedido atualizado');
            return;
          }

          console.log('[REALTIME] ✅ Pedido atualizado:', completeOrder.id.slice(-6));

          // Verificar se status mudou de PENDING para outro ANTES de atualizar
          const wasPending = (payload.old as any)?.status === 'PENDING';
          const isStillPending = completeOrder.status === 'PENDING';
          const statusChanged = wasPending && !isStillPending;

          // Atualizar o pedido
          mergeOrder(completeOrder, 'UPDATE');

          // Parar som se o pedido não é mais PENDING
          if (statusChanged) {
            console.log('[REALTIME] 🔇 Status mudou de PENDING para', completeOrder.status);

            // Usar setTimeout para garantir que o estado foi atualizado
            setTimeout(() => {
              setOrders(currentOrders => {
                // Verificar se ainda há ALGUM pedido PENDING
                const hasPending = currentOrders.some(o => o.status === 'PENDING');

                console.log('[REALTIME] Verificando pedidos PENDING:', {
                  hasPending,
                  totalOrders: currentOrders.length,
                  pendingIds: currentOrders.filter(o => o.status === 'PENDING').map(o => o.id.slice(-6))
                });

                if (!hasPending && soundRef.current.getIsPlaying()) {
                  console.log('[REALTIME] 🔕 Parando som - não há mais pedidos PENDING');
                  soundRef.current.stopAlert();
                  setIsPlaying(false);
                }

                return currentOrders;
              });
            }, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] ✅ Conectado!');
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[REALTIME] ❌ Erro de conexão');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[UNIFIED] 🛑 Desconectando Realtime...');
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, fetchCompleteOrder, mergeOrder, notifyNewOrder]);

  // ============================================
  // EFEITO: POLLING FALLBACK
  // ============================================

  useEffect(() => {
    if (!enabled) return;

    console.log('[POLLING] 🚀 Iniciando fallback (10s)...');

    // Permissão para notificações
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }

    // Primeira sincronização imediata
    syncViaPolling();

    // Polling a cada 10 segundos (fallback se Realtime falhar)
    pollingIntervalRef.current = setInterval(() => {
      console.log('[POLLING] ⏰ Tick...');
      syncViaPolling();
    }, 10000);

    return () => {
      console.log('[POLLING] 🛑 Parando fallback...');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, syncViaPolling]);

  // ============================================
  // CLEANUP FINAL
  // ============================================

  useEffect(() => {
    return () => {
      soundRef.current.cleanup();
    };
  }, []);

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

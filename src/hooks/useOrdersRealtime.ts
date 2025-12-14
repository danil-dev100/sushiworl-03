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
  // FUNÇÃO: BUSCAR PEDIDO COMPLETO (com relações)
  // ============================================

  /**
   * Busca pedido completo do banco com todas as relações
   * O Realtime retorna apenas dados da tabela, sem joins
   */
  const fetchCompleteOrder = useCallback(async (orderId: string): Promise<Order | null> => {
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
        console.error('[REALTIME] Erro ao buscar pedido completo:', error);
        return null;
      }

      return data as Order;
    } catch (error) {
      console.error('[REALTIME] Erro ao buscar pedido:', error);
      return null;
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
    console.log(`[REALTIME] 🔄 Merge ${eventType}:`, newOrder.id.slice(-6));

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
        console.log('[REALTIME] ➕ Adicionando pedido ao topo:', newOrder.id.slice(-6));
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
      channelExists: channelRef.current !== null
    });

    if (!enabled) {
      console.log('[REALTIME] ⏸️ Realtime desabilitado');
      return;
    }

    // Se já existe canal, não criar outro
    if (channelRef.current) {
      console.log('[REALTIME] ⚠️ Canal já existe, reutilizando');
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
        async (payload) => {
          console.log('[REALTIME] 📨 Evento INSERT recebido');
          console.log('[REALTIME] Payload ID:', (payload.new as any).id?.slice(-6));

          // Buscar pedido completo com relações
          const orderId = (payload.new as any).id;
          const completeOrder = await fetchCompleteOrder(orderId);

          if (!completeOrder) {
            console.error('[REALTIME] ❌ Não foi possível buscar pedido completo');
            return;
          }

          console.log('[REALTIME] ✅ Pedido completo recebido:', completeOrder.id.slice(-6));
          mergeOrder(completeOrder, 'INSERT');

          // Notificar apenas se for PENDING
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
          console.log('[REALTIME] 📨 Evento UPDATE recebido');
          console.log('[REALTIME] Pedido ID:', (payload.new as any).id?.slice(-6));

          // Buscar pedido completo com relações
          const orderId = (payload.new as any).id;
          const completeOrder = await fetchCompleteOrder(orderId);

          if (!completeOrder) {
            console.error('[REALTIME] ❌ Não foi possível buscar pedido atualizado completo');
            return;
          }

          console.log('[REALTIME] ✅ Pedido atualizado recebido:', completeOrder.id.slice(-6));
          mergeOrder(completeOrder, 'UPDATE');

          // Parar som se pedido deixou de ser PENDING
          const wasPending = (payload.old as any)?.status === 'PENDING';
          const isStillPending = completeOrder.status === 'PENDING';

          if (wasPending && !isStillPending) {
            console.log('[REALTIME] 🔇 Pedido aceito/rejeitado, verificando som...');

            // Verificar se ainda há pedidos PENDING
            setOrders(currentOrders => {
              const hasPending = currentOrders.some(o =>
                o.status === 'PENDING' && o.id !== completeOrder.id
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
  }, [enabled, fetchCompleteOrder, mergeOrder, notifyNewOrder]);

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

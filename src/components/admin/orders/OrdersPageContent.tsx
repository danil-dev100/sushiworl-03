'use client';

import { useState, useCallback } from 'react';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrdersFilters } from '@/components/admin/orders/OrdersFilters';
import { TestOrderDialog } from '@/components/admin/orders/TestOrderDialog';
import { useOrdersPolling } from '@/hooks/useOrdersPolling';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { useSearchParams, useRouter } from 'next/navigation';
import { TooltipHelper } from '@/components/shared/TooltipHelper';
import { Volume2, VolumeX, Bell } from 'lucide-react';

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
  const { data, refetch, setData } = useOrdersPolling(initialData, 5000); // Polling a cada 5 segundos (backup)
  const [pendingOrders, setPendingOrders] = useState<string[]>([]);

  // Função para obter o nome do filtro atual
  const getCurrentFilterName = () => {
    const status = searchParams.get('status');
    switch (status) {
      case 'pending':
        return 'Pendentes';
      case 'confirmed':
        return 'Aceitos';
      case 'preparing':
        return 'Em Preparo';
      case 'delivering':
        return 'Em Entrega';
      case 'delivered':
        return 'Entregues';
      case 'cancelled':
        return 'Cancelados';
      case 'today':
        return 'Hoje';
      case 'all':
        return 'Todos';
      default:
        return 'Hoje'; // Default
    }
  };

  // Callback para novo pedido via WebSocket
  const handleNewOrder = useCallback((order: any) => {
    // Adicionar pedido ao topo da lista
    setData((prev: OrdersData) => ({
      orders: [order, ...prev.orders],
      counts: {
        ...prev.counts,
        all: prev.counts.all + 1,
        pending: prev.counts.pending + 1,
      },
    }));

    // Adicionar aos pendentes (som tocando)
    setPendingOrders(prev => [...prev, order.id]);

    // Redirecionar para pendentes se não estiver lá
    const currentStatus = searchParams.get('status');
    if (currentStatus !== 'pending' && currentStatus !== 'today' && currentStatus !== null) {
      router.push('/admin/pedidos?status=pending');
    }
  }, [setData, searchParams, router]);

  // Callback para pedido cancelado
  const handleOrderCancelled = useCallback((order: any) => {
    setData((prev: OrdersData) => ({
      orders: prev.orders.map(o => o.id === order.id ? { ...o, status: order.status } : o),
      counts: {
        ...prev.counts,
        pending: Math.max(0, prev.counts.pending - 1),
        cancelled: prev.counts.cancelled + 1,
      },
    }));
    setPendingOrders(prev => prev.filter(id => id !== order.id));
  }, [setData]);

  // Callback para pedido atualizado (incluindo aceito)
  const handleOrderUpdated = useCallback((order: any) => {
    setData((prev: OrdersData) => ({
      orders: prev.orders.map(o => o.id === order.id ? { ...o, ...order } : o),
      counts: prev.counts, // Recalcular se necessário
    }));

    // Se foi aceito/confirmado, remover dos pendentes
    if (order.status === 'CONFIRMED' || order.status === 'PREPARING') {
      setPendingOrders(prev => prev.filter(id => id !== order.id));
    }
  }, [setData]);

  // Conectar ao WebSocket
  const {
    isConnected,
    autoplayBlocked,
    isMuted,
    enableSound,
    toggleMute,
    stopOrderSound,
  } = useOrderSocket({
    onNewOrder: handleNewOrder,
    onOrderCancelled: handleOrderCancelled,
    onOrderUpdated: handleOrderUpdated,
  });

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

  // Parar som ao aceitar pedido
  const handleAcceptOrder = (orderId: string) => {
    stopOrderSound(orderId);
    setPendingOrders(prev => prev.filter(id => id !== orderId));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de autoplay bloqueado */}
      {autoplayBlocked && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              O navegador bloqueou a reprodução automática de som. Clique no botão para ativar notificações sonoras.
            </p>
          </div>
          <button
            onClick={enableSound}
            className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Ativar Som
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-4xl font-black text-[#FF6B00]">Pedidos</h1>
            <p className="mt-1 text-sm text-[#a16b45]">
              Gerencie os pedidos do restaurante
            </p>
          </div>
          <TooltipHelper text="Sistema completo de gestão de pedidos com filtros por status, busca e atualização automática em tempo real" />
        </div>
        <div className="flex items-center gap-3">
          {/* Status de conexão */}
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-[#a16b45]">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Controle de som */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg transition-colors ${
              isMuted
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            }`}
            title={isMuted ? 'Ativar som' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Indicador de pedidos pendentes com som */}
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <span className="animate-pulse h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                {pendingOrders.length} novo(s)
              </span>
            </div>
          )}

          <TestOrderDialog products={products} onOrderCreated={handleOrderCreated} />
          <TooltipHelper text="Crie um pedido de teste para testar o sistema de pedidos e entregas" />
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">Filtros e Pesquisa</span>
        <TooltipHelper text="Filtre pedidos por status, pesquise por cliente ou número do pedido, e selecione período específico" />
      </div>
      <OrdersFilters counts={data.counts} currentStatus={searchParams.get('status') || undefined} />

      {/* Orders Table */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
          Lista de Pedidos - {getCurrentFilterName()}
        </span>
        <TooltipHelper text="Tabela completa com todos os pedidos, seus status e informações detalhadas. Atualização automática a cada 5 segundos" />
      </div>
      <OrdersTable orders={data.orders} />
    </div>
  );
}


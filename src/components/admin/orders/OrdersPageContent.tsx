'use client';

import { useCallback, useMemo } from 'react';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrdersFilters } from '@/components/admin/orders/OrdersFilters';
import { TestOrderDialog } from '@/components/admin/orders/TestOrderDialog';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { useSearchParams, useRouter } from 'next/navigation';
import { TooltipHelper } from '@/components/shared/TooltipHelper';
import { Volume2, VolumeX } from 'lucide-react';

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

  // Usar o novo hook de polling com Web Audio API
  const {
    orders: pendingOrders,
    newOrdersCount,
    isPlaying,
    stopNotification,
    refreshOrders
  } = useOrderPolling(true);

  // Atualizar displayOrders quando o status mudar ou quando recebermos novos dados
  const currentStatus = searchParams.get('status');

  // Memoizar lista filtrada de pendentes do initialData para evitar recalcular a cada render
  const initialPendingOrders = useMemo(() => {
    return initialData.orders.filter(o => o.status === 'PENDING');
  }, [initialData.orders]);

  // Se estiver na aba "Pendentes", usar pendingOrders do polling
  // Se pendingOrders estiver vazio (primeira renderização), usar initialData filtrado por PENDING como fallback
  // Caso contrário, mostrar os pedidos do initialData
  const ordersToDisplay = useMemo(() => {
    if (currentStatus === 'pending') {
      const display = pendingOrders.length > 0 ? pendingOrders : initialPendingOrders;
      console.log('🖥️ [Component] Modo PENDENTES:', {
        pendingOrdersCount: pendingOrders.length,
        initialPendingCount: initialPendingOrders.length,
        using: pendingOrders.length > 0 ? 'pendingOrders (polling)' : 'initialPendingOrders (fallback)',
        displayCount: display.length
      });
      return display;
    } else {
      console.log('🖥️ [Component] Modo OUTROS:', {
        currentStatus,
        initialDataCount: initialData.orders.length
      });
      return initialData.orders;
    }
  }, [currentStatus, pendingOrders, initialPendingOrders, initialData.orders]);

  // Função para obter o nome do filtro atual
  const getCurrentFilterName = useCallback(() => {
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
  }, [searchParams]);

  const handleOrderCreated = useCallback(async () => {
    // Atualizar imediatamente após criar pedido
    await refreshOrders();

    // Recarregar a página completa para pegar os novos dados
    router.refresh();

    // Se não estiver na aba "Pendentes", redirecionar para lá para ver o novo pedido
    const currentStatus = searchParams.get('status');
    if (currentStatus !== 'pending') {
      setTimeout(() => {
        router.push('/admin/pedidos?status=pending');
      }, 500);
    }
  }, [refreshOrders, router, searchParams]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-4xl font-black text-[#FF6B00]">Pedidos</h1>
            <p className="mt-1 text-sm text-[#a16b45]">
              Gerencie os pedidos do restaurante - Atualização em tempo real (3s)
            </p>
          </div>
          <TooltipHelper text="Sistema completo de gestão de pedidos com notificação sonora e atualização automática a cada 3 segundos" />
        </div>
        <div className="flex items-center gap-3">
          {/* Controle de som */}
          <button
            onClick={stopNotification}
            disabled={!isPlaying}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 animate-pulse cursor-pointer hover:bg-orange-200'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-900/20 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={isPlaying ? 'Clique para parar o som' : 'Som desativado (sem pedidos pendentes)'}
          >
            {isPlaying ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {/* Indicador de novos pedidos */}
          {newOrdersCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 rounded-lg border-2 border-orange-500">
              <span className="animate-pulse h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {newOrdersCount} NOVO{newOrdersCount > 1 ? 'S' : ''}!
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
      <OrdersFilters counts={initialData.counts} currentStatus={searchParams.get('status') || undefined} />

      {/* Orders Table */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
          Lista de Pedidos - {getCurrentFilterName()}
        </span>
        <TooltipHelper text="Pedidos pendentes aparecem automaticamente com som contínuo. Atualização em tempo real a cada 3 segundos" />
      </div>
      <OrdersTable orders={ordersToDisplay} />
    </div>
  );
}


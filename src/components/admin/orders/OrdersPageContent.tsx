'use client';

import { useCallback, useEffect, useState } from 'react';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { ScheduledOrdersTable } from '@/components/admin/orders/ScheduledOrdersTable';
import { OrdersFilters } from '@/components/admin/orders/OrdersFilters';
import { TestOrderDialog } from '@/components/admin/orders/TestOrderDialog';
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
  isScheduled?: boolean;
  scheduledFor?: string | Date | null;
  checkoutAdditionalItems?: Array<{ name: string; price: number }> | null;
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
  newOrdersCount?: number;
  isPlaying?: boolean;
  stopNotification?: () => void;
  refreshOrders?: () => Promise<void>;
}

/**
 * Componente TOTALMENTE CONTROLADO pelo ClientWrapper
 *
 * - Recebe orders via initialData.orders
 * - Re-renderiza automaticamente quando initialData.orders muda
 * - NÃO mantém estado local de pedidos
 * - Renderiza diretamente a partir das props
 */
export function OrdersPageContent({
  initialData,
  products,
  newOrdersCount = 0,
  isPlaying = false,
  stopNotification = () => {},
  refreshOrders = async () => {}
}: OrdersPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ============================================
  // ESTADO LOCAL APENAS PARA DEBUG
  // ============================================
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [initialData.orders]);

  // ============================================
  // USAR DIRETAMENTE AS PROPS (SEM ESTADO LOCAL)
  // ============================================
  const ordersToDisplay = initialData.orders;

  console.log('🖥️ [OrdersPageContent] Renderizando:', {
    renderNumber: renderCount,
    ordersCount: ordersToDisplay.length,
    orderIds: ordersToDisplay.map(o => `${o.orderNumber}-${o.id.slice(-6)}`),
    isPlaying,
    newOrdersCount,
    timestamp: new Date().toISOString()
  });

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
      case 'scheduled':
        return 'Agendados';
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
              Gerencie os pedidos do restaurante - Atualização em tempo real
            </p>
          </div>
          <TooltipHelper text="Sistema completo de gestão de pedidos com notificação sonora e atualização automática via Realtime + Polling" />
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
        <TooltipHelper text="Pedidos pendentes aparecem automaticamente com som contínuo. Atualização em tempo real via Realtime + Polling fallback" />
      </div>

      {/* Renderizar tabela com key única para forçar re-render quando orders mudar */}
      {/* Se estiver visualizando pedidos agendados, usar tabela especializada */}
      {searchParams.get('status') === 'scheduled' ? (
        <ScheduledOrdersTable
          key={`scheduled-orders-${ordersToDisplay.length}-${ordersToDisplay[0]?.id || 'empty'}`}
          orders={ordersToDisplay}
        />
      ) : (
        <OrdersTable
          key={`orders-${ordersToDisplay.length}-${ordersToDisplay[0]?.id || 'empty'}`}
          orders={ordersToDisplay}
        />
      )}
    </div>
  );
}

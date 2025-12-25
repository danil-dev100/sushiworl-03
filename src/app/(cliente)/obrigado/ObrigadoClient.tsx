'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react';
import { trackEvent } from '@/lib/trackEvent';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  priceAtTime: number;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  status: OrderStatus;
  createdAt: Date;
  orderItems: OrderItem[];
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    label: 'Aguardando Confirmação',
    description: 'Seu pedido foi recebido e está aguardando confirmação do restaurante.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  CONFIRMED: {
    icon: CheckCircle,
    label: 'Pedido Confirmado',
    description: 'Seu pedido foi aceito e em breve iniciará a preparação!',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  PREPARING: {
    icon: Package,
    label: 'Em Preparação',
    description: 'Estamos preparando seu pedido com muito carinho.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  DELIVERING: {
    icon: Truck,
    label: 'Em Entrega',
    description: 'Seu pedido está a caminho!',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  DELIVERED: {
    icon: CheckCircle,
    label: 'Entregue',
    description: 'Seu pedido foi entregue. Bom apetite!',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  CANCELLED: {
    icon: XCircle,
    label: 'Cancelado',
    description: 'Infelizmente seu pedido foi cancelado. Entre em contato conosco para mais informações.',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
};

interface ObrigadoClientProps {
  order: Order;
}

export function ObrigadoClient({ order }: ObrigadoClientProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [purchaseTracked, setPurchaseTracked] = useState(false);

  useEffect(() => {
    // DISPARAR EVENTO DE PURCHASE (apenas uma vez) - AGORA COM DADOS VALIDADOS!
    const purchaseKey = `purchase_tracked_${order.id}`;
    const alreadyTracked = sessionStorage.getItem(purchaseKey);

    if (!alreadyTracked && !purchaseTracked) {
      console.log('[Obrigado] Disparando evento purchase (VALIDADO):', order.id);

      trackEvent('purchase', {
        orderId: order.id,
        value: order.total,
        currency: 'EUR',
        items: order.orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.priceAtTime,
        })),
      }).catch(error => {
        console.error('[Obrigado] Erro ao disparar evento:', error);
      });

      sessionStorage.setItem(purchaseKey, 'true');
      setPurchaseTracked(true);

      console.log('[Obrigado] Evento purchase disparado com sucesso');
    }
  }, [order, purchaseTracked]);

  // Polling de status em tempo real
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${order.id}/status`);
        const data = await response.json();

        if (data.success && data.order) {
          setCurrentStatus(data.order.status);
        }
      } catch (error) {
        console.error('Erro ao buscar status:', error);
      }
    };

    // Buscar imediatamente
    fetchStatus();

    // Polling a cada 5 segundos (apenas se não estiver entregue ou cancelado)
    let interval: NodeJS.Timeout | null = null;
    if (currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED') {
      interval = setInterval(fetchStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order.id, currentStatus]);

  // Formatar itens para exibição
  const itemsText = order.orderItems
    .map(item => `${item.quantity}x ${item.name}`)
    .join(', ');

  const StatusIcon = statusConfig[currentStatus].icon;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <main className="flex flex-1 justify-center py-10 px-4 sm:px-6 md:px-8">
        <div className="flex flex-col w-full max-w-2xl flex-1 items-center justify-center">
          <div className="w-full bg-white dark:bg-[#3a2a1d] rounded-xl shadow-lg p-6 sm:p-8 md:p-10 text-center flex flex-col gap-6">
            {/* Ícone de Sucesso */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 bg-[#FF6B00]/20 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-[#FF6B00]" />
              </div>
              <h1 className="text-[#FF6B00] tracking-tight text-3xl sm:text-4xl font-bold leading-tight px-4 pb-2 pt-2">
                Obrigado! Seu pedido foi confirmado.
              </h1>
              <p className="text-[#a16b45] dark:text-[#a1a1aa] text-base font-normal leading-normal pt-2 px-4 text-center max-w-md">
                Pedido #{order.orderNumber} registrado com sucesso. Você pode acompanhar o status abaixo.
              </p>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Resumo da Compra */}
            <div className="text-left w-full bg-[#f5f1e9] dark:bg-[#23170f] p-6 rounded-lg">
              <h4 className="text-[#333333] dark:text-[#f5f1e9] text-lg font-bold leading-tight tracking-[-0.015em] mb-4">
                Resumo da sua compra
              </h4>
              <p className="text-[#333333] dark:text-[#f5f1e9] text-base font-normal leading-normal mb-6">
                {itemsText}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between gap-x-6 py-1">
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-normal leading-normal">
                    ID do Pedido
                  </p>
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-medium leading-normal text-right">
                    {order.id}
                  </p>
                </div>
                <div className="flex justify-between gap-x-6 py-1">
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-normal leading-normal">
                    Subtotal
                  </p>
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-medium leading-normal text-right">
                    €{order.subtotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between gap-x-6 py-1">
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-normal leading-normal">
                    Taxa de Entrega
                  </p>
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-medium leading-normal text-right">
                    €{order.deliveryFee.toFixed(2)}
                  </p>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between gap-x-6 py-1">
                    <p className="text-green-600 dark:text-green-400 text-sm font-normal leading-normal">
                      Desconto
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium leading-normal text-right">
                      -€{order.discount.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="flex justify-between gap-x-6 py-1">
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-normal leading-normal">
                    Valor Total
                  </p>
                  <p className="text-[#FF6B00] text-sm font-bold leading-normal text-right">
                    €{order.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status do Pedido em Tempo Real */}
            <div className={`${statusConfig[currentStatus].bgColor} border border-gray-200 dark:border-gray-700 rounded-lg p-5`}>
              <div className="flex items-center gap-3 mb-2">
                <StatusIcon className={`w-6 h-6 ${statusConfig[currentStatus].color}`} />
                <h3 className={`font-bold text-base ${statusConfig[currentStatus].color}`}>
                  {statusConfig[currentStatus].label}
                </h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {statusConfig[currentStatus].description}
              </p>
              {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ⚡ Atualização automática a cada 5 segundos
                </p>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cardapio"
                className="flex min-w-[84px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#FF6B00] text-white text-base font-bold leading-normal tracking-[0.015em] w-full sm:w-auto hover:opacity-90 transition-opacity"
              >
                <span className="truncate">Fazer novo pedido</span>
              </Link>
              <Link
                href="/"
                className="flex min-w-[84px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#FF6B00]/20 text-[#FF6B00] text-base font-bold leading-normal tracking-[0.015em] w-full sm:w-auto hover:bg-[#FF6B00]/30 transition-colors"
              >
                <span className="truncate">Voltar à página inicial</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

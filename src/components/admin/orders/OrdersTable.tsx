'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Check,
  Clock,
  Printer,
  X,
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

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

type OrdersTableProps = {
  orders: Order[];
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  PENDING: {
    label: 'Pendente',
    badge: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-yellow-400',
  },
  CONFIRMED: {
    label: 'Confirmado',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
  },
  PREPARING: {
    label: 'Preparando',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  DELIVERING: {
    label: 'Em entrega',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
  },
  DELIVERED: {
    label: 'Entregue',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelado',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
  },
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });
}

function formatTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAddress(address?: Record<string, unknown> | null) {
  if (!address || Object.keys(address).length === 0) {
    return 'Endereço não informado';
  }

  const snapshot = address as Record<string, string>;
  if (snapshot.fullAddress) return snapshot.fullAddress;

  const parts = [
    snapshot.street,
    snapshot.number,
    snapshot.neighborhood,
    snapshot.city,
    snapshot.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return parts || 'Endereço não informado';
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter();
  const [localOrders, setLocalOrders] = useState(orders);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasOrders = localOrders.length > 0;

  const handleStatusUpdate = (orderId: string, status: string) => {
    setPendingAction(`${status}:${orderId}`);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || 'Falha ao atualizar pedido');
        }

        const updatedOrder: Order = await response.json();

        setLocalOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, ...updatedOrder } : order
          )
        );

        toast.success(
          status === 'CONFIRMED'
            ? 'Pedido confirmado com sucesso!'
            : status === 'CANCELLED'
            ? 'Pedido cancelado com sucesso!'
            : 'Status atualizado.'
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar pedido. Tente novamente.'
        );
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handlePrint = (orderId: string) => {
    setPendingAction(`print:${orderId}`);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/orders/${orderId}/print`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || 'Falha ao registrar impressão');
        }

        toast.success('Pedido enviado para impressão (simulado).');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Erro ao imprimir pedido. Tente novamente.'
        );
      } finally {
        setPendingAction(null);
      }
    });
  };

  const canConfirm = (status: string) => status === 'PENDING';
  const canCancel = (status: string) =>
    status === 'PENDING' || status === 'CONFIRMED';

  const statusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['PENDING'];
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}
      >
        <span className={`h-2 w-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      {hasOrders ? (
        <div className="grid grid-cols-1 gap-4 @container md:grid-cols-2 xl:grid-cols-3">
          {localOrders.map((order) => (
            <article
              key={order.id}
              className="flex h-full flex-col gap-4 rounded-lg border border-[#ead9cd] bg-white p-4 shadow-sm transition hover:shadow-lg dark:border-[#4a3c30] dark:bg-[#23170f]"
            >
              <header className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#a16b45]">Pedido</p>
                  <p className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
                    #SW{order.orderNumber.toString().padStart(5, '0')}
                  </p>
                </div>
                {statusBadge(order.status)}
              </header>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#a16b45]">
                    Cliente
                  </p>
                  <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                    {order.customerName}
                  </p>
                  <div className="mt-1 space-y-1 text-xs text-[#a16b45]">
                    {order.customerPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                    {order.customerEmail && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{order.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#a16b45]">
                    Total
                  </p>
                  <p className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#a16b45]">
                    <Clock className="h-3 w-3" />
                    {formatTime(order.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-md bg-[#f5f1e9] p-3 text-sm dark:bg-[#2a1e14]">
                <p className="text-xs font-semibold uppercase text-[#a16b45]">
                  Itens
                </p>
                <ul className="space-y-2">
                  {order.orderItems.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                          {item.quantity}x {item.name || item.product?.name}
                        </p>
                        {item.selectedOptions && (
                          <p className="text-xs text-[#a16b45]">
                            Opções: {JSON.stringify(item.selectedOptions)}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-[#333333] dark:text-[#f5f1e9]">
                        {formatCurrency(item.priceAtTime * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {order.deliveryAddress && (
                <div className="rounded-md bg-[#fdf9f5] p-3 text-xs text-[#a16b45] dark:bg-[#1d140c] dark:text-[#dfc7b4]">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                        {order.deliveryArea?.name || 'Entrega'}
                      </p>
                      <p>{formatAddress(order.deliveryAddress)}</p>
                    </div>
                  </div>
                </div>
              )}

              {order.observations && (
                <div className="rounded-md bg-[#fff2e8] p-3 text-xs text-[#a16b45] dark:bg-[#2b160a] dark:text-[#f3c7a3]">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{order.observations}</p>
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                  disabled={
                    !canConfirm(order.status) ||
                    isPending ||
                    pendingAction === `CONFIRMED:${order.id}`
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {pendingAction === `CONFIRMED:${order.id}` ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Aceitar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                  variant="destructive"
                  disabled={
                    !canCancel(order.status) ||
                    isPending ||
                    pendingAction === `CANCELLED:${order.id}`
                  }
                  className="flex-1"
                >
                  {pendingAction === `CANCELLED:${order.id}` ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Recusar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handlePrint(order.id)}
                  variant="outline"
                  disabled={
                    isPending || pendingAction === `print:${order.id}`
                  }
                  className="flex-1 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
                >
                  {pendingAction === `print:${order.id}` ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Imprimindo...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </>
                  )}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-[#ead9cd] dark:border-[#4a3c30]">
          <div className="text-center">
            <p className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
              Nenhum pedido encontrado
            </p>
            <p className="mt-1 text-sm text-[#a16b45]">
              Use o botão &quot;Pedido teste&quot; para gerar pedidos de
              demonstração ou aguarde novos pedidos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


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
  Trash2,
  Square,
  CheckSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

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
  globalOptions?: Array<{ optionId: string; optionName: string; choices: Array<{ choiceId: string; choiceName: string; price: number; quantity?: number }> }> | null;
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

function formatSelectedOptions(options?: Record<string, unknown> | null): string | null {
  if (!options || Object.keys(options).length === 0) {
    return null;
  }

  try {
    // Se for um array de opções (estrutura do carrinho)
    if (Array.isArray(options)) {
      return options
        .flatMap((opt: any) => {
          if (opt.choices && Array.isArray(opt.choices)) {
            return opt.choices.map((c: any) => {
              const qty = c.quantity ? `${c.quantity}x ` : '';
              return `${qty}${c.choiceName || c.name}`;
            });
          }
          return opt.choiceName || opt.name || '';
        })
        .filter(Boolean)
        .join(', ');
    }

    // Se for um array de choices
    if (Array.isArray(options.choices)) {
      return options.choices
        .map((choice: any) => {
          const qty = choice.quantity ? `${choice.quantity}x ` : '';
          return `${qty}${choice.choiceName || choice.name}`;
        })
        .filter(Boolean)
        .join(', ');
    }

    // Se for um objeto com price e choiceId
    if (options.price !== undefined && options.choiceId) {
      return `${options.choiceName || ''} (+${formatCurrency(Number(options.price))})`;
    }

    // Tentar extrair informações úteis do objeto
    const entries = Object.entries(options);
    const formatted = entries
      .filter(([key]) => !key.startsWith('_') && key !== 'price' && key !== 'choiceId')
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          const obj = value as Record<string, any>;
          if (obj.choiceName) return obj.choiceName;
          if (obj.name) return obj.name;
          // Não retornar [object Object]
          return null;
        }
        if (typeof value === 'string') return value;
        return null;
      })
      .filter(Boolean)
      .join(', ');

    return formatted || null;
  } catch (error) {
    console.error('Erro ao formatar opções:', error);
    return null;
  }
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter();
  const [localOrders, setLocalOrders] = useState(orders);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const hasOrders = localOrders.length > 0;

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(localOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedOrders.length === 0) return;

    setPendingAction('delete-selected');
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/orders/batch-delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderIds: selectedOrders }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || 'Falha ao deletar pedidos');
        }

        setLocalOrders(prev => prev.filter(order => !selectedOrders.includes(order.id)));
        setSelectedOrders([]);
        toast.success(`${selectedOrders.length} pedido(s) deletado(s) com sucesso!`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Erro ao deletar pedidos. Tente novamente.'
        );
      } finally {
        setPendingAction(null);
      }
    });
  };

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

  const handlePrint = async (orderId: string) => {
    setPendingAction(`print:${orderId}`);

    try {
      // Buscar dados do pedido
      const orderResponse = await fetch(`/api/admin/orders/${orderId}`);
      if (!orderResponse.ok) {
        throw new Error('Erro ao carregar pedido');
      }
      const orderData = await orderResponse.json();

      // Buscar configurações de impressão
      const configResponse = await fetch('/api/admin/settings/printer');
      const printerConfig = await configResponse.json();

      // Buscar configurações da impressora
      const settingsResponse = await fetch('/api/admin/settings');
      const settings = await settingsResponse.json();

      // Buscar dados da empresa
      const companyResponse = await fetch('/api/admin/settings/company-info');
      const companyInfo = await companyResponse.json();

      // Gerar janela de impressão usando o OrderReceiptPreview
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error('Bloqueador de pop-ups impediu a impressão');
        setPendingAction(null);
        return;
      }

      // Importar dinâmicamente o OrderReceiptPreview para gerar o HTML
      const { renderOrderReceipt } = await import('@/lib/print-utils');
      const vatConfig = {
        vatType: settings.vatType || 'INCLUSIVE',
        vatRate: settings.vatRate || 0
      };
      const receiptHTML = renderOrderReceipt(orderData, companyInfo, printerConfig, settings.paperSize || '80mm', vatConfig);

      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      // Registrar impressão
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

          toast.success('Pedido enviado para impressão.');
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
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao gerar impressão'
      );
      setPendingAction(null);
    }
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
    <div className="rounded-xl border border-[#ead9cd] bg-white p-3 sm:p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      {hasOrders && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Checkbox
              checked={selectedOrders.length === localOrders.length && localOrders.length > 0}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label
              htmlFor="select-all"
              className="text-xs sm:text-sm font-medium text-[#333333] dark:text-[#f5f1e9]"
            >
              <span className="hidden sm:inline">Selecionar todos </span>
              <span className="sm:hidden">Todos </span>
              ({selectedOrders.length}/{localOrders.length})
            </label>
          </div>
          {selectedOrders.length > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              size="sm"
              disabled={isPending || pendingAction === 'delete-selected'}
              className="w-full sm:w-auto"
            >
              {pendingAction === 'delete-selected' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar ({selectedOrders.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}
      {hasOrders ? (
        <div className="grid grid-cols-1 gap-4 @container md:grid-cols-2 xl:grid-cols-3">
          {localOrders.map((order) => (
            <article
              key={order.id}
              className="flex h-full flex-col gap-4 rounded-lg border border-[#ead9cd] bg-white p-4 shadow-sm transition hover:shadow-lg dark:border-[#4a3c30] dark:bg-[#23170f]"
            >
              <header className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm text-[#a16b45]">Pedido</p>
                    <p className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
                      #SW{order.orderNumber.toString().padStart(5, '0')}
                    </p>
                  </div>
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
                  {order.orderItems.map((item) => {
                    const formattedOptions = formatSelectedOptions(item.selectedOptions);
                    return (
                      <li key={item.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                            {item.quantity}x {item.name || item.product?.name}
                          </p>
                          {formattedOptions && (
                            <p className="text-xs text-[#a16b45] mt-1">
                              <span className="font-semibold">Opções:</span> {formattedOptions}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9] whitespace-nowrap">
                          {formatCurrency(item.priceAtTime * item.quantity)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                {(order.checkoutAdditionalItems && order.checkoutAdditionalItems.length > 0) || (order.globalOptions && order.globalOptions.length > 0) ? (
                  <div className="mt-3 pt-2 border-t border-[#ead9cd] dark:border-[#4a3c30]">
                    <p className="text-xs font-semibold uppercase text-[#a16b45] mb-1">
                      Adicionais
                    </p>
                    <ul className="space-y-1">
                      {order.globalOptions?.map((opt) => (
                        opt.choices.map((choice, idx) => (
                          <li key={`${opt.optionId}-${choice.choiceId}-${idx}`} className="flex items-center justify-between text-xs">
                            <span className="text-[#333333] dark:text-[#f5f1e9]">
                              {choice.quantity ? `${choice.quantity}x ` : ''}{opt.optionName}: {choice.choiceName}
                            </span>
                            <span className="text-[#a16b45]">
                              {choice.price > 0 ? formatCurrency(choice.price * (choice.quantity || 1)) : 'Grátis'}
                            </span>
                          </li>
                        ))
                      ))}
                      {order.checkoutAdditionalItems?.map((item, idx) => (
                        <li key={`checkout-${idx}`} className="flex items-center justify-between text-xs">
                          <span className="text-[#333333] dark:text-[#f5f1e9]">{item.name}</span>
                          <span className="text-[#a16b45]">{formatCurrency(item.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
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


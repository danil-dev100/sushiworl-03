'use client';

import { X, Check, Printer, MapPin, CreditCard, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderDetailModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onPrint: (orderId: string) => void;
}

const paymentMethodLabels = {
  CREDIT_CARD: 'Cartão de Crédito',
  CASH: 'Dinheiro',
};

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onPrint,
}: OrderDetailModalProps) {
  if (!isOpen) return null;

  const isPending = order.status === 'PENDING';
  const address = order.deliveryAddress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-[#2a1e14]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
          <div>
            <h2 className="text-2xl font-bold text-[#FF6B00]">
              Detalhes do Pedido
            </h2>
            <p className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9]">
              #SW{order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#f5f1e9] dark:hover:bg-[#23170f]"
          >
            <X className="h-5 w-5 text-[#a16b45]" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Customer Info */}
          <div className="space-y-3 rounded-lg border border-[#ead9cd] p-4 dark:border-[#4a3c30]">
            <h3 className="font-bold text-[#FF6B00]">Informações do Cliente</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#a16b45]">Nome:</p>
                <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  {order.customerName}
                </p>
              </div>
              <div>
                <p className="text-[#a16b45]">Telefone:</p>
                <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  {order.customerPhone}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[#a16b45]">Email:</p>
                <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  {order.customerEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-3 rounded-lg border border-[#ead9cd] p-4 dark:border-[#4a3c30]">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF6B00]" />
              <h3 className="font-bold text-[#FF6B00]">Endereço de Entrega</h3>
            </div>
            <p className="text-sm text-[#333333] dark:text-[#f5f1e9]">
              {address.street}, {address.number}
              {address.complement && ` - ${address.complement}`}
              <br />
              {address.neighborhood}, {address.city}
              <br />
              {address.postalCode}
            </p>
            {order.deliveryArea && (
              <p className="text-sm text-[#a16b45]">
                Área: {order.deliveryArea.name}
              </p>
            )}
          </div>

          {/* Order Items */}
          <div className="space-y-3 rounded-lg border border-[#ead9cd] p-4 dark:border-[#4a3c30]">
            <h3 className="font-bold text-[#FF6B00]">Itens do Pedido</h3>
            <div className="space-y-2">
              {order.orderItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-[#333333] dark:text-[#f5f1e9]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                    € {(item.priceAtTime * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Total */}
          <div className="space-y-3 rounded-lg border border-[#ead9cd] p-4 dark:border-[#4a3c30]">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#FF6B00]" />
              <h3 className="font-bold text-[#FF6B00]">Pagamento</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#a16b45]">Subtotal</span>
                <span className="text-[#333333] dark:text-[#f5f1e9]">
                  € {order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a16b45]">Taxa de Entrega</span>
                <span className="text-[#333333] dark:text-[#f5f1e9]">
                  € {order.deliveryFee.toFixed(2)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>- € {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#ead9cd] pt-2 font-bold dark:border-[#4a3c30]">
                <span className="text-[#333333] dark:text-[#f5f1e9]">Total</span>
                <span className="text-[#FF6B00]">€ {order.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <p className="text-[#a16b45]">
                Forma de pagamento:{' '}
                <span className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  {paymentMethodLabels[order.paymentMethod as keyof typeof paymentMethodLabels]}
                </span>
              </p>
              {order.paymentMethod === 'CASH' && order.changeFor && (
                <p className="text-[#a16b45]">
                  Troco para: € {order.changeFor.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Observations */}
          {order.observations && (
            <div className="space-y-3 rounded-lg border border-[#ead9cd] p-4 dark:border-[#4a3c30]">
              <h3 className="font-bold text-[#FF6B00]">Observações</h3>
              <p className="text-sm text-[#333333] dark:text-[#f5f1e9]">
                {order.observations}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-[#a16b45]">
            <Clock className="h-4 w-4" />
            <span>
              Pedido realizado há{' '}
              {formatDistanceToNow(new Date(order.createdAt), {
                addSuffix: false,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
          {isPending ? (
            <>
              <button
                onClick={() => {
                  onAccept(order.id);
                  onClose();
                }}
                className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700"
              >
                <Check className="mx-auto h-5 w-5" />
                Aceitar Pedido
              </button>
              <button
                onClick={() => {
                  onReject(order.id);
                  onClose();
                }}
                className="w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                <X className="mx-auto h-5 w-5" />
                Recusar Pedido
              </button>
            </>
          ) : (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-lg bg-gray-300 py-3 text-sm font-bold text-gray-600"
            >
              Pedido {order.status === 'CONFIRMED' ? 'Aceito' : 'Processado'}
            </button>
          )}
          <button
            onClick={() => {
              onPrint(order.id);
            }}
            className="w-full rounded-lg bg-[#FF6B00] py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            <Printer className="mx-auto h-5 w-5" />
            Imprimir Pedido
          </button>
        </div>
      </div>
    </div>
  );
}


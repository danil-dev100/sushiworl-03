'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, Printer, Eye } from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: Date;
  orderItems: any[];
  deliveryArea: { name: string } | null;
  deliveryAddress: any;
  paymentMethod: string;
  observations: string | null;
}

interface OrdersTableProps {
  orders: Order[];
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  DELIVERING: 'Em Entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja recusar este pedido?')) return;

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao recusar pedido:', error);
    }
  };

  const handlePrintOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedido-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao imprimir pedido:', error);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 @container md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => {
          const isPending = order.status === 'PENDING';
          const isConfirmed = order.status === 'CONFIRMED';
          
          return (
            <div
              key={order.id}
              className={`flex cursor-pointer flex-col gap-4 rounded-lg border-2 bg-white p-4 shadow-lg transition-all hover:shadow-xl dark:bg-[#2a1e14] ${
                isPending ? 'border-[#FF6B00]' : 'border-[#ead9cd] dark:border-[#4a3c30]'
              }`}
              onClick={() => handleViewOrder(order)}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#a16b45]">ID do Pedido</p>
                  <p className="font-bold text-[#333333] dark:text-[#f5f1e9]">
                    #SW{order.orderNumber}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusColors[order.status as keyof typeof statusColors]
                  }`}
                >
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-[#a16b45]">Cliente</p>
                  <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                    {order.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#a16b45]">Total</p>
                  <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                    € {order.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#a16b45]">Hora</p>
                  <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                    {formatDistanceToNow(new Date(order.createdAt), {
                      addSuffix: false,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {isPending && (
                  <>
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="flex-1 rounded-md bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      title="Aceitar"
                    >
                      <Check className="mx-auto h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRejectOrder(order.id)}
                      className="flex-1 rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      title="Recusar"
                    >
                      <X className="mx-auto h-4 w-4" />
                    </button>
                  </>
                )}
                {isConfirmed && (
                  <button
                    disabled
                    className="flex-1 rounded-md bg-gray-300 py-2 text-sm font-semibold text-gray-600 cursor-not-allowed"
                  >
                    Aceito
                  </button>
                )}
                <button
                  onClick={() => handlePrintOrder(order.id)}
                  className="flex-1 rounded-md bg-[#FF6B00] py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  title="Imprimir"
                >
                  <Printer className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
          onPrint={handlePrintOrder}
        />
      )}
    </>
  );
}


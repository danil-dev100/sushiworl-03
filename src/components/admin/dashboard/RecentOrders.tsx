'use client';

import { formatPrice, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
}

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <h2 className="text-xl font-bold text-[#FF6B00]">Pedidos Recentes</h2>
      
      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-[#a16b45]">Nenhum pedido recente</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border border-[#ead9cd] p-4 dark:border-[#4a3c30]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#333333] dark:text-[#f5f1e9]">
                    #{order.orderNumber}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#a16b45]">{order.customerName}</p>
                <p className="text-xs text-[#a16b45]">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#FF6B00]">
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

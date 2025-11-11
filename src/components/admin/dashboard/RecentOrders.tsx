'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye } from 'lucide-react';

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

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  DELIVERING: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  DELIVERING: 'Em Entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#FF6B00]">Pedidos Recentes</h2>
        <Link
          href="/admin/pedidos"
          className="text-sm font-semibold text-[#FF6B00] hover:underline"
        >
          Ver todos
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-[#ead9cd] dark:border-[#4a3c30]">
            <tr>
              <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#a16b45]">
                Pedido
              </th>
              <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#a16b45]">
                Cliente
              </th>
              <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#a16b45]">
                Total
              </th>
              <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#a16b45]">
                Status
              </th>
              <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#a16b45]">
                Há
              </th>
              <th className="py-3 text-left text-xs font-bold uppercase tracking-wider text-[#a16b45]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ead9cd] dark:divide-[#4a3c30]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[#f5f1e9] dark:hover:bg-[#23170f]">
                <td className="whitespace-nowrap py-4 text-sm font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  #{order.orderNumber}
                </td>
                <td className="whitespace-nowrap py-4 text-sm text-[#333333] dark:text-[#f5f1e9]">
                  {order.customerName}
                </td>
                <td className="whitespace-nowrap py-4 text-sm font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  € {order.total.toFixed(2)}
                </td>
                <td className="whitespace-nowrap py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColors[order.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </span>
                </td>
                <td className="whitespace-nowrap py-4 text-sm text-[#a16b45]">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: false,
                    locale: ptBR,
                  })}
                </td>
                <td className="whitespace-nowrap py-4">
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6B00] hover:underline"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


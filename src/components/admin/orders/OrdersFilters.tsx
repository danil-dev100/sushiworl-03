'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface OrdersFiltersProps {
  counts: {
    all: number;
    pending: number;
    confirmed: number;
    preparing: number;
    delivering: number;
    delivered: number;
    cancelled: number;
  };
  currentStatus?: string;
}

export function OrdersFilters({ counts, currentStatus = 'today' }: OrdersFiltersProps) {
  const searchParams = useSearchParams();

  const filters = [
    { label: 'Hoje', value: 'today', count: counts.all },
    { label: 'Pendentes', value: 'pending', count: counts.pending },
    { label: 'Aceitos', value: 'confirmed', count: counts.confirmed },
    { label: 'Todos', value: 'all', count: counts.all },
  ];

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(name, value);
    return params.toString();
  };

  return (
    <div className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-white p-1 dark:bg-[#2a1e14]">
      {filters.map((filter) => {
        const isActive = currentStatus === filter.value || (!currentStatus && filter.value === 'today');
        
        return (
          <Link
            key={filter.value}
            href={`/admin/pedidos?${createQueryString('status', filter.value)}`}
            className={`flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-center text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-[#333333] hover:bg-[#f5f1e9] dark:text-[#f5f1e9] dark:hover:bg-[#23170f]'
            }`}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                isActive ? 'bg-white/20' : 'bg-[#f5f1e9] dark:bg-[#23170f]'
              }`}>
                {filter.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}


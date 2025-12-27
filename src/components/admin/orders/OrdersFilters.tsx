'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCallback } from 'react';

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

export function OrdersFilters({ counts, currentStatus }: OrdersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback((status?: string, search?: string, date?: string) => {
    const params = new URLSearchParams();
    
    if (status) {
      params.set('status', status);
    }
    if (search) {
      params.set('search', search);
    }
    if (date) {
      params.set('date', date);
    }

    const queryString = params.toString();
    router.push(`/admin/pedidos${queryString ? `?${queryString}` : ''}`);
  }, [router]);

  const handleStatusClick = (status: string) => {
    const currentSearch = searchParams.get('search') || '';
    const currentDate = searchParams.get('date') || '';
    // Se clicar em "Todos", define status=all e remove filtro de data
    if (status === 'all') {
      updateFilters('all', currentSearch || undefined, undefined);
    } else if (status === 'today') {
      // Para "Hoje", não passa status na URL (será tratado como padrão)
      updateFilters(undefined, currentSearch || undefined, currentDate || undefined);
    } else {
      updateFilters(status, currentSearch || undefined, currentDate || undefined);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const date = formData.get('date') as string;
    const currentStatus = searchParams.get('status') || '';
    updateFilters(currentStatus || undefined, search || undefined, date || undefined);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      today: 'Hoje',
      pending: 'Pendentes',
      confirmed: 'Aceitos',
      all: 'Todos',
    };
    return labels[status] || status;
  };

  const getStatusCount = (status: string) => {
    if (status === 'today') return counts.all;
    if (status === 'pending') return counts.pending;
    if (status === 'confirmed') return counts.confirmed;
    if (status === 'all') return counts.all;
    return 0;
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 rounded-lg bg-white p-4 dark:bg-[#2a1e14] md:flex-row md:items-center">
      {/* Search */}
      <div className="relative flex-grow">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a16b45]" />
        <input
          type="text"
          name="search"
          placeholder="Buscar por ID, cliente..."
          defaultValue={searchParams.get('search') || ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="w-full rounded-md border border-[#ead9cd] bg-[#f5f1e9] py-2 pl-10 pr-4 text-sm text-[#333333] placeholder-[#a16b45] focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
        />
      </div>

      {/* Date Filter */}
      <input
        type="date"
        name="date"
        defaultValue={searchParams.get('date') || ''}
        onChange={(e) => {
          const form = e.currentTarget.form;
          if (form) {
            const search = (form.elements.namedItem('search') as HTMLInputElement)?.value || '';
            const currentStatus = searchParams.get('status') || '';
            updateFilters(currentStatus || undefined, search || undefined, e.target.value || undefined);
          }
        }}
        className="rounded-md border border-[#ead9cd] bg-[#f5f1e9] px-4 py-2 text-sm text-[#333333] focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
      />

      {/* Status Filters - Grid 2x2 no mobile, linha no desktop */}
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-shrink-0 md:items-center md:gap-2 rounded-lg bg-[#f5f1e9] p-1 dark:bg-[#23170f]">
        <button
          type="button"
          onClick={() => handleStatusClick('today')}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[48px] md:min-h-0 md:py-1.5 md:px-4 ${
            !currentStatus || currentStatus === ''
              ? 'bg-[#FF6B00] text-white shadow-sm'
              : 'text-[#333333] hover:bg-white dark:text-[#f5f1e9] dark:hover:bg-[#2a1e14]'
          }`}
        >
          Hoje {getStatusCount('today') > 0 && `(${getStatusCount('today')})`}
        </button>
        <button
          type="button"
          onClick={() => handleStatusClick('pending')}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[48px] md:min-h-0 md:py-1.5 md:px-4 ${
            currentStatus === 'pending'
              ? 'bg-[#FF6B00] text-white shadow-sm'
              : 'text-[#333333] hover:bg-white dark:text-[#f5f1e9] dark:hover:bg-[#2a1e14]'
          }`}
        >
          Pendentes {counts.pending > 0 && `(${counts.pending})`}
        </button>
        <button
          type="button"
          onClick={() => handleStatusClick('confirmed')}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[48px] md:min-h-0 md:py-1.5 md:px-4 ${
            currentStatus === 'confirmed'
              ? 'bg-[#FF6B00] text-white shadow-sm'
              : 'text-[#333333] hover:bg-white dark:text-[#f5f1e9] dark:hover:bg-[#2a1e14]'
          }`}
        >
          Aceitos {counts.confirmed > 0 && `(${counts.confirmed})`}
        </button>
        <button
          type="button"
          onClick={() => handleStatusClick('all')}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[48px] md:min-h-0 md:py-1.5 md:px-4 ${
            currentStatus === 'all'
              ? 'bg-[#FF6B00] text-white shadow-sm'
              : 'text-[#333333] hover:bg-white dark:text-[#f5f1e9] dark:hover:bg-[#2a1e14]'
          }`}
        >
          Todos {counts.all > 0 && `(${counts.all})`}
        </button>
      </div>
    </form>
  );
}

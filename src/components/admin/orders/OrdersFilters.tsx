'use client';

import { Search } from 'lucide-react';

export function OrdersFilters() {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 dark:bg-[#2a1e14] md:flex-row md:items-center">
      {/* Search */}
      <div className="relative flex-grow">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a16b45]" />
        <input
          type="text"
          placeholder="Buscar por ID, cliente..."
          className="w-full rounded-md border-[#ead9cd] bg-[#f5f1e9] py-2 pl-10 pr-4 text-sm text-[#333333] placeholder-[#a16b45] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-[#f5f1e9] p-1 dark:bg-[#23170f]">
        <button className="flex-1 whitespace-nowrap rounded-md bg-[#FF6B00] px-4 py-1.5 text-sm font-semibold text-white shadow-sm">
          Hoje
        </button>
        <button className="flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-[#333333] hover:bg-white dark:text-[#f5f1e9] dark:hover:bg-[#2a1e14]">
          Pendentes
        </button>
        <button className="flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-[#333333] hover:bg-white dark:text-[#f5f1e9] dark:hover:bg-[#2a1e14]">
          Aceitos
        </button>
        <button className="flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-[#333333] hover:bg-white dark:text-[#f5f1e9] dark:hover:bg-[#2a1e14]">
          Todos
        </button>
      </div>
    </div>
  );
}

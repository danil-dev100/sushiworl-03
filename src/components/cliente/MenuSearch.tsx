'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MenuSearchProps {
  onSearch: (term: string) => void;
}

export function MenuSearch({ onSearch }: MenuSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 250);
  }, [onSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch('');
  }, [onSearch]);

  return (
    <div className="sticky top-0 z-10 bg-[#f5f1e9] pb-4 pt-4 dark:bg-[#23170f]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b5e3c]" />
        <Input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border-[#ead9cd] bg-white py-3 pl-10 pr-12 text-[#333333] placeholder-[#8b5e3c] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#2a1e14] dark:text-[#f5f1e9]"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
          >
            <X className="h-5 w-5 text-[#8b5e3c] hover:text-[#FF6B00]" />
          </Button>
        )}
      </div>
      {searchTerm && (
        <p className="mt-2 text-sm text-[#8b5e3c]">
          Buscando por: <strong className="text-[#FF6B00]">{searchTerm}</strong>
        </p>
      )}
    </div>
  );
}


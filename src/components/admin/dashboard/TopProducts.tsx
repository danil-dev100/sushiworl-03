'use client';

import { Trophy } from 'lucide-react';

interface Product {
  name: string;
  orderCount: number;
}

interface TopProductsProps {
  products: Product[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[#FF6B00]" />
        <h2 className="text-xl font-bold text-[#FF6B00]">Top Produtos</h2>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border border-[#ead9cd] p-4 dark:border-[#4a3c30]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B00] text-sm font-bold text-white">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  {product.name}
                </p>
                <p className="text-sm text-[#a16b45]">{product.orderCount} vendas</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


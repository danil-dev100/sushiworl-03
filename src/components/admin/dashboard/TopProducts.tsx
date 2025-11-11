'use client';

interface Product {
  name: string;
  orderCount: number;
}

interface TopProductsProps {
  products: Product[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <h2 className="text-xl font-bold text-[#FF6B00]">Produtos Mais Vendidos</h2>
      
      <div className="mt-6 space-y-4">
        {products.length === 0 ? (
          <p className="text-center text-[#a16b45]">Nenhum produto vendido ainda</p>
        ) : (
          products.map((product, index) => (
            <div
              key={product.name}
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
                  <p className="text-xs text-[#a16b45]">
                    {product.orderCount} vendas
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

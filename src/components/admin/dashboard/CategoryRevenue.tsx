'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  revenue: number;
  orderCount: number;
}

const COLORS = ['#FF6B00', '#FF8533', '#FFA066', '#FFBB99', '#FFD6CC', '#FFE5DB'];

export default function CategoryRevenue() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
  }, []);

  const fetchCategoryData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/dashboard?period=30days');
      if (response.ok) {
        const dashboardData = await response.json();
        if (dashboardData.categoryRevenue && dashboardData.categoryRevenue.length > 0) {
          setData(dashboardData.categoryRevenue);
        }
      }
    } catch (error) {
      console.error('[CategoryRevenue] Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ead9cd] border-t-[#FF6B00]"></div>
          <span className="text-sm text-[#a16b45] dark:text-[#d4a574]">Carregando receita por categoria...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <div className="mb-2 text-4xl">📊</div>
        <p className="text-center text-sm text-[#a16b45] dark:text-[#d4a574]">
          Nenhuma receita por categoria ainda
        </p>
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
          Receita por Categoria
        </h3>
        <div className="text-sm text-[#a16b45] dark:text-[#d4a574]">
          Total: €{totalRevenue.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de Pizza */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${((entry.revenue / totalRevenue) * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `€${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ead9cd',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de Categorias */}
        <div className="space-y-3">
          {data.map((category, index) => {
            const percentage = ((category.revenue / totalRevenue) * 100).toFixed(1);
            return (
              <div
                key={category.name}
                className="flex items-center justify-between rounded-lg border border-[#ead9cd] p-3 dark:border-[#4a3c30]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <div className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                      {category.name}
                    </div>
                    <div className="text-xs text-[#a16b45] dark:text-[#d4a574]">
                      {category.orderCount} {category.orderCount === 1 ? 'pedido' : 'pedidos'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#FF6B00]">€{category.revenue.toFixed(2)}</div>
                  <div className="text-xs text-[#a16b45] dark:text-[#d4a574]">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

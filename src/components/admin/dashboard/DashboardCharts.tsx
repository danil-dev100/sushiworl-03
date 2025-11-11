'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export function DashboardCharts() {
  const salesChartRef = useRef<HTMLCanvasElement>(null);
  const salesChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!salesChartRef.current) return;

    // Destruir gráfico anterior se existir
    if (salesChartInstance.current) {
      salesChartInstance.current.destroy();
    }

    const ctx = salesChartRef.current.getContext('2d');
    if (!ctx) return;

    // Criar novo gráfico
    salesChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [
          {
            label: 'Vendas (€)',
            data: [850, 1200, 950, 1100, 1450, 1850, 1650],
            backgroundColor: '#FF6B00',
            borderColor: '#FF6B00',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#2a1e14',
            titleColor: '#f5f1e9',
            bodyColor: '#f5f1e9',
            borderColor: '#4a3c30',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return `€ ${context.parsed.y.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(234, 217, 205, 0.2)',
            },
            ticks: {
              color: '#a16b45',
              callback: function (value) {
                return '€' + value;
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#a16b45',
            },
          },
        },
      },
    });

    return () => {
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="flex min-w-72 flex-1 flex-col gap-4 rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-lg font-bold leading-normal text-[#FF6B00]">Vendas</p>
          <p className="text-4xl font-bold leading-tight text-[#333333] dark:text-[#f5f1e9]">
            € 8.750
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select className="appearance-none rounded-lg border border-[#ead9cd] bg-[#f5f1e9] px-3 py-2 pr-8 text-sm font-semibold text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Personalizado</option>
          </select>
          <div className="flex items-center gap-1 text-green-600">
            <span className="text-sm font-semibold">+15%</span>
          </div>
        </div>
      </div>
      <div className="min-h-[220px]">
        <canvas ref={salesChartRef}></canvas>
      </div>
    </div>
  );
}


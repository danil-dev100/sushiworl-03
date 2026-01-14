'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Zap } from 'lucide-react';

interface CustomMetric {
  id: string;
  name: string;
  type: string;
  formula: string;
  unit: string;
  description: string;
  isActive: boolean;
}

interface MetricValue {
  id: string;
  name: string;
  value: number;
  unit: string;
  type: string;
  description: string;
}

const METRIC_ICONS: Record<string, any> = {
  financial: DollarSign,
  operational: Target,
  marketing: TrendingUp,
  customer: Users,
};

const METRIC_COLORS: Record<string, string> = {
  financial: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  operational: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  marketing: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  customer: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
};

export default function CustomMetricsDisplay() {
  const [metrics, setMetrics] = useState<MetricValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/dashboard/custom-metrics/calculate');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('[CustomMetrics] Erro ao buscar métricas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-[#ead9cd] bg-white dark:border-[#4a3c30] dark:bg-[#2a1e14]"
          />
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">
          Métricas Customizadas
        </h3>
        <button
          onClick={fetchMetrics}
          className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e55f00]"
        >
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = METRIC_ICONS[metric.type] || Zap;
          const colorClass = METRIC_COLORS[metric.type] || METRIC_COLORS.operational;

          return (
            <div
              key={metric.id}
              className="rounded-xl border border-[#ead9cd] bg-white p-6 transition hover:shadow-lg dark:border-[#4a3c30] dark:bg-[#2a1e14]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#a16b45] dark:text-[#d4a574]">
                    {metric.name}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-[#333333] dark:text-[#f5f1e9]">
                      {metric.value.toLocaleString('pt-PT', {
                        minimumFractionDigits: metric.unit === '€' ? 2 : 0,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <span className="text-sm text-[#a16b45] dark:text-[#d4a574]">
                      {metric.unit}
                    </span>
                  </div>
                  {metric.description && (
                    <p className="mt-2 text-xs text-[#a16b45] dark:text-[#d4a574]">
                      {metric.description}
                    </p>
                  )}
                </div>
                <div className={`rounded-lg p-3 ${colorClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

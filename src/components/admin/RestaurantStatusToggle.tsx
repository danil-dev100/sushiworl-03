'use client';

import { useState, useEffect } from 'react';
import { Pause, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RestaurantStatusToggle() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Buscar status inicial
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/settings/restaurant-status');
        const data = await res.json();

        if (data.success) {
          setIsOnline(data.isOnline);
        }
      } catch (error) {
        console.error('Erro ao buscar status:', error);
        toast.error('Erro ao carregar status do restaurante');
      } finally {
        setIsFetching(false);
      }
    }

    fetchStatus();
  }, []);

  const toggleStatus = async () => {
    setIsLoading(true);

    try {
      const newStatus = !isOnline;

      const res = await fetch('/api/settings/restaurant-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus })
      });

      const data = await res.json();

      if (data.success) {
        setIsOnline(newStatus);
        toast.success(data.message, {
          description: newStatus
            ? 'Novos pedidos serão aceitos normalmente'
            : 'Novos pedidos serão recusados automaticamente',
          duration: 5000
        });
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      toast.error('Erro ao atualizar status do restaurante');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleStatus}
      disabled={isLoading}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
        isOnline
          ? 'bg-green-500 hover:bg-green-600 text-white'
          : 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
      }`}
      title={isOnline ? 'Clique para PAUSAR pedidos' : 'Clique para RETOMAR pedidos'}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isOnline ? (
        <Pause className="w-5 h-5" />
      ) : (
        <Play className="w-5 h-5" />
      )}

      <div className="text-left">
        <div className="text-sm font-bold">
          {isOnline ? 'ACEITANDO PEDIDOS' : 'PEDIDOS PAUSADOS'}
        </div>
        <div className="text-xs opacity-90">
          {isOnline ? 'Clique para pausar' : 'Clique para retomar'}
        </div>
      </div>
    </button>
  );
}

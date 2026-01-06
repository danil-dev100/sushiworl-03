'use client';

import { useEffect, useState } from 'react';

interface StoreStatus {
  isOpen: boolean;
  message: string | null;
  nextOpeningTime: string | null;
}

export function useStoreStatus() {
  const [status, setStatus] = useState<StoreStatus>({
    isOpen: true,
    message: null,
    nextOpeningTime: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/store/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('[useStoreStatus] Erro ao verificar status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Verificar a cada 30 segundos para refletir mudanças rapidamente
    const interval = setInterval(fetchStatus, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { ...status, isLoading };
}

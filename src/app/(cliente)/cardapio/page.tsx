'use client';

import { useEffect, useState } from 'react';
import { CardapioContent } from '@/components/cliente/CardapioContent';
import { Loader2 } from 'lucide-react';

export default function CardapioPage() {
  const [produtosPorCategoria, setProdutosPorCategoria] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      try {
        const response = await fetch('/api/cardapio', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao carregar produtos: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          setProdutosPorCategoria(data || {});
          setError(null);
        }
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
          setProdutosPorCategoria({});
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts().catch((err) => {
      console.error('Erro não capturado:', err);
      if (isMounted) {
        setError('Erro inesperado ao carregar produtos');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e9] dark:bg-[#23170f]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e9] dark:bg-[#23170f]">
        <div className="text-center">
          <p className="text-xl font-semibold text-[#333333] dark:text-[#f5f1e9]">
            Erro ao carregar o cardápio
          </p>
          <p className="mt-2 text-sm text-[#a16b45]">
            Por favor, tente novamente mais tarde
          </p>
        </div>
      </div>
    );
  }

  return <CardapioContent produtosPorCategoria={produtosPorCategoria} />;
}


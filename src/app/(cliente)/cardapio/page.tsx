'use client';

import { useEffect, useState } from 'react';
import { CardapioContent } from '@/components/cliente/CardapioContent';
import { Loader2 } from 'lucide-react';

export default function CardapioPage() {
  const [produtosPorCategoria, setProdutosPorCategoria] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/cardapio');
        const data = await response.json();
        setProdutosPorCategoria(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setProdutosPorCategoria({});
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e9] dark:bg-[#23170f]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return <CardapioContent produtosPorCategoria={produtosPorCategoria} />;
}


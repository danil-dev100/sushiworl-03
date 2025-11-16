'use client';

import React, { useState, useMemo, useEffect } from 'react';
import SidebarMenu from '@/components/cliente/SidebarMenu';
import ProductSection from '@/components/cliente/ProductSection';
import { MenuSearch } from '@/components/cliente/MenuSearch';

interface CardapioContentProps {
  produtosPorCategoria: Record<string, any[]>;
}

export function CardapioContent({ produtosPorCategoria }: CardapioContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return produtosPorCategoria;

    const term = searchTerm.toLowerCase();
    const filtered: Record<string, any[]> = {};

    Object.entries(produtosPorCategoria).forEach(([category, products]) => {
      const matchingProducts = products.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term)
      );

      if (matchingProducts.length > 0) {
        filtered[category] = matchingProducts;
      }
    });

    return filtered;
  }, [produtosPorCategoria, searchTerm]);

  const categories = [
    { id: 'destaques', name: 'DESTAQUES', emoji: '⭐' },
    { id: 'combinados', name: 'COMBINADOS', emoji: '🍣' },
    { id: 'hots', name: 'HOTS', emoji: '🔥' },
    { id: 'entradas', name: 'ENTRADAS', emoji: '🍤' },
    { id: 'poke-bowl', name: 'POKÉ BOWL', emoji: '🥗' },
    { id: 'gunkan', name: 'GUNKAN', emoji: '🍥' },
    { id: 'sashimi', name: 'SASHIMI', emoji: '🐟' },
    { id: 'nigiri', name: 'NIGIRI', emoji: '🍙' },
    { id: 'makis', name: 'MAKIS', emoji: '🥢' },
    { id: 'temaki', name: 'TEMAKI', emoji: '🍦' },
  ];

  // Scroll para seção ao carregar se houver hash na URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        <SidebarMenu activeSection="destaques" />

        <main className="flex-1 py-8">
          <MenuSearch onSearch={setSearchTerm} />

          {searchTerm && Object.keys(filteredProducts).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-xl font-semibold text-[#333333] dark:text-[#f5f1e9]">
                Nenhum produto encontrado
              </p>
              <p className="mt-2 text-sm text-[#a16b45]">
                Tente buscar por outro termo
              </p>
            </div>
          ) : (
            <>
              {categories.map((cat) => {
                const products = filteredProducts[cat.id] || filteredProducts[cat.name.toLowerCase().replace(/\s+/g, '-')] || [];
                
                if (searchTerm && products.length === 0) return null;

                return (
                  <section key={cat.id} id={cat.id} className={cat.id === 'destaques' ? '' : 'mt-12'}>
                    <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">
                      {cat.emoji} {cat.name}
                    </h2>
                    <ProductSection products={products} />
                  </section>
                );
              })}
            </>
          )}
        </main>
      </div>
    </div>
  );
}


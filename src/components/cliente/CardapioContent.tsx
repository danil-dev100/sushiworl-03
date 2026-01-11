'use client';

import React, { useState, useMemo, useEffect } from 'react';
import SidebarMenu from '@/components/cliente/SidebarMenu';
import ProductSection from '@/components/cliente/ProductSection';
import { MenuSearch } from '@/components/cliente/MenuSearch';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface CardapioContentProps {
  produtosPorCategoria: Record<string, any[]>;
}

export function CardapioContent({ produtosPorCategoria }: CardapioContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar categorias
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.categories) {
            // Adicionar "Destaques" no início se houver produtos em destaque
            const allCategories = [...data.categories];
            if (produtosPorCategoria['destaques'] && produtosPorCategoria['destaques'].length > 0) {
              // Remover Destaques se já existir
              const filteredCats = allCategories.filter(c => c.name !== 'Destaques');
              // Adicionar no início
              setCategories([
                { id: 'destaques', name: 'Destaques', emoji: '⭐' },
                ...filteredCats
              ]);
            } else {
              setCategories(allCategories);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [produtosPorCategoria]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return produtosPorCategoria;

    const term = searchTerm.toLowerCase();
    const filtered: Record<string, any[]> = {};
    const scoredProducts: Array<{ category: string; product: any; score: number }> = [];

    // Primeiro passo: coletar produtos com scores
    Object.entries(produtosPorCategoria).forEach(([category, products]) => {
      products.forEach((product) => {
        let score = 0;
        const categoryMatch = product.category?.toLowerCase().includes(term);
        const nameMatch = product.name.toLowerCase().includes(term);
        const descriptionMatch = product.description?.toLowerCase().includes(term);
        const categoryStartsWith = product.category?.toLowerCase().startsWith(term);
        const nameStartsWith = product.name.toLowerCase().startsWith(term);

        // Priorizar resultados que começam com o termo
        if (categoryStartsWith) score += 100;
        if (nameStartsWith) score += 50;

        // Depois os que contêm o termo
        if (categoryMatch) score += 20;
        if (nameMatch) score += 10;
        if (descriptionMatch) score += 5;

        if (score > 0) {
          scoredProducts.push({ category, product, score });
        }
      });
    });

    // Ordenar por score
    scoredProducts.sort((a, b) => b.score - a.score);

    // Agrupar por categoria mantendo a ordem de relevância
    scoredProducts.forEach(({ category, product }) => {
      if (!filtered[category]) {
        filtered[category] = [];
      }
      filtered[category].push(product);
    });

    return filtered;
  }, [produtosPorCategoria, searchTerm]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e9] dark:bg-[#23170f]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row">
        {/* Sidebar Desktop - Hidden on mobile */}
        <div className="hidden lg:block">
          <SidebarMenu categories={categories} activeSection="destaques" />
        </div>

        {/* Main Content */}
        <main className="flex-1 py-4 sm:py-6 lg:py-8">
          {/* Menu Mobile - Carrossel de Categorias */}
          <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    const element = document.getElementById(cat.id);
                    if (element) {
                      const headerOffset = 80;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#3a2c20] border-2 border-[#FF6B00]/20 hover:border-[#FF6B00] hover:bg-[#FF6B00]/10 transition-all"
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span className="text-xs font-medium text-[#333333] dark:text-[#f5f1e9] whitespace-nowrap">
                    {cat.name.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <MenuSearch onSearch={setSearchTerm} />
          </div>

          {/* No Results */}
          {searchTerm && Object.keys(filteredProducts).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <p className="text-lg sm:text-xl font-semibold text-[#333333] dark:text-[#f5f1e9]">
                Nenhum produto encontrado
              </p>
              <p className="mt-2 text-sm text-[#a16b45]">
                Tente buscar por outro termo
              </p>
            </div>
          ) : (
            <>
              {/* Product Sections */}
              {categories.map((cat) => {
                const products = filteredProducts[cat.id] || filteredProducts[cat.name.toLowerCase().replace(/\s+/g, '-')] || [];
                
                if (searchTerm && products.length === 0) return null;

                return (
                  <section key={cat.id} id={cat.id} className={cat.id === 'destaques' ? '' : 'mt-8 sm:mt-10 lg:mt-12'}>
                    <h2 className="text-[#FF6B00] text-2xl sm:text-3xl font-bold tracking-tight pb-4 sm:pb-6">
                      {cat.emoji} {cat.name.toUpperCase()}
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

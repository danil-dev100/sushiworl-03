'use client';

import { parseCardapio, getCategorias, Produto } from '@/lib/parseCardapio';
import ProductCard from '@/components/cliente/ProductCard';
import { useState } from 'react';

export default function CardapioPage() {
  const produtos = parseCardapio();
  const categorias = getCategorias();
  const [carrinho, setCarrinho] = useState<Produto[]>([]);

  const handleAddToCart = (produto: Produto) => {
    console.log('✅ Adicionando ao carrinho:', produto.nome);
    setCarrinho(prev => [...prev, produto]);
    
    const carrinhoAtual = JSON.parse(localStorage.getItem('carrinho') || '[]');
    localStorage.setItem('carrinho', JSON.stringify([...carrinhoAtual, produto]));
  };

  return (
    <main className="min-h-screen bg-[#f5f1e9]">
      {/* Hero Section */}
      <section className="bg-[#FF6B00] text-white py-12 mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nosso Cardápio
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Descubra sabores autênticos da culinária japonesa, preparados com ingredientes frescos e de qualidade
          </p>
          
          {carrinho.length > 0 && (
            <div className="mt-4 inline-block bg-white text-[#FF6B00] px-4 py-2 rounded-full font-semibold">
              🛒 {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'} no carrinho
            </div>
          )}
        </div>
      </section>

      {/* Produtos por Categoria */}
      <div className="container mx-auto px-4 pb-16">
        {categorias.map((categoria) => {
          const produtosCategoria = produtos.filter(
            (p) => p.categoria === categoria
          );

          if (produtosCategoria.length === 0) return null;

          return (
            <section key={categoria} id={categoria.toLowerCase()} className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-2">
                  {categoria}
                </h2>
                <div className="w-24 h-1 bg-[#FF6B00]"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtosCategoria.map((produto) => (
                  <ProductCard
                    key={produto.id}
                    produto={produto}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Menu de Navegação Rápida */}
      <nav className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 hidden lg:block max-h-96 overflow-y-auto z-50">
        <h3 className="font-bold text-[#333333] mb-2 text-sm">Categorias</h3>
        <ul className="space-y-1">
          {categorias.map((cat) => (
            <li key={cat}>
              <a
                href={`#${cat.toLowerCase()}`}
                className="text-sm text-gray-600 hover:text-[#FF6B00] transition-colors block py-1"
              >
                {cat}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
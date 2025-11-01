'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import ProductCard from '@/components/cliente/ProductCard';
import { categories, getProductsByCategory, Product, products } from '@/lib/products';

export default function CardapioPage() {
  const [selectedCategory, setSelectedCategory] = useState('Destaques');

  const filteredProducts = useMemo(() => {
    return getProductsByCategory(selectedCategory);
  }, [selectedCategory]);

  const handleAddToCart = (product: Product) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', product);
  };

  const menuJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Cardápio SushiWorld',
    description: 'Cardápio completo de sushi fresco e pratos orientais',
    url: 'https://sushiworld.pt/produtos',
    provider: {
      '@type': 'LocalBusiness',
      name: 'SushiWorld Delivery',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PT',
        addressRegion: 'Lisboa',
        addressLocality: 'Santa Iria'
      }
    },
    hasMenuSection: categories.map(category => ({
      '@type': 'MenuSection',
      name: category,
      hasMenuItem: getProductsByCategory(category).map(product => ({
        '@type': 'MenuItem',
        name: product.name,
        description: product.description,
        offers: {
          '@type': 'Offer',
          price: product.price.replace('€', ''),
          priceCurrency: 'EUR'
        }
      }))
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }}
      />

      <div className="min-h-screen bg-[#f5f1e9] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#333333] mb-4">
              Nosso Cardápio 🍱
            </h1>
            <p className="text-lg text-[#555555]">
              Descubra nossas deliciosas opções de sushi e pratos orientais
            </p>
          </div>

          {/* Category Filters */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-[#FF6B00] text-white shadow-lg'
                      : 'bg-white text-[#333333] hover:bg-[#ff8126] hover:text-white border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#333333] mb-6 text-center">
              {selectedCategory}
            </h2>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg shadow-sm p-4 text-center transition-all hover:shadow-md bg-white">
                    <Image
                      src={`/produtos.webp/${product.id}.webp`}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="mx-auto rounded-md object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/produtos.webp/placeholder.webp';
                      }}
                    />
                    <h3 className="mt-2 text-lg font-semibold text-[#333333]">{product.name}</h3>
                    <p className="text-sm text-[#555555]">{product.description}</p>
                    <p className="text-lg font-bold text-[#FF6B00] mt-1">{product.price}</p>
                    <button
                      className="mt-3 bg-[#FF6B00] text-white font-medium px-4 py-2 rounded-md hover:bg-[#ff8126] transition-all"
                      onClick={() => handleAddToCart(product)}
                      aria-label={`Adicionar ${product.name} ao carrinho`}
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#555555] text-lg">
                  Nenhum produto encontrado nesta categoria.
                </p>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-[#333333] mb-4">
              Não encontrou o que procura?
            </h3>
            <p className="text-[#555555] mb-6">
              Entre em contato conosco para sugestões personalizadas ou pedidos especiais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+351934841148"
                className="inline-block bg-[#FF6B00] hover:bg-[#ff8126] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                📞 Ligar Agora
              </a>
              <a
                href="https://wa.me/351934841148"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, ChefHat, Gift } from 'lucide-react';
import ProductCard from '@/components/cliente/ProductCard';
import { useDynamicProducts } from '@/hooks/useDynamicProducts';
import { Product } from '@/lib/products';

export default function HomeClient() {
  const { products, favoriteProduct, markAsPurchased } = useDynamicProducts(6);

  const handleAddToCart = (product: Product) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', product);
    markAsPurchased(product);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'SushiWorld Delivery',
    description: 'Sushi fresco, rápido e delicioso entregue na sua casa em Santa Iria',
    url: 'https://sushiworld.pt',
    telephone: '+351934841148',
    email: 'pedidosushiworld@gmail.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PT',
      addressRegion: 'Lisboa',
      addressLocality: 'Santa Iria'
    },
    servesCuisine: 'Japanese',
    priceRange: '€€',
    openingHours: 'Mo-Su 18:00-22:30',
    menu: {
      '@type': 'Menu',
      name: 'Cardápio SushiWorld',
      url: 'https://sushiworld.pt/produtos'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <Image
            src="/banner-site-novo-sushiword.webp"
            alt="SushiWorld - Sushi fresco e delicioso"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />

          {/* Logo overlay */}
          <div className="absolute top-20 left-4 md:left-8 z-10">
            <Image
              src="/logo-nova-sushiworl-santa-iria-sem-fundo.webp"
              alt="SushiWorld Logo"
              width={200}
              height={80}
              className="h-16 w-auto brightness-0 invert"
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sushi fresco, rápido e delicioso 🍣
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Entregue na sua casa em Santa Iria
            </p>
            <Link
              href="/produtos"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Ver Cardápio
            </Link>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Destaques da Semana
              </h2>
              <p className="text-lg text-gray-600">
                Descubra nossas combinações mais populares
              </p>
            </div>

            {/* Favorite Product */}
            {favoriteProduct && (
              <div className="mb-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    Você pediu e adorou! 🍱
                  </h3>
                  <p className="text-gray-600">
                    Baseado no seu último pedido
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-sm">
                    <ProductCard
                      product={favoriteProduct}
                      onAddToCart={handleAddToCart}
                      showFavorite={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Random Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Por que escolher SushiWorld?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Entrega rápida em Santa Iria
                </h3>
                <p className="text-gray-600">
                  Receba seu pedido quentinho em até 30 minutos
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ingredientes frescos e selecionados
                </h3>
                <p className="text-gray-600">
                  Peixe fresco diariamente e vegetais da estação
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Promoções exclusivas toda semana
                </h3>
                <p className="text-gray-600">
                  Descontos especiais e combos imperdíveis
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
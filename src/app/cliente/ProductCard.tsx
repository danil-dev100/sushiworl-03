'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Produto } from '@/lib/parseCardapio';

interface ProductCardProps {
  produto: Produto;
  onAddToCart?: (produto: Produto) => void;
}

export default function ProductCard({ produto, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    
    if (onAddToCart) {
      onAddToCart(produto);
    } else {
      const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
      localStorage.setItem('carrinho', JSON.stringify([...carrinho, produto]));
      console.log('✅ Adicionado ao carrinho (localStorage):', produto.nome);
    }
    
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        {!imageError ? (
          <Image
            src={produto.imagemUrl}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
            priority={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-[#f5f1e9]">
            <span className="text-4xl">🍣</span>
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-[#FF6B00] text-white text-xs font-semibold px-2 py-1 rounded">
          {produto.categoria}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#333333] mb-2 line-clamp-1">
          {produto.nome}
        </h3>

        <p className="text-gray-600 text-sm mb-4 min-h-[3rem] line-clamp-2">
          {produto.descricao || 'Produto delicioso preparado com ingredientes frescos'}
        </p>

        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-[#FF6B00]">
            €{produto.preco}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform
              ${isAdding 
                ? 'bg-green-500 text-white scale-95' 
                : 'bg-[#FF6B00] hover:bg-[#ff8126] text-white hover:shadow-md hover:scale-105'
              }
              disabled:cursor-not-allowed
            `}
          >
            {isAdding ? '✓ Adicionado!' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
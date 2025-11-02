'use client';

import Image from 'next/image';
import { sanitizeHtml } from '@/lib/security';

interface ProductCardProps {
  name: string;
  description: string;
  price: string;
  discountPrice?: string;
  imageUrl: string;
  sku: string;
}

export default function ProductCard({
  name,
  description,
  price,
  discountPrice,
  imageUrl,
  sku
}: ProductCardProps) {
  const handleAddToCart = () => {
    console.log('Adicionando produto:', sku);
  };

  const altText = `${name} - ${description}`;

  return (
    <div className="flex flex-col group bg-white/50 dark:bg-black/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg mb-4 overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-col flex-grow">
        <h3 className="text-price dark:text-background-light text-lg font-bold">
          {sanitizeHtml(name)}
        </h3>
        <p
          className="text-price/70 dark:text-background-light/70 text-sm mt-1 mb-3 flex-grow"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
        />
        <div className="flex items-center gap-2">
          <p className="text-price dark:text-background-light text-lg font-bold">
            {price}
          </p>
          {discountPrice && (
            <p className="text-price-discount text-sm font-normal line-through">
              {discountPrice}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        className="mt-4 w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
      >
        Adicionar
      </button>
    </div>
  );
}

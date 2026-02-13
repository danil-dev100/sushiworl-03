'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { shouldShowPromotion, calculateDiscountedPrice } from '@/lib/promotionMatcher';
import { toast } from 'sonner';

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface Promotion {
  id: string;
  name: string;
  type: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  triggerType: string | null;
  triggerValue: string | null;
  displayMessage: string | null;
  suggestedProduct: SuggestedProduct;
}

interface UpsellBannerProps {
  productIds: string[];
  cartTotal: number;
}

export function UpsellBanner({ productIds, cartTotal }: UpsellBannerProps) {
  const { addItem } = useCart();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [addedPromos, setAddedPromos] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await fetch('/api/promotions/active?type=UP_SELL');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setPromotions(data.promotions);
        }
      } catch {
        // Silenciar erros
      }
    }

    fetchPromotions();
  }, []);

  const visiblePromotions = promotions.filter(
    (p) =>
      !addedPromos.has(p.id) &&
      shouldShowPromotion(p, { productIds, cartTotal })
  );

  const handleAdd = useCallback((promo: Promotion) => {
    const discountedPrice = calculateDiscountedPrice(
      promo.suggestedProduct.price,
      promo.discountType,
      promo.discountValue
    );

    addItem({
      productId: promo.suggestedProduct.id,
      name: promo.suggestedProduct.name,
      price: discountedPrice,
      quantity: 1,
      image: promo.suggestedProduct.imageUrl,
    });

    setAddedPromos((prev) => new Set(prev).add(promo.id));
    toast.success(`${promo.suggestedProduct.name} adicionado ao carrinho!`);
  }, [addItem]);

  if (visiblePromotions.length === 0) return null;

  return (
    <div className="space-y-3">
      {visiblePromotions.map((promo) => {
        const discountedPrice = calculateDiscountedPrice(
          promo.suggestedProduct.price,
          promo.discountType,
          promo.discountValue
        );

        return (
          <div
            key={promo.id}
            className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-[#FF6B00]/10 to-[#FF6B00]/5 border border-[#FF6B00]/30 p-4"
          >
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={promo.suggestedProduct.imageUrl}
                alt={promo.suggestedProduct.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#333333] dark:text-[#f5f1e9] text-sm">
                {promo.title || promo.displayMessage || `Upgrade para ${promo.suggestedProduct.name}!`}
              </p>
              {promo.description && (
                <p className="text-xs text-[#8b5e3c] mt-0.5">{promo.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#8b5e3c] line-through">
                  €{promo.suggestedProduct.price.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-[#FF6B00]">
                  €{discountedPrice.toFixed(2)}
                </span>
                {promo.discountType === 'PERCENTAGE' && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    -{promo.discountValue}%
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAdd(promo)}
              className="flex-shrink-0 rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-bold text-white hover:bg-[#FF6B00]/90 transition-colors"
            >
              Adicionar
            </button>
          </div>
        );
      })}
    </div>
  );
}

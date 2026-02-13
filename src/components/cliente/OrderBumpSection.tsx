'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { shouldShowPromotion, calculateDiscountedPrice } from '@/lib/promotionMatcher';

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

interface OrderBumpSectionProps {
  productIds: string[];
  cartTotal: number;
}

export function OrderBumpSection({ productIds, cartTotal }: OrderBumpSectionProps) {
  const { addItem, removeItem, items } = useCart();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [checkedBumps, setCheckedBumps] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await fetch('/api/promotions/active?type=ORDER_BUMP');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setPromotions(data.promotions);
        }
      } catch {
        // Silenciar erros - promoções são opcionais
      }
    }

    fetchPromotions();
  }, []);

  const visiblePromotions = promotions.filter((p) =>
    shouldShowPromotion(p, { productIds, cartTotal })
  );

  const handleToggle = useCallback((promo: Promotion, checked: boolean) => {
    const discountedPrice = calculateDiscountedPrice(
      promo.suggestedProduct.price,
      promo.discountType,
      promo.discountValue
    );

    if (checked) {
      addItem({
        productId: promo.suggestedProduct.id,
        name: promo.suggestedProduct.name,
        price: discountedPrice,
        quantity: 1,
        image: promo.suggestedProduct.imageUrl,
      });
      setCheckedBumps((prev) => new Set(prev).add(promo.id));
    } else {
      // Encontrar o item adicionado pelo order bump e remover
      const bumpItem = items.find(
        (item) => item.productId === promo.suggestedProduct.id && item.price === discountedPrice
      );
      if (bumpItem) {
        removeItem(bumpItem.id);
      }
      setCheckedBumps((prev) => {
        const next = new Set(prev);
        next.delete(promo.id);
        return next;
      });
    }
  }, [addItem, removeItem, items]);

  if (visiblePromotions.length === 0) return null;

  return (
    <div className="space-y-3">
      {visiblePromotions.map((promo) => {
        const discountedPrice = calculateDiscountedPrice(
          promo.suggestedProduct.price,
          promo.discountType,
          promo.discountValue
        );
        const isChecked = checkedBumps.has(promo.id);

        return (
          <label
            key={promo.id}
            className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              isChecked
                ? 'border-[#FF6B00] bg-[#FF6B00]/5'
                : 'border-dashed border-[#FF6B00]/50 hover:border-[#FF6B00]/80 bg-[#FF6B00]/5'
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleToggle(promo, e.target.checked)}
              className="h-5 w-5 rounded border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00]"
            />
            <div className="relative w-[60px] h-[60px] flex-shrink-0">
              <Image
                src={promo.suggestedProduct.imageUrl}
                alt={promo.suggestedProduct.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#333333] dark:text-[#f5f1e9] text-sm">
                {promo.title || promo.displayMessage || `Adicione ${promo.suggestedProduct.name}!`}
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
          </label>
        );
      })}
    </div>
  );
}

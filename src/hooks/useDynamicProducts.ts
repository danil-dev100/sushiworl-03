'use client';

import { useState, useEffect } from 'react';
import { Product, getRandomProducts } from '@/lib/products';

const STORAGE_KEY = 'sushiworld_displayed_products';
const TIMESTAMP_KEY = 'sushiworld_last_visit';
const PURCHASE_KEY = 'sushiworld_last_purchase';

export function useDynamicProducts(count: number = 6) {
  const [products, setProducts] = useState<Product[]>([]);
  const [favoriteProduct, setFavoriteProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProducts = () => {
      const now = Date.now();
      const lastVisit = localStorage.getItem(TIMESTAMP_KEY);
      const lastPurchase = localStorage.getItem(PURCHASE_KEY);
      const storedProducts = localStorage.getItem(STORAGE_KEY);

      // Check if 24 hours have passed (24 * 60 * 60 * 1000 = 86400000)
      const shouldRefresh = !lastVisit || (now - parseInt(lastVisit)) > 86400000;

      let selectedProducts: Product[];

      if (shouldRefresh || !storedProducts) {
        // Get new random products
        selectedProducts = getRandomProducts(count);

        // Store in localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProducts.map(p => p.id)));
        localStorage.setItem(TIMESTAMP_KEY, now.toString());
      } else {
        // Load from localStorage
        const storedIds = JSON.parse(storedProducts);
        const allProducts = getRandomProducts(100); // Get a larger pool to find stored ones
        selectedProducts = storedIds
          .map((id: number) => allProducts.find(p => p.id === id))
          .filter(Boolean)
          .slice(0, count);
      }

      setProducts(selectedProducts);

      // Check for favorite product (most expensive purchased)
      if (lastPurchase) {
        try {
          const purchaseData = JSON.parse(lastPurchase);
          const allProducts = getRandomProducts(100);
          const purchasedProduct = allProducts.find(p => p.id === purchaseData.productId);
          if (purchasedProduct) {
            setFavoriteProduct(purchasedProduct);
          }
        } catch (error) {
          console.error('Error parsing purchase data:', error);
        }
      }
    };

    loadProducts();
  }, [count]);

  const markAsPurchased = (product: Product) => {
    const purchaseData = {
      productId: product.id,
      timestamp: Date.now(),
      price: product.price
    };
    localStorage.setItem(PURCHASE_KEY, JSON.stringify(purchaseData));
    setFavoriteProduct(product);
  };

  return {
    products,
    favoriteProduct,
    markAsPurchased
  };
}
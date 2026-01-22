'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedOptions?: {
    optionId: string;
    optionName: string;
    choices: {
      choiceId: string;
      choiceName: string;
      price: number;
    }[];
  }[];
}

interface AdditionalItem {
  id: string;
  name: string;
  price: number;
}

interface GlobalOptionSelection {
  optionId: string;
  optionName: string;
  choices: {
    choiceId: string;
    choiceName: string;
    price: number;
  }[];
}

interface CartContextType {
  items: CartItem[];
  additionalItems: AdditionalItem[];
  globalOptions: GlobalOptionSelection[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  addAdditionalItem: (item: Omit<AdditionalItem, 'id'>) => void;
  removeAdditionalItem: (id: string) => void;
  setGlobalOptions: (options: GlobalOptionSelection[]) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [globalOptions, setGlobalOptionsState] = useState<GlobalOptionSelection[]>([]);

  // Carregar carrinho do localStorage ao montar
  useEffect(() => {
    const savedCart = localStorage.getItem('sushiworld-cart');
    const savedAdditional = localStorage.getItem('sushiworld-cart-additional');
    const savedGlobalOptions = localStorage.getItem('sushiworld-cart-global-options');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed);
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
      }
    }
    if (savedAdditional) {
      try {
        const parsed = JSON.parse(savedAdditional);
        setAdditionalItems(parsed);
      } catch (error) {
        console.error('Erro ao carregar itens adicionais:', error);
      }
    }
    if (savedGlobalOptions) {
      try {
        const parsed = JSON.parse(savedGlobalOptions);
        setGlobalOptionsState(parsed);
      } catch (error) {
        console.error('Erro ao carregar opções globais:', error);
      }
    }
  }, []);

  // Salvar carrinho no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('sushiworld-cart', JSON.stringify(items));
  }, [items]);

  // Salvar itens adicionais no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('sushiworld-cart-additional', JSON.stringify(additionalItems));
  }, [additionalItems]);

  // Salvar opções globais no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('sushiworld-cart-global-options', JSON.stringify(globalOptions));
  }, [globalOptions]);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    const id = `${item.productId}-${Date.now()}-${Math.random()}`;
    const newItem = { ...item, id };

    setItems((prev) => [...prev, newItem]);
    toast.success(`${item.name} adicionado ao carrinho!`);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success('Item removido do carrinho');
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const addAdditionalItem = (item: Omit<AdditionalItem, 'id'>) => {
    // Verificar se já existe
    const exists = additionalItems.find(i => i.name === item.name);
    if (exists) return;

    const id = `additional-${Date.now()}-${Math.random()}`;
    const newItem = { ...item, id };
    setAdditionalItems((prev) => [...prev, newItem]);
  };

  const removeAdditionalItem = (id: string) => {
    setAdditionalItems((prev) => prev.filter((item) => item.id !== id));
  };

  const setGlobalOptions = (options: GlobalOptionSelection[]) => {
    setGlobalOptionsState(options);
  };

  const clearCart = () => {
    setItems([]);
    setAdditionalItems([]);
    setGlobalOptionsState([]);
    toast.success('Carrinho limpo');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;

    // Adicionar preço das opções selecionadas
    if (item.selectedOptions) {
      item.selectedOptions.forEach((option) => {
        option.choices.forEach((choice) => {
          itemTotal += choice.price * item.quantity;
        });
      });
    }

    return sum + itemTotal;
  }, 0)
  + additionalItems.reduce((sum, item) => sum + item.price, 0)
  + globalOptions.reduce((sum, option) => {
    return sum + option.choices.reduce((choiceSum, choice) => choiceSum + choice.price, 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        additionalItems,
        globalOptions,
        addItem,
        removeItem,
        updateQuantity,
        addAdditionalItem,
        removeAdditionalItem,
        setGlobalOptions,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

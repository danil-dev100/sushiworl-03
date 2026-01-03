'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CartAdditionalItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  isRequired: boolean;
}

export default function CarrinhoPage() {
  const { items, additionalItems, updateQuantity, removeItem, addAdditionalItem, removeAdditionalItem, totalPrice } = useCart();
  const [availableCartItems, setAvailableCartItems] = useState<CartAdditionalItem[]>([]);

  // TODO: Buscar taxa de IVA das configurações do banco de dados
  const taxaIVA = 13; // Taxa de IVA em percentual (13% conforme especificado)

  const subtotal = totalPrice;
  const taxaEntrega = 5.00;

  const total = subtotal + taxaEntrega;

  // Buscar itens adicionais configurados
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        console.log('[Carrinho] 📡 Buscando itens adicionais...');
        const response = await fetch('/api/cart/additional-items', {
          cache: 'no-store', // Não usar cache
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        console.log('[Carrinho] 📡 Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[Carrinho] 📦 Data recebido:', data);

          const activeItems: CartAdditionalItem[] = data.items || [];
          console.log('[Carrinho] ✅ Itens ativos:', activeItems.length);

          setAvailableCartItems(activeItems);

          // Remover do carrinho itens que não existem mais ou foram desativados
          const currentItemNames = activeItems.map(item => item.name);
          additionalItems.forEach(addedItem => {
            if (!currentItemNames.includes(addedItem.name)) {
              removeAdditionalItem(addedItem.id);
            }
          });

          // Adicionar automaticamente itens obrigatórios
          const requiredItems = activeItems.filter(item => item.isRequired);
          requiredItems.forEach(item => {
            const alreadyAdded = additionalItems.some(added => added.name === item.name);
            if (!alreadyAdded) {
              addAdditionalItem({ name: item.name, price: item.price });
            }
          });
        } else {
          console.error('[Carrinho] ❌ Erro na resposta:', response.status);
        }
      } catch (error) {
        console.error('[Carrinho] ❌ Erro ao buscar itens do carrinho:', error);
      }
    };

    fetchCartItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleItemToggle = (item: CartAdditionalItem, checked: boolean) => {
    if (checked) {
      addAdditionalItem({ name: item.name, price: item.price });
    } else {
      const addedItem = additionalItems.find(added => added.name === item.name);
      if (addedItem) {
        removeAdditionalItem(addedItem.id);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 py-10 sm:px-10 md:px-20 lg:px-40">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#333333] dark:text-[#f5f1e9]">
                Carrinho
              </h1>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-xl text-[#333333]/70 dark:text-[#f5f1e9]/70 mb-6">
                  Seu carrinho está vazio
                </p>
                <Link
                  href="/cardapio"
                  className="flex items-center justify-center rounded-lg h-12 px-6 bg-[#FF6B00] text-white text-base font-bold hover:opacity-90 transition-opacity"
                >
                  Ver Cardápio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Lista de Itens */}
                <main className="col-span-1 flex flex-col gap-6 md:col-span-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 bg-white dark:bg-[#2a1e14] rounded-xl p-4 shadow-sm border border-[#ead9cd] dark:border-[#4a3c30]"
                    >
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.image || '/placeholder-product.png'}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-[#333333] dark:text-[#f5f1e9]">
                            {item.name}
                          </h3>
                          <p className="text-[#FF6B00] font-bold mt-1">
                            €{item.price.toFixed(2)}
                          </p>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className="text-xs text-[#a16b45] mt-1">
                              {item.selectedOptions.map(opt => (
                                <span key={opt.optionId}>
                                  {opt.choices.map(c => c.choiceName).join(', ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] hover:bg-[#FF6B00]/30 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium text-[#333333] dark:text-[#f5f1e9] min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] hover:bg-[#FF6B00]/30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {/* Itens Adicionais do Carrinho */}
                  {availableCartItems.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
                        Itens Adicionais
                      </h3>
                      {availableCartItems.map((item) => {
                        const isAdded = additionalItems.some(added => added.name === item.name);
                        const isDisabled = item.isRequired; // Obrigatórios não podem ser desmarcados

                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-4 rounded-lg border-2 p-4 ${
                              item.isRequired
                                ? 'border-solid border-[#FF6B00] bg-[#FF6B00]/5'
                                : 'border-dashed border-[#FF6B00]/50 bg-[#FF6B00]/10 dark:bg-[#FF6B00]/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="form-checkbox mt-1 h-5 w-5 rounded border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed"
                              id={`cart-item-${item.id}`}
                              checked={isAdded}
                              disabled={isDisabled}
                              onChange={(e) => handleItemToggle(item, e.target.checked)}
                            />
                            <label className="flex-1 cursor-pointer" htmlFor={`cart-item-${item.id}`}>
                              <p className="text-base font-bold text-[#333333] dark:text-[#f5f1e9]">
                                {item.name} - €{item.price.toFixed(2)}
                                {item.isRequired && (
                                  <span className="ml-2 text-sm font-normal text-[#a16b45]">
                                    (Obrigatório)
                                  </span>
                                )}
                              </p>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </main>

                {/* Resumo */}
                <aside className="col-span-1">
                  <div className="sticky top-24 rounded-xl border border-[#ead9cd] dark:border-[#4a3c30] bg-white dark:bg-[#2a1e14] p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9] mb-6">
                      Resumo do Pedido
                    </h3>
                    <div className="space-y-3 border-b border-[#ead9cd] dark:border-[#4a3c30] pb-4 mb-4">
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Subtotal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                      </div>
                      {additionalItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                          <span>{item.name}</span>
                          <span>€{item.price.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Taxa de Entrega</span>
                        <span>€{taxaEntrega.toFixed(2)}</span>
                      </div>
                      <div className="text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>IVA ({taxaIVA}% incluído)</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-[#333333] dark:text-[#f5f1e9] mb-2">
                      <span>Total</span>
                      <span className="text-[#FF6B00]">€{total.toFixed(2)}</span>
                    </div>
                    <div className="mb-6 flex justify-end text-xs text-[#a16b45]">
                      <span>(IVA incluído)</span>
                    </div>
                    <Link
                      href="/checkout"
                      className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-[#FF6B00] text-white text-base font-bold hover:bg-[#FF6B00]/90 transition-colors"
                    >
                      Ir para o Checkout
                    </Link>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

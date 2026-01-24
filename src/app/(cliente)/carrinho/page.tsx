'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, Gift } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CartAdditionalItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  isRequired: boolean;
}

interface DeliveryArea {
  id: string;
  name: string;
  deliveryType: 'FREE' | 'PAID' | 'DISTANCE';
  deliveryFee: number;
  minOrderValue: number | null;
  pricePerKm?: number;
}

interface GlobalOption {
  id: string;
  name: string;
  description: string | null;
  type: 'REQUIRED' | 'OPTIONAL';
  isPaid: boolean;
  basePrice: number;
  minSelection: number;
  maxSelection: number;
  allowMultiple: boolean;
  allowQuantity: boolean;
  choices: {
    id: string;
    name: string;
    price: number;
    isDefault: boolean;
  }[];
}

interface SelectedGlobalOption {
  optionId: string;
  optionName: string;
  choices: {
    choiceId: string;
    choiceName: string;
    price: number;
    quantity: number;
  }[];
}

export default function CarrinhoPage() {
  const { items, additionalItems, updateQuantity, removeItem, addAdditionalItem, removeAdditionalItem, totalPrice, globalOptions: cartGlobalOptions, setGlobalOptions: setCartGlobalOptions } = useCart();
  const [availableCartItems, setAvailableCartItems] = useState<CartAdditionalItem[]>([]);
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea | null>(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(true);
  const [globalOptions, setGlobalOptions] = useState<GlobalOption[]>([]);
  const [selectedGlobalOptions, setSelectedGlobalOptions] = useState<SelectedGlobalOption[]>(cartGlobalOptions || []);

  // TODO: Buscar taxa de IVA das configurações do banco de dados
  const taxaIVA = 13; // Taxa de IVA em percentual (13% conforme especificado)

  const subtotal = totalPrice;

  // Taxa de entrega será calculada no checkout baseado no endereço
  // No carrinho, não cobramos taxa ainda
  const taxaEntrega = 0.00;

  const total = subtotal + taxaEntrega;

  // Verificar área de entrega baseado no endereço do cliente
  useEffect(() => {
    const checkDeliveryArea = async () => {
      try {
        // Buscar endereço salvo do localStorage
        const savedAddress = localStorage.getItem('deliveryAddress');
        if (!savedAddress) {
          setIsCheckingDelivery(false);
          return;
        }

        const response = await fetch('/api/delivery/check-area', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: savedAddress }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.delivers && data.area) {
            setDeliveryArea(data.area);
          }
        }
      } catch (error) {
        console.error('[Carrinho] Erro ao verificar área de entrega:', error);
      } finally {
        setIsCheckingDelivery(false);
      }
    };

    checkDeliveryArea();
  }, []);

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
        } else {
          console.error('[Carrinho] ❌ Erro na resposta:', response.status);
        }
      } catch (error) {
        console.error('[Carrinho] ❌ Erro ao buscar itens do carrinho:', error);
      }
    };

    fetchCartItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Buscar opções globais para o carrinho
  useEffect(() => {
    const fetchGlobalOptions = async () => {
      if (items.length === 0) {
        setGlobalOptions([]);
        return;
      }

      try {
        // Obter productIds e categorias dos itens no carrinho
        const productIds = items.map(item => item.productId).join(',');
        const categories = [...new Set(items.map(item => item.name.split(' - ')[0]))].join(',');

        console.log('[Carrinho] 📡 Buscando opções globais para carrinho...');
        const response = await fetch(`/api/cart/global-options?productIds=${productIds}&categories=${categories}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Carrinho] 📦 Opções globais recebidas:', data);

          if (data.success && data.options) {
            setGlobalOptions(data.options);

            // Selecionar automaticamente as escolhas padrão
            const defaultSelections: SelectedGlobalOption[] = [];
            data.options.forEach((opt: GlobalOption) => {
              const defaultChoices = opt.choices.filter(c => c.isDefault);
              if (defaultChoices.length > 0) {
                const existingSelection = selectedGlobalOptions.find(s => s.optionId === opt.id);
                if (!existingSelection) {
                  defaultSelections.push({
                    optionId: opt.id,
                    optionName: opt.name,
                    choices: defaultChoices.map(c => ({
                      choiceId: c.id,
                      choiceName: c.name,
                      price: c.price,
                      quantity: 1
                    }))
                  });
                }
              }
            });

            if (defaultSelections.length > 0) {
              setSelectedGlobalOptions(prev => [...prev, ...defaultSelections]);
            }
          }
        }
      } catch (error) {
        console.error('[Carrinho] ❌ Erro ao buscar opções globais:', error);
      }
    };

    fetchGlobalOptions();
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar seleções com o contexto do carrinho
  useEffect(() => {
    if (setCartGlobalOptions) {
      setCartGlobalOptions(selectedGlobalOptions);
    }
  }, [selectedGlobalOptions, setCartGlobalOptions]);

  // Adicionar automaticamente itens obrigatórios quando availableCartItems mudar
  useEffect(() => {
    const requiredItems = availableCartItems.filter(item => item.isRequired);

    requiredItems.forEach(item => {
      const alreadyAdded = additionalItems.some(added => added.name === item.name);
      if (!alreadyAdded) {
        console.log('[Carrinho] ➕ Adicionando item obrigatório:', item.name);
        addAdditionalItem({ name: item.name, price: item.price });
      }
    });
  }, [availableCartItems, additionalItems, addAdditionalItem]);

  const handleItemToggle = (item: CartAdditionalItem, checked: boolean) => {
    // Impedir desmarcar itens obrigatórios
    if (!checked && item.isRequired) {
      console.log('[Carrinho] ⚠️ Não é possível remover item obrigatório:', item.name);
      return;
    }

    if (checked) {
      addAdditionalItem({ name: item.name, price: item.price });
    } else {
      const addedItem = additionalItems.find(added => added.name === item.name);
      if (addedItem) {
        removeAdditionalItem(addedItem.id);
      }
    }
  };

  // Manipular seleção de opções globais
  const handleGlobalOptionToggle = (option: GlobalOption, choice: GlobalOption['choices'][0], checked: boolean) => {
    setSelectedGlobalOptions(prev => {
      const existingIndex = prev.findIndex(s => s.optionId === option.id);

      if (checked) {
        // Se a opção permite múltipla escolha
        if (option.allowMultiple) {
          if (existingIndex >= 0) {
            // Adicionar escolha à seleção existente
            const updated = [...prev];
            const alreadyHasChoice = updated[existingIndex].choices.some(c => c.choiceId === choice.id);
            if (!alreadyHasChoice) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                choices: [...updated[existingIndex].choices, {
                  choiceId: choice.id,
                  choiceName: choice.name,
                  price: choice.price,
                  quantity: 1
                }]
              };
            }
            return updated;
          } else {
            // Criar nova seleção
            return [...prev, {
              optionId: option.id,
              optionName: option.name,
              choices: [{
                choiceId: choice.id,
                choiceName: choice.name,
                price: choice.price,
                quantity: 1
              }]
            }];
          }
        } else {
          // Seleção única - substituir
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              choices: [{
                choiceId: choice.id,
                choiceName: choice.name,
                price: choice.price,
                quantity: 1
              }]
            };
            return updated;
          } else {
            return [...prev, {
              optionId: option.id,
              optionName: option.name,
              choices: [{
                choiceId: choice.id,
                choiceName: choice.name,
                price: choice.price,
                quantity: 1
              }]
            }];
          }
        }
      } else {
        // Remover escolha
        if (existingIndex >= 0) {
          const updated = [...prev];
          const newChoices = updated[existingIndex].choices.filter(c => c.choiceId !== choice.id);
          if (newChoices.length === 0) {
            // Remover toda a seleção se não houver mais escolhas
            return prev.filter((_, i) => i !== existingIndex);
          } else {
            updated[existingIndex] = {
              ...updated[existingIndex],
              choices: newChoices
            };
            return updated;
          }
        }
        return prev;
      }
    });
  };

  // Atualizar quantidade de uma escolha
  const handleChoiceQuantity = (optionId: string, choiceId: string, delta: number) => {
    setSelectedGlobalOptions(prev => {
      const existingIndex = prev.findIndex(s => s.optionId === optionId);
      if (existingIndex < 0) return prev;

      const updated = [...prev];
      const choiceIndex = updated[existingIndex].choices.findIndex(c => c.choiceId === choiceId);
      if (choiceIndex < 0) return prev;

      const newQty = (updated[existingIndex].choices[choiceIndex].quantity || 1) + delta;
      if (newQty < 1) {
        // Remover escolha se quantidade for 0
        const newChoices = updated[existingIndex].choices.filter(c => c.choiceId !== choiceId);
        if (newChoices.length === 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }
        updated[existingIndex] = { ...updated[existingIndex], choices: newChoices };
      } else {
        updated[existingIndex].choices[choiceIndex] = {
          ...updated[existingIndex].choices[choiceIndex],
          quantity: newQty
        };
      }
      return updated;
    });
  };

  const isChoiceSelected = (optionId: string, choiceId: string) => {
    const selection = selectedGlobalOptions.find(s => s.optionId === optionId);
    return selection?.choices.some(c => c.choiceId === choiceId) || false;
  };

  const getChoiceQuantity = (optionId: string, choiceId: string) => {
    const selection = selectedGlobalOptions.find(s => s.optionId === optionId);
    return selection?.choices.find(c => c.choiceId === choiceId)?.quantity || 0;
  };

  // Calcular quanto falta para entrega grátis
  const calculateRemainingForFreeDelivery = () => {
    if (!deliveryArea || deliveryArea.deliveryType !== 'FREE' || !deliveryArea.minOrderValue) {
      return null;
    }

    const remaining = deliveryArea.minOrderValue - subtotal;
    return remaining > 0 ? remaining : 0;
  };

  const remainingForFreeDelivery = calculateRemainingForFreeDelivery();

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

            {/* Notificação de Entrega Grátis */}
            {!isCheckingDelivery && remainingForFreeDelivery !== null && remainingForFreeDelivery > 0 && (
              <div className="mx-4 mb-6 rounded-xl border-2 border-[#FF6B00] bg-gradient-to-r from-[#FF6B00]/10 to-[#FF6B00]/5 p-4 shadow-md animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FF6B00] flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#333333] dark:text-[#f5f1e9]">
                      Faltam €{remainingForFreeDelivery.toFixed(2)} para você ganhar entrega grátis!
                    </p>
                    <p className="text-sm text-[#a16b45] mt-1">
                      Adicione mais itens ao seu pedido e aproveite o frete gratuito
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notificação de Entrega Grátis Conquistada */}
            {!isCheckingDelivery && remainingForFreeDelivery !== null && remainingForFreeDelivery === 0 && (
              <div className="mx-4 mb-6 rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-green-700 dark:text-green-400">
                      Parabéns! Você ganhou entrega grátis!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                      Seu pedido atingiu o valor mínimo para frete gratuito
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                            <div className="mt-2 space-y-1">
                              {item.selectedOptions.map(opt => (
                                <div key={opt.optionId} className="text-xs">
                                  <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                                    {opt.optionName}:
                                  </p>
                                  <div className="ml-2 space-y-0.5">
                                    {opt.choices.map((choice: any) => (
                                      <div key={choice.choiceId} className="flex items-center gap-2 text-[#a16b45]">
                                        <span>• {choice.choiceName}</span>
                                        {choice.price > 0 ? (
                                          <span className="text-[#FF6B00] font-medium">
                                            +€{choice.price.toFixed(2)}
                                          </span>
                                        ) : (
                                          <span className="text-green-600 dark:text-green-400 font-medium">
                                            Grátis
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
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

                  {/* Opções Globais do Carrinho */}
                  {globalOptions.length > 0 && (
                    <div className="space-y-4 bg-white dark:bg-[#2a1e14] rounded-xl p-4 shadow-sm border border-[#ead9cd] dark:border-[#4a3c30]">
                      <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
                        Opções Adicionais
                      </h3>
                      {globalOptions.map((option) => (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                              {option.name}
                              {option.type === 'REQUIRED' && (
                                <span className="ml-2 text-xs text-red-500">(Obrigatório)</span>
                              )}
                            </p>
                            {option.allowMultiple && (
                              <span className="text-xs text-[#a16b45]">
                                Múltipla escolha
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-sm text-[#a16b45]">{option.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {option.choices.map((choice) => {
                              const isSelected = isChoiceSelected(option.id, choice.id);
                              const qty = getChoiceQuantity(option.id, choice.id);

                              // Se permite quantidade e está selecionado, mostrar controles de quantidade
                              if (option.allowQuantity && isSelected) {
                                return (
                                  <div
                                    key={choice.id}
                                    className="flex items-center gap-1 bg-[#FF6B00] text-white rounded-lg px-2 py-1"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleChoiceQuantity(option.id, choice.id, -1)}
                                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="min-w-[1.5rem] text-center text-sm font-bold">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleChoiceQuantity(option.id, choice.id, 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <span className="ml-1 text-sm">{choice.name}</span>
                                    {choice.price > 0 && (
                                      <span className="text-xs ml-1">€{(choice.price * qty).toFixed(2)}</span>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={choice.id}
                                  type="button"
                                  onClick={() => handleGlobalOptionToggle(option, choice, !isSelected)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isSelected
                                      ? 'bg-[#FF6B00] text-white'
                                      : 'bg-[#FF6B00]/10 text-[#333333] dark:text-[#f5f1e9] hover:bg-[#FF6B00]/20'
                                  }`}
                                >
                                  {choice.name}
                                  {choice.price > 0 && (
                                    <span className="ml-1">
                                      +€{choice.price.toFixed(2)}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

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
                      {selectedGlobalOptions.map((option) => (
                        option.choices.map((choice) => (
                          <div key={`${option.optionId}-${choice.choiceId}`} className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                            <span>
                              {choice.quantity > 1 ? `${choice.quantity}x ` : ''}{option.optionName}: {choice.choiceName}
                            </span>
                            {choice.price > 0 ? (
                              <span>€{(choice.price * (choice.quantity || 1)).toFixed(2)}</span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400">Grátis</span>
                            )}
                          </div>
                        ))
                      ))}
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

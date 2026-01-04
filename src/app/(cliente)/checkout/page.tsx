'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';

interface CheckoutAdditionalItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  isRequired: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, additionalItems, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [valorEntregue, setValorEntregue] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Itens adicionais do checkout
  const [checkoutItems, setCheckoutItems] = useState<CheckoutAdditionalItem[]>([]);
  const [selectedCheckoutItems, setSelectedCheckoutItems] = useState<Set<string>>(new Set());

  // Cupom
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    name: string;
    discountAmount: number;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    endereco: '',
    codigoPostal: '',
    nif: '',
    observacoes: '',
  });

  // Delivery validation
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [deliveryValidation, setDeliveryValidation] = useState<{
    isValid: boolean;
    message: string;
    area?: {
      id: string;
      name: string;
      deliveryType: string;
      deliveryFee: number;
      minOrderValue: number | null;
    };
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // TODO: Buscar taxa de IVA das configurações do banco de dados
  const taxaIVA = 13; // Taxa de IVA em percentual (13% conforme especificado)

  const subtotal = totalPrice;
  const taxaEntrega = 5.00;
  const desconto = appliedCoupon?.discountAmount || 0;

  // Calcular total dos itens adicionais do checkout selecionados
  const checkoutItemsTotal = checkoutItems
    .filter(item => selectedCheckoutItems.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const total = Math.max(0, subtotal + taxaEntrega + checkoutItemsTotal - desconto);

  const troco = valorEntregue ? parseFloat(valorEntregue) - total : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validação automática do endereço com debounce
    if ((name === 'endereco' || name === 'codigoPostal') && value.trim().length > 3) {
      // Limpar timeout anterior se existir
      if ((window as any).addressValidationTimeout) {
        clearTimeout((window as any).addressValidationTimeout);
      }

      // Criar novo timeout para validação após 1.5 segundos
      (window as any).addressValidationTimeout = setTimeout(() => {
        // Construir endereço completo (CEP é opcional)
        const addressParts = name === 'endereco'
          ? [value.trim(), formData.codigoPostal].filter(Boolean)
          : [formData.endereco, value.trim()].filter(Boolean);

        const fullAddress = addressParts.join(', ');

        // Validar se endereço tem tamanho mínimo (CEP agora é opcional)
        if (formData.endereco.length > 10) {
          validateDeliveryAddress(fullAddress);
        }
      }, 1500);
    } else if ((name === 'endereco' || name === 'codigoPostal') && value.trim().length <= 3) {
      // Limpar validação se o endereço for muito curto
      setDeliveryValidation(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const response = await fetch('/api/promocoes/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartTotal: subtotal,
          customerEmail: formData.email,
          productIds: items.map(item => item.productId),
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon({
          id: data.promotion.id,
          code: data.promotion.code,
          name: data.promotion.name,
          discountAmount: data.promotion.discountAmount,
        });
        toast.success(`Cupom "${data.promotion.code}" aplicado! Desconto: €${data.promotion.discountAmount.toFixed(2)}`);
      } else {
        toast.error(data.error || 'Cupom inválido');
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      toast.error('Erro ao validar cupom');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupom removido');
  };

  // Alternar seleção de item adicional do checkout
  const toggleCheckoutItem = (itemId: string) => {
    setSelectedCheckoutItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Obter localização do usuário (GPS)
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        toast.success('Localização obtida com sucesso!');

        // Validar automaticamente após obter localização
        validateDeliveryWithCoords(latitude, longitude);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        toast.info('Não foi possível obter sua localização. Por favor, digite o endereço completo.');
      }
    );
  };

  // Validar endereço de entrega com coordenadas
  const validateDeliveryWithCoords = async (lat: number, lng: number) => {
    setIsValidatingAddress(true);
    try {
      const response = await fetch('/api/validate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await response.json();
      setDeliveryValidation(data);

      if (data.isValid) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Endereço fora da área de entrega');
      }
    } catch (error) {
      console.error('Erro ao validar endereço:', error);
      toast.error('Erro ao validar endereço');
    } finally {
      setIsValidatingAddress(false);
    }
  };

  // Validar endereço de entrega com texto
  const validateDeliveryAddress = async (address?: string) => {
    const addressToValidate = address || formData.endereco.trim();

    if (!addressToValidate) {
      return;
    }

    setIsValidatingAddress(true);
    try {
      const response = await fetch('/api/delivery/check-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: addressToValidate,
        }),
      });

      const data = await response.json();

      // Mapear resposta da API para formato esperado
      setDeliveryValidation({
        isValid: data.delivers || false,
        message: data.delivers
          ? `Entregamos em ${data.area?.name || 'sua região'}! Taxa: €${(data.area?.deliveryFee || 0).toFixed(2)}`
          : data.message || 'Desculpe, não entregamos neste endereço.',
        area: data.area,
      });

      // Não mostrar toast automaticamente para validação em tempo real
    } catch (error) {
      console.error('Erro ao validar endereço:', error);
      setDeliveryValidation({
        isValid: false,
        message: 'Erro ao validar endereço. Tente novamente.',
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };

  // Buscar itens adicionais do checkout das configurações
  useEffect(() => {
    const fetchCheckoutItems = async () => {
      try {
        console.log('[Checkout] 📡 Buscando itens adicionais do checkout...');
        // ✅ CORREÇÃO DE SEGURANÇA: Usar rota pública em vez de /api/admin/settings
        const response = await fetch('/api/public/settings');
        console.log('[Checkout] 📡 Response status:', response.status);

        if (response.ok) {
          const settings = await response.json();
          console.log('[Checkout] 📦 checkoutAdditionalItems:', settings.checkoutAdditionalItems);

          const items: CheckoutAdditionalItem[] = settings.checkoutAdditionalItems || [];

          // Filtrar apenas itens ativos
          const activeItems = items.filter(item => item.isActive);
          console.log('[Checkout] ✅ Itens ativos:', activeItems.length);
          setCheckoutItems(activeItems);

          // Pré-selecionar itens obrigatórios
          const required = new Set(
            activeItems
              .filter(item => item.isRequired)
              .map(item => item.id)
          );
          setSelectedCheckoutItems(required);
        }
      } catch (error) {
        console.error('Erro ao buscar itens do checkout:', error);
      }
    };

    fetchCheckoutItems();
  }, []);

  // Carregar localização do usuário ao montar o componente
  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track begin_checkout event when page loads
  useEffect(() => {
    if (items.length > 0) {
      console.log('[Checkout] Disparando evento begin_checkout');

      trackEvent('begin_checkout', {
        value: total,
        currency: 'EUR',
        items: items.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }).catch(err => console.error('[Checkout] Erro ao disparar tracking:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se o endereço foi validado
    if (!deliveryValidation || !deliveryValidation.isValid) {
      toast.error('Por favor, valide seu endereço de entrega antes de finalizar o pedido');
      return;
    }

    setIsSubmitting(true);

    try {
      // Construir endereço completo (CEP é opcional)
      const addressParts = [formData.endereco, formData.codigoPostal].filter(Boolean);
      const fullAddress = addressParts.join(', ');

      // Itens adicionais do checkout selecionados
      const selectedCheckoutItemsData = checkoutItems
        .filter(item => selectedCheckoutItems.has(item.id))
        .map(item => ({ name: item.name, price: item.price }));

      // Combinar itens do carrinho com itens do checkout
      const allAdditionalItems = [
        ...additionalItems.map(item => ({ name: item.name, price: item.price })),
        ...selectedCheckoutItemsData,
      ];

      const orderData = {
        customerName: formData.nome,
        customerSurname: formData.sobrenome,
        customerEmail: formData.email,
        customerPhone: formData.telefone,
        address: fullAddress,
        nif: formData.nif,
        paymentMethod: paymentMethod.toUpperCase(),
        observations: formData.observacoes,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          options: item.selectedOptions,
        })),
        subtotal,
        deliveryFee: taxaEntrega,
        discount: desconto,
        couponCode: appliedCoupon?.code || null,
        promotionId: appliedCoupon?.id || null,
        additionalItems: allAdditionalItems,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      console.log('[Checkout] 📡 Response status:', response.status);
      console.log('[Checkout] 📡 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('[Checkout] ✅ Pedido criado com sucesso:', result);

        // Limpar carrinho
        clearCart();

        // ✅ CORREÇÃO DE SEGURANÇA: Passar orderId na URL (não sessionStorage)
        // Redirecionar para página de obrigado com orderId validado
        console.log('[Checkout] 🔄 Redirecionando para /obrigado?orderId=', result.order.id);
        router.push(`/obrigado?orderId=${result.order.id}`);
      } else {
        const errorData = await response.json();
        console.error('[Checkout] ❌ Erro ao criar pedido:', errorData);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 py-10 sm:px-10 md:px-20 lg:px-40">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#333333] dark:text-[#f5f1e9]">
                Finalizar Pedido
              </h1>
            </div>

            {/* Resumo Mobile - Sempre Visível */}
            <div className="md:hidden mx-4 mb-4">
              <div className="rounded-lg border border-[#ead9cd] dark:border-[#4a3c30] bg-white dark:bg-[#2a1e14] p-4 shadow-sm">
                <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9] mb-4">Resumo do Pedido</h3>
                <div className="space-y-3 border-b border-[#ead9cd] dark:border-[#4a3c30] pb-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={item.image || '/placeholder-product.png'}
                            alt={item.name}
                            fill
                            className="rounded-md object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                            {item.quantity}x {item.name}
                          </span>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.selectedOptions.map(opt => (
                                <div key={opt.optionId} className="text-xs text-[#a16b45]">
                                  {opt.choices.map((choice: any) => (
                                    <div key={choice.choiceId}>
                                      • {choice.choiceName}
                                      {choice.price > 0 && (
                                        <span className="text-[#FF6B00] ml-1">
                                          +€{choice.price.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9] flex-shrink-0">
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {additionalItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex w-12 h-12 flex-shrink-0 items-center justify-center rounded-md bg-[#FF6B00]/10">
                          <span className="text-xl">🛍️</span>
                        </div>
                        <span className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9] flex-shrink-0">
                        €{item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm text-[#333333]/80 dark:text-[#f5f1e9]/80">
                    <span>Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#333333]/80 dark:text-[#f5f1e9]/80">
                    <span>Taxa de Entrega</span>
                    <span>€{taxaEntrega.toFixed(2)}</span>
                  </div>
                  {checkoutItems
                    .filter(item => selectedCheckoutItems.has(item.id))
                    .map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>{item.name}</span>
                        <span>€{item.price.toFixed(2)}</span>
                      </div>
                    ))
                  }
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span>-€{appliedCoupon.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-sm text-[#333333]/80 dark:text-[#f5f1e9]/80">
                    <span>IVA ({taxaIVA}% incluído)</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#333333] dark:text-[#f5f1e9]">
                    <span>Total</span>
                    <span className="text-[#FF6B00]">€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end text-xs text-[#a16b45]">
                    <span>(IVA incluído)</span>
                  </div>
                </div>
              </div>
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
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <main className="col-span-1 flex flex-col gap-8 md:col-span-2">
                  {/* Dados do Cliente */}
                  <div className="flex flex-col">
                    <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#333333] dark:text-[#f5f1e9]">
                      Seus Dados
                    </h2>
                    <div className="grid grid-cols-1 gap-4 px-4 py-3 sm:grid-cols-2">
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Nome*
                        </p>
                        <input
                          required
                          name="nome"
                          value={formData.nome}
                          onChange={handleInputChange}
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Digite seu nome"
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Sobrenome*
                        </p>
                        <input
                          required
                          name="sobrenome"
                          value={formData.sobrenome}
                          onChange={handleInputChange}
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Digite seu sobrenome"
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          E-mail*
                        </p>
                        <input
                          required
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="seu.email@exemplo.com"
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Telefone*
                        </p>
                        <input
                          required
                          type="tel"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleInputChange}
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="+351 XXX XXX XXX"
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Endereço Completo*
                        </p>
                        <div className="relative">
                          <input
                            required
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleInputChange}
                            className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] pr-12 text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                            placeholder="Rua, Número, Bairro"
                          />
                          {isValidatingAddress && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FF6B00] border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Código Postal <span className="text-sm font-normal text-[#333333]/70 dark:text-[#f5f1e9]/70">(Opcional)</span>
                        </p>
                        <input
                          name="codigoPostal"
                          value={formData.codigoPostal}
                          onChange={handleInputChange}
                          maxLength={8}
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="2690-XXX"
                        />
                      </label>
                      <div className="sm:col-span-2">
                        {/* Mensagem de validação */}
                        {deliveryValidation && (
                          <div
                            className={`mt-2 flex items-start gap-2 rounded-lg border p-3 ${
                              deliveryValidation.isValid
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            }`}
                          >
                            <span className="text-lg">
                              {deliveryValidation.isValid ? '✓' : '✗'}
                            </span>
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  deliveryValidation.isValid
                                    ? 'text-green-700 dark:text-green-400'
                                    : 'text-red-700 dark:text-red-400'
                                }`}
                              >
                                {deliveryValidation.message}
                              </p>
                              {deliveryValidation.isValid && deliveryValidation.area && (
                                <div className="mt-1 text-xs text-green-600 dark:text-green-500">
                                  <p>Área: {deliveryValidation.area.name}</p>
                                  <p>
                                    Taxa de entrega:{' '}
                                    {deliveryValidation.area.deliveryType === 'FREE'
                                      ? 'Grátis'
                                      : `€${deliveryValidation.area.deliveryFee.toFixed(2)}`}
                                  </p>
                                  {deliveryValidation.area.minOrderValue && (
                                    <p>
                                      Pedido mínimo: €{deliveryValidation.area.minOrderValue.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Botão para obter localização GPS */}
                        {!userLocation && (
                          <button
                            type="button"
                            onClick={getUserLocation}
                            className="mt-2 flex items-center gap-2 text-sm text-[#FF6B00] hover:underline"
                          >
                            <span>📍</span>
                            Usar minha localização atual
                          </button>
                        )}
                      </div>
                      <label className="flex flex-col sm:col-span-2">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          NIF <span className="text-sm font-normal text-[#333333]/70 dark:text-[#f5f1e9]/70">(Opcional)</span>
                        </p>
                        <input
                          name="nif"
                          value={formData.nif}
                          onChange={handleInputChange}
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Digite seu NIF"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="flex flex-col">
                    <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#333333] dark:text-[#f5f1e9]">
                      Forma de Pagamento
                    </h2>
                    <div className="space-y-4 px-4 py-3">
                      <div className={`flex flex-col gap-4 rounded-lg border p-4 ${paymentMethod === 'cash' ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/50' : 'border-[#ead9cd] dark:border-[#5a4a3e]'}`}>
                        <div className="flex items-center gap-4">
                          <input
                            checked={paymentMethod === 'cash'}
                            onChange={() => setPaymentMethod('cash')}
                            className="h-5 w-5 border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00]"
                            id="payment-cash"
                            name="payment-method"
                            type="radio"
                          />
                          <label className="flex-1 text-base font-medium cursor-pointer text-[#333333] dark:text-[#f5f1e9]" htmlFor="payment-cash">
                            Dinheiro
                          </label>
                        </div>
                        {paymentMethod === 'cash' && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                            <label className="flex flex-1 flex-col">
                              <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                                Valor entregue <span className="text-sm font-normal text-[#333333]/70 dark:text-[#f5f1e9]/70">(Opcional)</span>
                              </p>
                              <input
                                type="number"
                                step="0.01"
                                value={valorEntregue}
                                onChange={(e) => setValorEntregue(e.target.value)}
                                className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                                placeholder="Ex: €50,00"
                              />
                            </label>
                            {valorEntregue && troco >= 0 && (
                              <div className="flex h-14 items-center rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9]/50 dark:bg-[#23170f]/50 px-4">
                                <p className="text-base text-[#333333] dark:text-[#f5f1e9]">
                                  Troco: <span className="font-bold">€{troco.toFixed(2)}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-4 rounded-lg border p-4 ${paymentMethod === 'mbway' ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/50' : 'border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f]'}`}>
                        <input
                          checked={paymentMethod === 'mbway'}
                          onChange={() => setPaymentMethod('mbway')}
                          className="h-5 w-5 border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00]"
                          id="payment-mbway"
                          name="payment-method"
                          type="radio"
                        />
                        <label className="flex-1 text-base font-medium cursor-pointer text-[#333333] dark:text-[#f5f1e9]" htmlFor="payment-mbway">
                          Multibanco Na Entrega
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Itens Adicionais do Checkout */}
                  {checkoutItems.length > 0 && (
                    <div className="flex flex-col">
                      <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#333333] dark:text-[#f5f1e9]">
                        Itens Adicionais
                      </h2>
                      <div className="space-y-3 px-4 py-3">
                        {checkoutItems.map((item) => {
                          const isSelected = selectedCheckoutItems.has(item.id);
                          const isDisabled = item.isRequired; // Obrigatórios não podem ser desmarcados

                          return (
                            <label
                              key={item.id}
                              className={`flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors ${
                                item.isRequired
                                  ? 'border-[#FF6B00] bg-[#FF6B00]/5 cursor-default'
                                  : isSelected
                                  ? 'border-[#FF6B00] bg-[#FF6B00]/5 cursor-pointer'
                                  : 'border-[#ead9cd] dark:border-[#5a4a3e] hover:border-[#FF6B00]/50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  onChange={() => !isDisabled && toggleCheckoutItem(item.id)}
                                  className="h-5 w-5 rounded border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div>
                                  <p className="text-base font-medium text-[#333333] dark:text-[#f5f1e9]">
                                    {item.name}
                                    {item.isRequired && (
                                      <span className="ml-2 text-xs font-normal text-[#a16b45]">
                                        (Obrigatório)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <span className="text-base font-bold text-[#FF6B00]">
                                +€{item.price.toFixed(2)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detalhes do Pedido */}
                  <div className="flex flex-col">
                    <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#333333] dark:text-[#f5f1e9]">
                      Detalhes do Pedido
                    </h2>
                    <div className="space-y-4 px-4 py-3">
                      {/* Cupom de Desconto */}
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-lg border border-green-500 bg-green-50 dark:bg-green-900/20 p-4">
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">
                              Cupom aplicado: {appliedCoupon.code}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-500">
                              Desconto: -€{appliedCoupon.discountAmount.toFixed(2)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-end gap-3">
                          <label className="flex flex-1 flex-col">
                            <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                              Cupom de Desconto
                            </p>
                            <input
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                              placeholder="Insira seu cupom"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon}
                            className="flex h-14 items-center justify-center rounded-lg bg-[#FF6B00]/20 px-6 text-base font-bold text-[#FF6B00] transition-colors hover:bg-[#FF6B00]/30 dark:bg-[#FF6B00]/30 dark:hover:bg-[#FF6B00]/40 disabled:opacity-50"
                          >
                            {isApplyingCoupon ? 'Validando...' : 'Aplicar'}
                          </button>
                        </div>
                      )}
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Observações
                        </p>
                        <textarea
                          name="observacoes"
                          value={formData.observacoes}
                          onChange={handleInputChange}
                          className="form-textarea w-full resize-y rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-4 text-base font-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Ex: Sem wasabi, menos molho de soja, sem gengibre, sem cebolinho, etc."
                          rows={4}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Botão Finalizar */}
                  <div className="flex flex-col gap-6 px-4 py-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-14 w-full rounded-lg bg-[#FF6B00] text-lg font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processando...' : 'Finalizar Pedido'}
                    </button>
                  </div>
                </main>

                {/* Resumo */}
                <aside className="col-span-1 hidden md:block">
                  <div className="sticky top-10 rounded-xl border border-[#ead9cd] dark:border-[#4a3c30] bg-white dark:bg-[#2a1e14] p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">Resumo do Pedido</h3>
                    <div className="mt-6 space-y-4 border-b border-[#ead9cd] dark:border-[#4a3c30] pb-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14">
                              <Image
                                src={item.image || '/placeholder-product.png'}
                                alt={item.name}
                                fill
                                className="rounded-md object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                                {item.quantity}x {item.name}
                              </span>
                              {item.selectedOptions && item.selectedOptions.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.selectedOptions.map(opt => (
                                    <div key={opt.optionId} className="text-xs text-[#a16b45]">
                                      {opt.choices.map((choice: any, idx: number) => (
                                        <div key={choice.choiceId}>
                                          • {choice.choiceName}
                                          {choice.price > 0 && (
                                            <span className="text-[#FF6B00] ml-1">
                                              +€{choice.price.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {additionalItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex w-14 h-14 items-center justify-center rounded-md bg-[#FF6B00]/10">
                              <span className="text-2xl">🛍️</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                                {item.name}
                              </span>
                            </div>
                          </div>
                          <span className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                            €{item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Subtotal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Taxa de Entrega</span>
                        <span>€{taxaEntrega.toFixed(2)}</span>
                      </div>
                      {checkoutItems
                        .filter(item => selectedCheckoutItems.has(item.id))
                        .map((item) => (
                          <div key={item.id} className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                            <span>{item.name}</span>
                            <span>€{item.price.toFixed(2)}</span>
                          </div>
                        ))
                      }
                      {appliedCoupon && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Desconto ({appliedCoupon.code})</span>
                          <span>-€{appliedCoupon.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>IVA ({taxaIVA}% incluído)</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
                        <span>Total</span>
                        <span className="text-[#FF6B00]">€{total.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex justify-end text-xs text-[#a16b45]">
                        <span>(IVA incluído)</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-[#f5f1e9] dark:bg-[#23170f] p-8 text-center shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <span className="text-4xl text-green-600 dark:text-green-400">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">Pedido Recebido!</h2>
            <p className="text-[#333333]/80 dark:text-[#f5f1e9]/80">
              Seu pedido está aguardando confirmação do restaurante. Você receberá uma notificação assim que for aceito.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 h-12 w-full rounded-lg bg-[#FF6B00] font-bold text-white hover:opacity-90 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Erro */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-[#f5f1e9] dark:bg-[#23170f] p-8 text-center shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <span className="text-4xl text-red-600 dark:text-red-400">✕</span>
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">Pedido Não Confirmado</h2>
            <p className="text-[#333333]/80 dark:text-[#f5f1e9]/80">
              Lamentamos, mas não podemos aceitar seu pedido no momento devido à alta demanda.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-4 h-12 w-full rounded-lg bg-[#FF6B00] font-bold text-white hover:opacity-90 transition-opacity"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

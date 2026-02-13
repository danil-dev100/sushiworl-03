// Tipos para matching de promoções no frontend

interface CartData {
  productIds: string[];
  cartTotal: number;
}

interface Promotion {
  triggerType: string | null;
  triggerValue: string | null;
  minOrderValue: number | null;
}

/**
 * Verifica se uma promoção deve ser exibida com base no carrinho atual.
 */
export function shouldShowPromotion(promotion: Promotion, cartData: CartData): boolean {
  const { triggerType, triggerValue, minOrderValue } = promotion;

  // Verificar valor mínimo do pedido (se configurado)
  if (minOrderValue !== null && cartData.cartTotal < minOrderValue) {
    return false;
  }

  // Sem trigger = sempre exibir
  if (!triggerType) {
    return true;
  }

  switch (triggerType) {
    case 'PRODUCT':
      // Carrinho contém o produto específico
      return triggerValue ? cartData.productIds.includes(triggerValue) : true;

    case 'CATEGORY':
      // Trigger por categoria - sem acesso à categoria dos itens no frontend,
      // exibir sempre (o admin configura pelo ID da categoria)
      return true;

    case 'CART':
      // Carrinho tem itens
      return cartData.productIds.length > 0;

    case 'CART_VALUE':
      // Total do carrinho atinge o valor mínimo
      if (!triggerValue) return true;
      return cartData.cartTotal >= parseFloat(triggerValue);

    default:
      return true;
  }
}

/**
 * Calcula o preço com desconto aplicado.
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountType: string,
  discountValue: number
): number {
  if (discountType === 'FIXED') {
    return Math.max(0, originalPrice - discountValue);
  }

  if (discountType === 'PERCENTAGE') {
    return Math.max(0, originalPrice * (1 - discountValue / 100));
  }

  return originalPrice;
}

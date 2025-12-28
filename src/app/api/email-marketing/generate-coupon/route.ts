import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * API para gerar cupom automático de carrinho abandonado
 * POST /api/email-marketing/generate-coupon
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      discountPercentage,
      freeShipping,
      validityHours = 24,
      flowId,
    } = body;

    // Validações
    if (!customerEmail || typeof customerEmail !== 'string') {
      return NextResponse.json(
        { error: 'Email do cliente é obrigatório' },
        { status: 400 }
      );
    }

    if (!discountPercentage && !freeShipping) {
      return NextResponse.json(
        { error: 'Desconto ou frete grátis deve ser definido' },
        { status: 400 }
      );
    }

    if (discountPercentage && (discountPercentage < 1 || discountPercentage > 100)) {
      return NextResponse.json(
        { error: 'Desconto deve estar entre 1 e 100' },
        { status: 400 }
      );
    }

    // Gerar código único de cupom
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const couponCode = `CART${timestamp}${random}`.toUpperCase();

    // Calcular data de expiração
    const now = new Date();
    const validUntil = new Date(now.getTime() + validityHours * 60 * 60 * 1000);

    // Criar promoção/cupom no banco
    const promotion = await prisma.promotion.create({
      data: {
        name: `Cupom Carrinho Abandonado - ${customerEmail}`,
        code: couponCode,
        type: 'COUPON',
        discountType: discountPercentage ? 'PERCENTAGE' : 'FIXED',
        discountValue: discountPercentage || 0,
        minOrderValue: null,
        usageLimit: 1, // Cupom único, uma vez só
        isActive: true,
        isFirstPurchaseOnly: false,
        validFrom: now,
        validUntil: validUntil,
        displayMessage: freeShipping
          ? `Frete grátis${discountPercentage ? ` + ${discountPercentage}% de desconto` : ''}`
          : `${discountPercentage}% de desconto`,
        // Metadata para rastreamento
        triggerType: 'CART',
        triggerValue: flowId || 'abandoned-cart',
      },
    });

    // Logar geração do cupom
    console.log('[Email Marketing] Cupom gerado:', {
      code: couponCode,
      email: customerEmail,
      discount: discountPercentage,
      freeShipping,
      validUntil,
    });

    return NextResponse.json({
      success: true,
      coupon: {
        code: couponCode,
        discountPercentage,
        freeShipping,
        validUntil,
        promotionId: promotion.id,
      },
    });
  } catch (error) {
    console.error('[Email Marketing] Erro ao gerar cupom:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar cupom automático' },
      { status: 500 }
    );
  }
}

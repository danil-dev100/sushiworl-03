import { NextRequest, NextResponse } from 'next/server';

/**
 * API para gerar link de checkout com cupom aplicado
 * POST /api/email-marketing/generate-checkout-link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      couponCode,
      cartId,
    } = body;

    // Validações
    if (!customerEmail || typeof customerEmail !== 'string') {
      return NextResponse.json(
        { error: 'Email do cliente é obrigatório' },
        { status: 400 }
      );
    }

    if (!couponCode || typeof couponCode !== 'string') {
      return NextResponse.json(
        { error: 'Código do cupom é obrigatório' },
        { status: 400 }
      );
    }

    // Construir URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Criar query params
    const params = new URLSearchParams({
      coupon: couponCode,
      email: customerEmail,
    });

    if (cartId) {
      params.append('restore', cartId);
    }

    // Gerar link completo
    const checkoutLink = `${baseUrl}/checkout?${params.toString()}`;

    // Logar geração do link
    console.log('[Email Marketing] Link de checkout gerado:', {
      email: customerEmail,
      coupon: couponCode,
      link: checkoutLink,
    });

    return NextResponse.json({
      success: true,
      checkoutLink,
    });
  } catch (error) {
    console.error('[Email Marketing] Erro ao gerar link de checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar link de checkout' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, customerEmail, productIds } = body;

    if (!code) {
      return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 });
    }

    // Buscar promoção pelo código
    const promotion = await prisma.promotion.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        type: 'COUPON',
      },
      include: {
        promotionItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!promotion) {
      return NextResponse.json({ error: 'Cupom não encontrado ou inválido' }, { status: 404 });
    }

    // Verificar datas de validade
    const now = new Date();
    if (promotion.validFrom && new Date(promotion.validFrom) > now) {
      return NextResponse.json({ error: 'Este cupom ainda não está ativo' }, { status: 400 });
    }

    if (promotion.validUntil && new Date(promotion.validUntil) < now) {
      return NextResponse.json({ error: 'Este cupom expirou' }, { status: 400 });
    }

    // Verificar limite de usos
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return NextResponse.json({ error: 'Este cupom atingiu o limite de utilizações' }, { status: 400 });
    }

    // Verificar valor mínimo do pedido
    if (promotion.minOrderValue && cartTotal < promotion.minOrderValue) {
      return NextResponse.json({
        error: `Valor mínimo do pedido para este cupom é €${promotion.minOrderValue.toFixed(2)}`,
      }, { status: 400 });
    }

    // Verificar se é apenas para primeira compra
    if (promotion.isFirstPurchaseOnly && customerEmail) {
      const previousOrders = await prisma.order.count({
        where: {
          customerEmail,
          status: {
            notIn: ['CANCELLED'],
          },
        },
      });

      if (previousOrders > 0) {
        return NextResponse.json({ error: 'Este cupom é válido apenas para a primeira compra' }, { status: 400 });
      }
    }

    // Verificar se o cupom se aplica aos produtos no carrinho
    if (promotion.promotionItems && promotion.promotionItems.length > 0) {
      const promotionProductIds = promotion.promotionItems.map(item => item.productId);
      const hasApplicableProduct = productIds?.some((id: string) => promotionProductIds.includes(id));

      if (!hasApplicableProduct) {
        return NextResponse.json({
          error: 'Este cupom não se aplica aos produtos no seu carrinho',
        }, { status: 400 });
      }
    }

    // Calcular desconto
    let discountAmount = 0;
    if (promotion.discountType === 'FIXED') {
      discountAmount = promotion.discountValue;
    } else if (promotion.discountType === 'PERCENTAGE') {
      discountAmount = (cartTotal * promotion.discountValue) / 100;
    }

    // Limitar desconto ao valor do carrinho
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    return NextResponse.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        discountAmount: Number(discountAmount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('[Validar Cupom API] Erro:', error);
    return NextResponse.json({ error: 'Erro ao validar cupom' }, { status: 500 });
  }
}

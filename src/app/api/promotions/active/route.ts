import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const VALID_TYPES = ['ORDER_BUMP', 'UP_SELL', 'DOWN_SELL'] as const;

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.API);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Validar tipo se fornecido
    if (type && !VALID_TYPES.includes(type as any)) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido' },
        { status: 400 }
      );
    }

    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        type: type
          ? (type as any)
          : { in: [...VALID_TYPES] },
        OR: [
          { validFrom: null, validUntil: null },
          { validFrom: null, validUntil: { gte: now } },
          { validFrom: { lte: now }, validUntil: null },
          { validFrom: { lte: now }, validUntil: { gte: now } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        title: true,
        description: true,
        imageUrl: true,
        discountType: true,
        discountValue: true,
        minOrderValue: true,
        triggerType: true,
        triggerValue: true,
        suggestedProductId: true,
        displayMessage: true,
        // Campos internos para filtragem server-side (NÃO incluir na resposta)
        usageLimit: true,
        usageCount: true,
      },
    });

    // Filtrar promoções que atingiram o limite de uso (server-side only)
    const validPromotions = promotions.filter((p) => {
      if (p.usageLimit !== null && p.usageCount >= p.usageLimit) {
        return false;
      }
      return true;
    });

    // Buscar produtos sugeridos
    const productIds = validPromotions
      .map((p) => p.suggestedProductId)
      .filter((id): id is string => id !== null);

    const products = productIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: { in: productIds },
            status: 'AVAILABLE',
            isVisible: true,
          },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        })
      : [];

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Montar resposta: excluir usageLimit, usageCount, suggestedProductId da saída
    const result = validPromotions.map(({
      usageLimit: _ul,
      usageCount: _uc,
      suggestedProductId,
      ...publicFields
    }) => ({
      ...publicFields,
      suggestedProduct: suggestedProductId
        ? productMap.get(suggestedProductId) || null
        : null,
    }));

    // Filtrar promoções cujo produto sugerido não existe ou não está disponível
    const finalPromotions = result.filter((p) => p.suggestedProduct !== null);

    return NextResponse.json(
      { success: true, promotions: finalPromotions },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar promoções ativas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar promoções' },
      { status: 500 }
    );
  }
}

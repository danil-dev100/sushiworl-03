import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        promotionItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('[Promotions API][GET] Erro ao listar promoções:', error);
    return NextResponse.json(
      { error: 'Erro ao listar promoções' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      code,
      type,
      discountType,
      discountValue,
      minOrderValue,
      usageLimit,
      triggerType,
      triggerValue,
      suggestedProductId,
      displayMessage,
      isActive,
      isFirstPurchaseOnly,
      validFrom,
      validUntil,
      promotionItems,
    } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Nome da promoção é obrigatório' },
        { status: 400 }
      );
    }

    if (!type || !['COUPON', 'FIRST_PURCHASE', 'ORDER_BUMP', 'UP_SELL', 'DOWN_SELL'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de promoção inválido' },
        { status: 400 }
      );
    }

    if (!discountType || !['FIXED', 'PERCENTAGE'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Tipo de desconto inválido' },
        { status: 400 }
      );
    }

    const parsedDiscountValue = Number(discountValue);

    if (!Number.isFinite(parsedDiscountValue) || parsedDiscountValue <= 0) {
      return NextResponse.json(
        { error: 'Valor do desconto deve ser maior que zero' },
        { status: 400 }
      );
    }

    let parsedUsageLimit: number | null = null;
    if (usageLimit !== null && usageLimit !== undefined && usageLimit !== '') {
      parsedUsageLimit = Number(usageLimit);
      if (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit <= 0) {
        return NextResponse.json(
          { error: 'Limite de uso deve ser um número inteiro positivo' },
          { status: 400 }
        );
      }
    }

    let parsedMinOrderValue: number | null = null;
    if (
      minOrderValue !== null &&
      minOrderValue !== undefined &&
      minOrderValue !== ''
    ) {
      parsedMinOrderValue = Number(minOrderValue);
      if (!Number.isFinite(parsedMinOrderValue) || parsedMinOrderValue < 0) {
        return NextResponse.json(
          { error: 'Valor mínimo deve ser maior ou igual a zero' },
          { status: 400 }
        );
      }
    }

    const data: any = {
      name,
      code: code ? code.trim() : null,
      type,
      discountType,
      discountValue: parsedDiscountValue,
      minOrderValue: parsedMinOrderValue,
      usageLimit: parsedUsageLimit,
      triggerType: triggerType ?? null,
      triggerValue: triggerValue ? String(triggerValue) : null,
      suggestedProductId: suggestedProductId || null,
      displayMessage: displayMessage ? String(displayMessage) : null,
      isActive: Boolean(isActive),
      isFirstPurchaseOnly: Boolean(isFirstPurchaseOnly),
      validFrom: parseDate(validFrom),
      validUntil: parseDate(validUntil),
    };

    const createData: any = {
      data,
      include: {
        promotionItems: {
          include: {
            product: true,
          },
        },
      },
    };

    if (Array.isArray(promotionItems) && promotionItems.length > 0) {
      createData.data.promotionItems = {
        create: promotionItems
          .filter((productId: unknown) => typeof productId === 'string')
          .map((productId: string) => ({
            product: {
              connect: { id: productId },
            },
          })),
      };
    }

    const promotion = await prisma.promotion.create(createData);

    revalidatePath('/admin/marketing/promocoes');

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error('[Promotions API][POST] Erro ao criar promoção:', error);
    return NextResponse.json(
      { error: 'Erro ao criar promoção' },
      { status: 500 }
    );
  }
}


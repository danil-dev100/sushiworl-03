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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const promotionId = params.id;

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

    const data: Record<string, unknown> = {};

    if (typeof name === 'string') data.name = name;
    if (typeof code === 'string' || code === null) data.code = code?.trim() || null;
    if (
      type &&
      ['COUPON', 'FIRST_PURCHASE', 'ORDER_BUMP', 'UP_SELL', 'DOWN_SELL'].includes(
        type
      )
    ) {
      data.type = type;
    }
    if (discountType && ['FIXED', 'PERCENTAGE'].includes(discountType)) {
      data.discountType = discountType;
    }
    if (discountValue !== undefined) {
      const parsed = Number(discountValue);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: 'Valor do desconto deve ser maior que zero' },
          { status: 400 }
        );
      }
      data.discountValue = parsed;
    }

    if (minOrderValue !== undefined) {
      if (minOrderValue === null || minOrderValue === '') {
        data.minOrderValue = null;
      } else {
        const parsed = Number(minOrderValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
          return NextResponse.json(
            { error: 'Valor mínimo deve ser maior ou igual a zero' },
            { status: 400 }
          );
        }
        data.minOrderValue = parsed;
      }
    }

    if (usageLimit !== undefined) {
      if (usageLimit === null || usageLimit === '') {
        data.usageLimit = null;
      } else {
        const parsed = Number(usageLimit);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          return NextResponse.json(
            { error: 'Limite de uso deve ser um inteiro positivo' },
            { status: 400 }
          );
        }
        data.usageLimit = parsed;
      }
    }

    if (triggerType === null || triggerType === undefined) {
      // se enviado null, limpar
      if ('triggerType' in body) {
        data.triggerType = null;
      }
    } else if (['PRODUCT', 'CATEGORY', 'CART', 'CART_VALUE'].includes(triggerType)) {
      data.triggerType = triggerType;
    }

    if ('triggerValue' in body) {
      if (triggerValue === null || triggerValue === undefined || triggerValue === '') {
        data.triggerValue = null;
      } else {
        data.triggerValue = String(triggerValue);
      }
    }

    if ('suggestedProductId' in body) {
      data.suggestedProductId =
        suggestedProductId === null || suggestedProductId === ''
          ? null
          : suggestedProductId;
    }

    if ('displayMessage' in body) {
      data.displayMessage =
        displayMessage === null || displayMessage === ''
          ? null
          : String(displayMessage);
    }

    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (typeof isFirstPurchaseOnly === 'boolean') {
      data.isFirstPurchaseOnly = isFirstPurchaseOnly;
    }

    if ('validFrom' in body) {
      data.validFrom = parseDate(validFrom);
    }

    if ('validUntil' in body) {
      data.validUntil = parseDate(validUntil);
    }

    const updatePayload: any = {
      data,
      where: { id: promotionId },
      include: {
        promotionItems: {
          include: {
            product: true,
          },
        },
      },
    };

    if (promotionItems) {
      if (!Array.isArray(promotionItems)) {
        return NextResponse.json(
          { error: 'Itens da promoção devem ser uma lista de produtos' },
          { status: 400 }
        );
      }

      updatePayload.data.promotionItems = {
        deleteMany: {},
        create:
          promotionItems
            .filter((productId: unknown) => typeof productId === 'string')
            .map((productId: string) => ({
              product: {
                connect: { id: productId },
              },
            })) ?? [],
      };
    }

    const promotion = await prisma.promotion.update(updatePayload);

    revalidatePath('/admin/marketing/promocoes');

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('[Promotions API][PATCH] Erro ao atualizar promoção:', error);

    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Promoção não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar promoção' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await prisma.promotion.delete({
      where: { id: params.id },
    });

    revalidatePath('/admin/marketing/promocoes');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Promotions API][DELETE] Erro ao remover promoção:', error);

    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Promoção não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao remover promoção' },
      { status: 500 }
    );
  }
}


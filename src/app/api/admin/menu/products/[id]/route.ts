import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;

    const product = await prisma.product.update({
      where: { id },
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description,
        price: body.price,
        discountPrice: body.discountPrice,
        category: body.category,
        imageUrl: body.imageUrl,
        ogImageUrl: body.ogImageUrl,
        ogDescription: body.ogDescription,
        isVisible: body.isVisible,
        isFeatured: body.isFeatured,
        isTopSeller: body.isTopSeller,
        outOfStock: body.outOfStock,
        availableUntil: body.availableUntil ? new Date(body.availableUntil) : null,
        isHot: body.isHot,
        isHalal: body.isHalal,
        isVegan: body.isVegan,
        isVegetarian: body.isVegetarian,
        isDairyFree: body.isDairyFree,
        isRaw: body.isRaw,
        isGlutenFree: body.isGlutenFree,
        isNutFree: body.isNutFree,
        ingredients: body.ingredients,
        additives: body.additives,
        allergens: body.allergens,
        tags: body.tags,
        nutritionPer: body.nutritionPer,
        calories: body.calories,
        carbs: body.carbs,
        totalFat: body.totalFat,
        protein: body.protein,
        sugar: body.sugar,
        salt: body.salt,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[Products API] Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Products API] Erro ao remover produto:', error);
    return NextResponse.json({ error: 'Erro ao remover produto' }, { status: 500 });
  }
}


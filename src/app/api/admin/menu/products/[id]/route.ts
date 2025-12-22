import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = await params;

    // Validação dos campos de ordem (1, 2 ou 3)
    if (body.featuredOrder !== undefined && body.featuredOrder !== null) {
      if (![1, 2, 3].includes(body.featuredOrder)) {
        return NextResponse.json(
          { error: 'featuredOrder deve ser 1, 2, 3 ou null' },
          { status: 400 }
        );
      }
    }

    if (body.bestSellerOrder !== undefined && body.bestSellerOrder !== null) {
      if (![1, 2, 3].includes(body.bestSellerOrder)) {
        return NextResponse.json(
          { error: 'bestSellerOrder deve ser 1, 2, 3 ou null' },
          { status: 400 }
        );
      }
    }

    // Resolução de conflitos: se um produto receber uma posição ocupada,
    // o produto atual dessa posição deve ter sua posição zerada
    if (body.featuredOrder !== undefined && body.featuredOrder !== null) {
      await prisma.product.updateMany({
        where: {
          featuredOrder: body.featuredOrder,
          id: { not: id },
        },
        data: {
          featuredOrder: null,
        },
      });
    }

    if (body.bestSellerOrder !== undefined && body.bestSellerOrder !== null) {
      await prisma.product.updateMany({
        where: {
          bestSellerOrder: body.bestSellerOrder,
          id: { not: id },
        },
        data: {
          bestSellerOrder: null,
        },
      });
    }

    console.log('[API Update Product] featuredOrder:', body.featuredOrder);
    console.log('[API Update Product] bestSellerOrder:', body.bestSellerOrder);

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
        featuredOrder: body.featuredOrder !== undefined ? body.featuredOrder : undefined,
        bestSellerOrder: body.bestSellerOrder !== undefined ? body.bestSellerOrder : undefined,
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

    // Revalidar páginas que mostram produtos
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/admin/cardapio');

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[Products API] Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Products API] Erro ao remover produto:', error);
    return NextResponse.json({ error: 'Erro ao remover produto' }, { status: 500 });
  }
}


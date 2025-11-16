import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Buscar produto original
    const original = await prisma.product.findUnique({
      where: { id },
      include: {
        productOptions: {
          include: {
            choices: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Gerar novo SKU
    let newSku = `${original.sku}-COPY`;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { sku: newSku } })) {
      newSku = `${original.sku}-COPY-${counter}`;
      counter++;
    }

    // Criar cópia
    const product = await prisma.product.create({
      data: {
        sku: newSku,
        name: `${original.name} (Cópia)`,
        description: original.description,
        price: original.price,
        discountPrice: original.discountPrice,
        category: original.category,
        imageUrl: original.imageUrl,
        ogImageUrl: original.ogImageUrl,
        ogDescription: original.ogDescription,
        isVisible: false, // Ocultar por padrão
        isFeatured: original.isFeatured,
        isTopSeller: original.isTopSeller,
        outOfStock: original.outOfStock,
        availableUntil: original.availableUntil,
        isHot: original.isHot,
        isHalal: original.isHalal,
        isVegan: original.isVegan,
        isVegetarian: original.isVegetarian,
        isDairyFree: original.isDairyFree,
        isRaw: original.isRaw,
        isGlutenFree: original.isGlutenFree,
        isNutFree: original.isNutFree,
        ingredients: original.ingredients,
        additives: original.additives,
        allergens: original.allergens,
        tags: original.tags,
        nutritionPer: original.nutritionPer,
        calories: original.calories,
        carbs: original.carbs,
        totalFat: original.totalFat,
        protein: original.protein,
        sugar: original.sugar,
        salt: original.salt,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[Products API] Erro ao duplicar produto:', error);
    return NextResponse.json({ error: 'Erro ao duplicar produto' }, { status: 500 });
  }
}


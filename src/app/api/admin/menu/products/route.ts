import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        productOptions: {
          include: {
            choices: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[Products API] Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar SKU único
    const existingSku = await prisma.product.findUnique({
      where: { sku: body.sku },
    });

    if (existingSku) {
      return NextResponse.json({ error: 'SKU já existe' }, { status: 400 });
    }

    const product = await prisma.product.create({
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
        isVisible: body.isVisible ?? true,
        isFeatured: body.isFeatured ?? false,
        isTopSeller: body.isTopSeller ?? false,
        outOfStock: body.outOfStock ?? false,
        availableUntil: body.availableUntil ? new Date(body.availableUntil) : null,
        isHot: body.isHot ?? false,
        isHalal: body.isHalal ?? false,
        isVegan: body.isVegan ?? false,
        isVegetarian: body.isVegetarian ?? false,
        isDairyFree: body.isDairyFree ?? false,
        isRaw: body.isRaw ?? false,
        isGlutenFree: body.isGlutenFree ?? false,
        isNutFree: body.isNutFree ?? false,
        ingredients: body.ingredients,
        additives: body.additives,
        allergens: body.allergens || [],
        tags: body.tags || [],
        nutritionPer: body.nutritionPer,
        calories: body.calories,
        carbs: body.carbs,
        totalFat: body.totalFat,
        protein: body.protein,
        sugar: body.sugar,
        salt: body.salt,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[Products API] Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}


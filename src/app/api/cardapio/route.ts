import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache: ISR com revalidação a cada 5 minutos
// Reduz invocações na Vercel mantendo dados relativamente frescos
export const revalidate = 300;

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        discountPrice: true,
        category: true,
        imageUrl: true,
        status: true,
        outOfStock: true,
        isHot: true,
        isHalal: true,
        isVegan: true,
        isVegetarian: true,
        isDairyFree: true,
        isRaw: true,
        isGlutenFree: true,
        isNutFree: true,
        isFeatured: true,
        isTopSeller: true,
      },
    });

    const produtosPorCategoria: Record<string, any[]> = {};

    products.forEach((product) => {
      const categoryKey = product.category.toLowerCase().replace(/\s+/g, '-');
      if (!produtosPorCategoria[categoryKey]) {
        produtosPorCategoria[categoryKey] = [];
      }

      produtosPorCategoria[categoryKey].push({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: `€${product.price.toFixed(2)}`,
        discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
        category: product.category,
        image: product.imageUrl,
        status: product.status,
        outOfStock: product.outOfStock,
        isHot: product.isHot,
        isHalal: product.isHalal,
        isVegan: product.isVegan,
        isVegetarian: product.isVegetarian,
        isDairyFree: product.isDairyFree,
        isRaw: product.isRaw,
        isGlutenFree: product.isGlutenFree,
        isNutFree: product.isNutFree,
      });
    });

    produtosPorCategoria['destaques'] = products
      .filter(p => p.isFeatured)
      .map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: `€${product.price.toFixed(2)}`,
        discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
        category: product.category,
        image: product.imageUrl,
        status: product.status,
        outOfStock: product.outOfStock,
      }));

    // Headers de cache para CDN da Vercel
    return NextResponse.json(produtosPorCategoria, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    // Em caso de erro, não cachear
    return NextResponse.json({}, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
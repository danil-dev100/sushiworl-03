import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mapeamento de emojis padrão
const defaultEmojis: Record<string, string> = {
  'Destaques': '⭐',
  'Combinados': '🍣',
  'Hots': '🔥',
  'Entradas': '🍤',
  'Poke Bowl': '🥗',
  'Poke': '🥗',
  'Gunkan': '🍥',
  'Sashimi': '🐟',
  'Nigiri': '🍙',
  'Makis': '🥢',
  'Temaki': '🌯',
  'Hossomaki': '🍙',
  'Uramaki': '🍱',
  'Futomaki': '🍙',
  'Hot roll': '🔥',
  'Bebidas': '🥤',
  'Sobremesas': '🍰',
  'Extras': '➕',
};

// Cache: ISR com revalidação a cada 10 minutos
// Categorias mudam raramente, cache mais longo é seguro
export const revalidate = 600;

// GET - Buscar categorias únicas com emojis
export async function GET() {
  try {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[Categories API] Buscando categorias...');
    }

    // Buscar categorias da tabela categories (com emojis)
    const dbCategories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    });

    // Buscar categorias distintas dos produtos visíveis
    const products = await prisma.product.findMany({
      where: { isVisible: true },
      select: { category: true },
      distinct: ['category'],
    });

    const productCategories = products.map(p => p.category);

    // Criar mapa de categorias com emojis
    const categoriesMap = new Map<string, { name: string; emoji: string; order: number }>();

    // Adicionar categorias da tabela
    dbCategories.forEach((cat) => {
      categoriesMap.set(cat.name, {
        name: cat.name,
        emoji: cat.emoji,
        order: cat.order,
      });
    });

    // Adicionar categorias antigas dos produtos (que não estão na tabela)
    productCategories.forEach((catName) => {
      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, {
          name: catName,
          emoji: defaultEmojis[catName] || '🍽️',
          order: 999, // Colocar no final
        });
      }
    });

    // Converter para array e ordenar
    const categories = Array.from(categoriesMap.values())
      .sort((a, b) => a.order - b.order)
      .map(({ name, emoji }) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        emoji,
      }));

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Categories API] ${categories.length} categorias encontradas`);
    }

    // Headers de cache para CDN da Vercel
    return NextResponse.json({
      success: true,
      categories
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('[Categories API] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categorias' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

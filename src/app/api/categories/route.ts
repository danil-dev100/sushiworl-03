import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Buscar categorias únicas
export async function GET() {
  try {
    console.log('[Categories API] Buscando categorias...');

    // Buscar categorias distintas dos produtos
    const products = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    const categories = products.map(p => p.category);

    console.log(`[Categories API] ${categories.length} categorias encontradas`);

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('[Categories API] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

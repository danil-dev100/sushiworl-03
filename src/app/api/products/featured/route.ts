import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        featuredOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { featuredOrder: 'asc' },
      take: 3,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        featuredOrder: true,
      },
    });

    console.log('[API Featured] Query executada');
    console.log('[API Featured] Produtos encontrados:', products.length);
    if (products.length > 0) {
      console.log('[API Featured] Produtos:', products.map(p => ({
        id: p.id,
        name: p.name,
        order: p.featuredOrder,
        isVisible: true,
        status: 'AVAILABLE'
      })));
    } else {
      console.log('[API Featured] Nenhum produto encontrado com featuredOrder > 0, isVisible: true, status: AVAILABLE');
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos em destaque' },
      { status: 500 }
    );
  }
}

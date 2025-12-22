import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        bestSellerOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { bestSellerOrder: 'asc' },
      take: 3,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
        bestSellerOrder: true,
      },
    });

    console.log('[API Best Sellers] Query executada');
    console.log('[API Best Sellers] Produtos encontrados:', products.length);
    if (products.length > 0) {
      console.log('[API Best Sellers] Produtos:', products.map(p => ({
        id: p.id,
        name: p.name,
        order: p.bestSellerOrder,
        isVisible: true,
        status: 'AVAILABLE'
      })));
    } else {
      console.log('[API Best Sellers] Nenhum produto encontrado com bestSellerOrder > 0, isVisible: true, status: AVAILABLE');
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos mais vendidos' },
      { status: 500 }
    );
  }
}

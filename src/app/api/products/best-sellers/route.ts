import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        bestSellerOrder: { not: null },
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
        imageUrl: true,
        bestSellerOrder: true,
      },
    });

    console.log('[API Best Sellers] Produtos encontrados:', products.length);
    console.log('[API Best Sellers] Produtos:', products.map(p => ({ name: p.name, order: p.bestSellerOrder })));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos mais vendidos' },
      { status: 500 }
    );
  }
}

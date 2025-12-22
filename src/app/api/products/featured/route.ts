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
        category: true,
        imageUrl: true,
        featuredOrder: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos em destaque' },
      { status: 500 }
    );
  }
}

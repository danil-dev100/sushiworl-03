import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const topSeller = searchParams.get('topSeller');

    const where: any = {
      isVisible: true,
      status: 'AVAILABLE',
      outOfStock: false,
    };

    if (category) {
      where.category = category;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (topSeller === 'true') {
      where.isTopSeller = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        options: {
          where: {
            isActive: true,
          },
          include: {
            choices: {
              where: {
                isActive: true,
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [
        { isTopSeller: 'desc' },
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}


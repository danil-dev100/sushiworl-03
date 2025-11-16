import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const options = await prisma.productOption.findMany({
      where: {
        productId: params.productId,
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
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error('[Product Options Public API] Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar opções', options: [] }, { status: 500 });
  }
}


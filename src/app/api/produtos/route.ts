import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // <-- ESSENCIAL: Importar o Prisma Client

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const top = searchParams.get('top');
  const highlights = searchParams.get('highlights');

  try {
    let products;

    if (top) {
      const limit = parseInt(top);
      // Lógica para "Mais Vendidos" - por enquanto, vamos pegar os mais recentes
      products = await prisma.product.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc', // Mais recentes primeiro como "mais vendidos"
        },
      });
    } else if (highlights) {
      const limit = parseInt(highlights);
      // Lógica para "Destaques" - por enquanto, vamos pegar os primeiros
      products = await prisma.product.findMany({
        take: limit,
        orderBy: {
          id: 'asc', // Ordem simples por enquanto
        },
      });
    } else {
      // Se não houver parâmetros, retorna todos os produtos
      products = await prisma.product.findMany();
    }

    return NextResponse.json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
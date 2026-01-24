import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// SEGURANÇA: Limites de paginação
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// Função para validar e limitar o valor de paginação
function safeParseLimit(value: string | null, defaultValue: number = DEFAULT_LIMIT): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) return defaultValue;
  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const top = searchParams.get('top');
  const highlights = searchParams.get('highlights');

  try {
    let products;

    if (top) {
      const limit = safeParseLimit(top);
      // Lógica para "Mais Vendidos" - por enquanto, vamos pegar os mais recentes
      products = await prisma.product.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else if (highlights) {
      const limit = safeParseLimit(highlights);
      // Lógica para "Destaques" - por enquanto, vamos pegar os primeiros
      products = await prisma.product.findMany({
        take: limit,
        orderBy: {
          id: 'asc',
        },
      });
    } else {
      // Se não houver parâmetros, retorna produtos com limite padrão
      products = await prisma.product.findMany({
        take: MAX_LIMIT,
      });
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
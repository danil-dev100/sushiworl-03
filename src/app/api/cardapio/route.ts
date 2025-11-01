import { NextResponse } from 'next/server';
import { parseCardapio, getCategorias, Produto } from '@/lib/parseCardapio';

export async function GET() {
  try {
    const produtos = await parseCardapio();
    const categorias = await getCategorias();

    return NextResponse.json({
      produtos,
      categorias
    });
  } catch (error) {
    console.error('Erro ao carregar cardápio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
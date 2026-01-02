import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMenu } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMenu(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar categorias únicas dos produtos
    const products = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categories = products.map(p => p.category);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[Categories API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMenu(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, emoji } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se categoria já existe
    const existingProduct = await prisma.product.findFirst({
      where: { category: name },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Categoria já existe' },
        { status: 400 }
      );
    }

    // Salvar emoji na configuração (pode ser expandido futuramente)
    // Por enquanto, a categoria é criada quando um produto é adicionado a ela
    // Retornamos sucesso para que o frontend adicione à lista

    return NextResponse.json({
      success: true,
      category: { name, emoji },
    });
  } catch (error) {
    console.error('[Categories API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMenu(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter categoria da query string
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não especificada' },
        { status: 400 }
      );
    }

    console.log(`[Categories API] Excluindo categoria "${category}" e todos os seus produtos...`);

    // Deletar todos os produtos desta categoria
    const result = await prisma.product.deleteMany({
      where: { category },
    });

    console.log(`[Categories API] ${result.count} produto(s) excluído(s) da categoria "${category}"`);

    // Revalidar páginas
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/admin/cardapio');

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Categoria "${category}" e ${result.count} produto(s) foram excluídos com sucesso.`,
    });
  } catch (error) {
    console.error('[Categories API] Erro ao excluir categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    );
  }
}

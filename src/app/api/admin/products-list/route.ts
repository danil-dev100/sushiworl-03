import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Listar produtos (simplificado para seletores)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('[Products List API] Buscando produtos...');

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        category: true,
        isVisible: true
      },
      where: {
        isVisible: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`[Products List API] ${products.length} produtos encontrados`);

    return NextResponse.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('[Products List API] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

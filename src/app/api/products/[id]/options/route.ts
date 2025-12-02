import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Buscar opções de um produto (rota pública para clientes)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`[Public Options API] 🔍 Buscando opções para produto: ${id}`);

    const options = await prisma.productOption.findMany({
      where: {
        productId: id,
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

    console.log(`[Public Options API] ✅ Opções encontradas: ${options.length}`);

    if (options.length > 0) {
      console.log('[Public Options API] Detalhes:');
      options.forEach((opt, idx) => {
        console.log(`  ${idx + 1}. ${opt.name} (${opt.type}, ${opt.displayAt}) - ${opt.choices.length} escolhas`);
      });

      const siteOptions = options.filter(opt => opt.displayAt === 'SITE');
      console.log(`[Public Options API] 🎨 Opções para SITE: ${siteOptions.length}`);
    }

    return NextResponse.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('[Public Options API] ❌ Erro ao buscar opções:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar opções', options: [] },
      { status: 500 }
    );
  }
}

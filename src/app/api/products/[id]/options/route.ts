import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Buscar opções de um produto (incluindo globais)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const displayAt = searchParams.get('displayAt'); // 'SITE' ou 'CART' (opcional)

    console.log(`[Public Options API] 🔍 Buscando opções para produto: ${productId}`);
    if (displayAt) console.log(`[Public Options API] Filtro displayAt: ${displayAt}`);

    // 1. Buscar produto para pegar categoryId
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, category: true }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado', options: [] },
        { status: 404 }
      );
    }

    // 2. Buscar opções específicas do produto
    const productOptions = await prisma.productOption.findMany({
      where: {
        productId,
        isActive: true,
        ...(displayAt && { displayAt: displayAt as any })
      },
      include: {
        choices: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`[Public Options API] 📦 Opções do produto: ${productOptions.length}`);

    // 3. Buscar opções globais aplicadas
    const globalAssignments = await prisma.globalOptionAssignment.findMany({
      where: {
        OR: [
          { assignmentType: 'SITE_WIDE', targetId: null },
          { assignmentType: 'CATEGORY', targetId: product.category },
          { assignmentType: 'PRODUCT', targetId: productId }
        ]
      },
      include: {
        globalOption: {
          include: {
            choices: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // 4. Converter opções globais para formato compatível (filtrar ativos em memória)
    const globalOptions = globalAssignments
      .filter(a => a.globalOption !== null && a.globalOption.isActive)
      .filter(a => !displayAt || a.globalOption.displayAt === displayAt)
      .map(a => ({
        id: `global_${a.globalOption.id}`,
        productId: productId,
        name: a.globalOption.name,
        type: a.globalOption.type,
        description: a.globalOption.description,
        minSelection: a.minSelection,
        maxSelection: a.maxSelection,
        allowMultiple: a.allowMultiple,
        displayAt: a.globalOption.displayAt,
        isPaid: a.globalOption.isPaid,
        basePrice: a.globalOption.basePrice,
        isActive: true,
        sortOrder: a.sortOrder,
        createdAt: a.globalOption.createdAt,
        updatedAt: a.globalOption.updatedAt,
        choices: a.globalOption.choices.filter(c => c.isActive),
        isGlobal: true // Flag para identificar que é global
      }))
      .filter(opt => opt.choices.length > 0); // Só retornar opções com choices válidas

    console.log(`[Public Options API] 🌍 Opções globais: ${globalOptions.length}`);

    // 5. Combinar e ordenar
    const allOptions = [...productOptions, ...globalOptions]
      .sort((a, b) => a.sortOrder - b.sortOrder);

    console.log(`[Public Options API] ✅ Total de opções: ${allOptions.length}`);

    if (allOptions.length > 0) {
      console.log('[Public Options API] Detalhes:');
      allOptions.forEach((opt, idx) => {
        const source = 'isGlobal' in opt && opt.isGlobal ? '🌍' : '📦';
        console.log(`  ${source} ${idx + 1}. ${opt.name} (${opt.type}, ${opt.displayAt}) - ${opt.choices.length} escolhas`);
      });

      const siteOptions = allOptions.filter(opt => opt.displayAt === 'SITE');
      console.log(`[Public Options API] 🎨 Opções para SITE: ${siteOptions.length}`);
    }

    return NextResponse.json({
      success: true,
      options: allOptions
    });
  } catch (error) {
    console.error('[Public Options API] ❌ Erro ao buscar opções:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar opções', options: [] },
      { status: 500 }
    );
  }
}

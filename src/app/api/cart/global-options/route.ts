import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/cart/global-options
 * Retorna opções globais configuradas para exibir no carrinho (displayAt = CART)
 * Pode filtrar por productIds específicos do carrinho
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productIdsParam = searchParams.get('productIds');
    const categoriesParam = searchParams.get('categories');

    const productIds = productIdsParam ? productIdsParam.split(',') : [];
    const categories = categoriesParam ? categoriesParam.split(',') : [];

    console.log('[Cart Global Options] Buscando opções para carrinho...');
    console.log('[Cart Global Options] ProductIds:', productIds);
    console.log('[Cart Global Options] Categories:', categories);

    // Montar condições de busca
    const whereConditions: any[] = [
      // Sempre incluir opções SITE_WIDE
      { assignmentType: 'SITE_WIDE' }
    ];

    // Adicionar condições para categorias específicas
    if (categories.length > 0) {
      categories.forEach(category => {
        whereConditions.push({
          assignmentType: 'CATEGORY',
          targetId: category
        });
      });
    }

    // Adicionar condições para produtos específicos
    if (productIds.length > 0) {
      productIds.forEach(productId => {
        whereConditions.push({
          assignmentType: 'PRODUCT',
          targetId: productId
        });
      });
    }

    // Buscar atribuições que correspondem às condições
    const assignments = await prisma.globalOptionAssignment.findMany({
      where: {
        OR: whereConditions
      },
      include: {
        globalOption: {
          include: {
            choices: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    // Filtrar apenas opções ativas com displayAt = CART e que têm escolhas
    const cartOptions = assignments
      .filter(a =>
        a.globalOption &&
        a.globalOption.isActive &&
        a.globalOption.displayAt === 'CART'
      )
      .map(a => ({
        id: a.globalOption.id,
        name: a.globalOption.name,
        description: a.globalOption.description,
        type: a.globalOption.type,
        displayAt: a.globalOption.displayAt,
        isPaid: a.globalOption.isPaid,
        basePrice: a.globalOption.basePrice,
        choices: a.globalOption.choices,
        isGlobal: true,
        assignmentType: a.assignmentType,
        targetId: a.targetId,
        minSelection: a.minSelection,
        maxSelection: a.maxSelection,
        allowMultiple: a.allowMultiple
      }))
      .filter(opt => opt.choices.length > 0);

    // Remover duplicatas (mesmo id)
    const uniqueOptions = cartOptions.reduce((acc: any[], opt) => {
      if (!acc.find(o => o.id === opt.id)) {
        acc.push(opt);
      }
      return acc;
    }, []);

    console.log('[Cart Global Options] Opções encontradas:', uniqueOptions.length);
    uniqueOptions.forEach(opt => {
      console.log(`  - ${opt.name} (${opt.choices.length} escolhas)`);
    });

    return NextResponse.json({
      success: true,
      options: uniqueOptions
    });
  } catch (error) {
    console.error('[Cart Global Options] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar opções do carrinho' },
      { status: 500 }
    );
  }
}

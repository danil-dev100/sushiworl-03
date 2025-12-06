import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Buscar opções globais aplicáveis
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');

    console.log('[Applicable Options] Parâmetros:', { categoryId, productId });

    // Construir condições WHERE
    const whereConditions: any[] = [
      { assignmentType: 'SITE_WIDE' }
    ];

    if (categoryId) {
      whereConditions.push({
        assignmentType: 'CATEGORY',
        targetId: categoryId
      });
    }

    if (productId) {
      whereConditions.push({
        assignmentType: 'PRODUCT',
        targetId: productId
      });
    }

    const assignments = await prisma.globalOptionAssignment.findMany({
      where: {
        OR: whereConditions
      },
      include: {
        globalOption: {
          where: { isActive: true },
          include: {
            choices: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    const options = assignments
      .filter(a => a.globalOption)
      .map(a => ({
        ...a.globalOption,
        isGlobal: true,
        assignmentType: a.assignmentType,
        assignmentTargetId: a.targetId,
        minSelection: a.minSelection,
        maxSelection: a.maxSelection
      }));

    console.log('[Applicable Options] Encontradas:', options.length);

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.error('[Applicable Options] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar opções aplicáveis' },
      { status: 500 }
    );
  }
}

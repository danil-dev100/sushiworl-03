import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const productId = searchParams.get('productId');

    console.log('[Get Applicable Options]', { categoryId, productId });

    // Buscar atribuições aplicáveis
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
          include: {
            choices: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    // Filtrar opções e choices ativos DEPOIS de buscar
    const options = assignments
      .filter(a => a.globalOption && a.globalOption.isActive)
      .map(a => ({
        ...a.globalOption,
        choices: a.globalOption.choices.filter(c => c.isActive),
        isGlobal: true,
        assignmentType: a.assignmentType,
        minSelection: a.minSelection,
        maxSelection: a.maxSelection
      }))
      .filter(opt => opt.choices.length > 0); // Só retornar opções com choices válidas

    console.log('[Get Applicable Options] Found:', options.length);

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.error('[Get Applicable Options Error]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar opções' },
      { status: 500 }
    );
  }
}

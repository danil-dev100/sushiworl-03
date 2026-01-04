import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Buscar atribuições de opções globais para um produto específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;

    console.log(`[Product Global Options API] 🔍 Buscando atribuições para produto: ${productId}`);

    // Buscar produto para pegar category
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { category: true }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado', assignments: [] },
        { status: 404 }
      );
    }

    // Buscar atribuições de opções globais (SITE_WIDE, CATEGORY e PRODUCT)
    const assignments = await prisma.globalOptionAssignment.findMany({
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
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`[Product Global Options API] ✅ ${assignments.length} atribuições encontradas:`);
    console.log(`   - SITE_WIDE: ${assignments.filter(a => a.assignmentType === 'SITE_WIDE').length}`);
    console.log(`   - CATEGORY: ${assignments.filter(a => a.assignmentType === 'CATEGORY').length}`);
    console.log(`   - PRODUCT: ${assignments.filter(a => a.assignmentType === 'PRODUCT').length}`);

    // Filtrar apenas atribuições com opções globais ativas
    const activeAssignments = assignments.filter(a =>
      a.globalOption !== null && a.globalOption.isActive
    );

    return NextResponse.json({
      success: true,
      assignments: activeAssignments
    });
  } catch (error) {
    console.error('[Product Global Options API] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar atribuições', assignments: [] },
      { status: 500 }
    );
  }
}

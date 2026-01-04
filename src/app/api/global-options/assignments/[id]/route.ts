import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE - Remover uma atribuição específica
export async function DELETE(
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

    const { id: assignmentId } = await params;

    console.log(`[Assignment DELETE] 🗑️ Removendo atribuição: ${assignmentId}`);

    await prisma.globalOptionAssignment.delete({
      where: { id: assignmentId }
    });

    console.log(`[Assignment DELETE] ✅ Atribuição removida com sucesso`);

    return NextResponse.json({
      success: true,
      message: 'Atribuição removida com sucesso'
    });
  } catch (error) {
    console.error('[Assignment DELETE] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover atribuição' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Criar atribuição de opção global
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id: globalOptionId } = await params;
    const data = await req.json();

    console.log('[Assignment POST] 📌 Criando atribuição');
    console.log('[Assignment POST] Opção:', globalOptionId);
    console.log('[Assignment POST] Tipo:', data.assignmentType);
    console.log('[Assignment POST] Target:', data.targetId || 'SITE_WIDE');

    // Validações
    if (!data.assignmentType) {
      return NextResponse.json(
        { success: false, error: 'Tipo de atribuição é obrigatório' },
        { status: 400 }
      );
    }

    if (!['SITE_WIDE', 'CATEGORY', 'PRODUCT'].includes(data.assignmentType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de atribuição inválido' },
        { status: 400 }
      );
    }

    if (data.assignmentType !== 'SITE_WIDE' && !data.targetId) {
      return NextResponse.json(
        { success: false, error: 'targetId é obrigatório para CATEGORY e PRODUCT' },
        { status: 400 }
      );
    }

    // Verificar se já existe atribuição igual
    const existing = await prisma.globalOptionAssignment.findFirst({
      where: {
        globalOptionId,
        assignmentType: data.assignmentType,
        targetId: data.targetId || null
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Atribuição já existe' },
        { status: 400 }
      );
    }

    // Criar atribuição
    const assignment = await prisma.globalOptionAssignment.create({
      data: {
        globalOptionId,
        assignmentType: data.assignmentType,
        targetId: data.targetId || null,
        minSelection: parseInt(data.minSelection) || 0,
        maxSelection: parseInt(data.maxSelection) || 1,
        allowMultiple: data.allowMultiple === true,
        sortOrder: data.sortOrder || 0
      },
      include: {
        globalOption: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('[Assignment POST] ✅ Atribuição criada:', assignment.id);

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    console.error('[Assignment POST] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar atribuição' },
      { status: 500 }
    );
  }
}

// DELETE - Remover atribuição
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'assignmentId é obrigatório' },
        { status: 400 }
      );
    }

    console.log('[Assignment DELETE] 🗑️ Deletando atribuição:', assignmentId);

    await prisma.globalOptionAssignment.delete({
      where: { id: assignmentId }
    });

    console.log('[Assignment DELETE] ✅ Atribuição deletada');

    return NextResponse.json({
      success: true,
      message: 'Atribuição removida com sucesso'
    });
  } catch (error) {
    console.error('[Assignment DELETE] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar atribuição' },
      { status: 500 }
    );
  }
}

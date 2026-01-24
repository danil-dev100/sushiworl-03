import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Buscar opção global específica
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`[Global Option GET] 🔍 Buscando opção: ${id}`);

    const option = await prisma.globalOption.findUnique({
      where: { id },
      include: {
        choices: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        assignments: {
          include: {
            globalOption: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!option) {
      return NextResponse.json(
        { success: false, error: 'Opção não encontrada' },
        { status: 404 }
      );
    }

    console.log(`[Global Option GET] ✅ Opção encontrada: ${option.name}`);

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error('[Global Option GET] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar opção' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar opção global
export async function PUT(
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

    const { id } = await params;
    const data = await req.json();

    console.log(`[Global Option PUT] 🔄 Atualizando opção: ${id}`);
    console.log('[Global Option PUT] Dados:', JSON.stringify(data, null, 2));

    // Validações
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nome da opção é obrigatório' },
        { status: 400 }
      );
    }

    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Adicione pelo menos uma escolha' },
        { status: 400 }
      );
    }

    // Deletar escolhas antigas
    await prisma.globalOptionChoice.deleteMany({
      where: { optionId: id }
    });

    // Atualizar opção com novas escolhas
    const option = await prisma.globalOption.update({
      where: { id },
      data: {
        name: data.name.trim(),
        type: data.type,
        description: data.description?.trim() || null,
        displayAt: data.displayAt,
        isPaid: data.isPaid === true,
        basePrice: data.isPaid ? parseFloat(data.basePrice) || 0 : 0,
        allowQuantity: data.allowQuantity === true,
        sortOrder: data.sortOrder || 0,
        choices: {
          create: data.choices.map((choice: any, index: number) => ({
            name: choice.name.trim(),
            price: parseFloat(choice.price) || 0,
            isDefault: choice.isDefault === true,
            isActive: true,
            sortOrder: choice.sortOrder || index
          }))
        }
      },
      include: {
        choices: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    console.log(`[Global Option PUT] ✅ Opção atualizada: ${option.name}`);

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error('[Global Option PUT] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar opção' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar opção global
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

    const { id } = await params;

    console.log(`[Global Option DELETE] 🗑️ Deletando opção: ${id}`);

    // Delete em cascata (remove automaticamente choices e assignments)
    await prisma.globalOption.delete({
      where: { id }
    });

    console.log(`[Global Option DELETE] ✅ Opção deletada com sucesso`);

    return NextResponse.json({ success: true, message: 'Opção deletada com sucesso' });
  } catch (error) {
    console.error('[Global Option DELETE] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar opção' },
      { status: 500 }
    );
  }
}

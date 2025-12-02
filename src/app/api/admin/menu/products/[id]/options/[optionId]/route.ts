import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { optionId } = await params;

    console.log('[PUT Option API] 🔄 Atualizando opção:', optionId);
    console.log('[PUT Option API] Dados recebidos:', JSON.stringify(body, null, 2));

    // Validações
    if (!body.name || body.name.trim() === '') {
      console.log('[PUT Option API] ❌ Validação falhou: Nome vazio');
      return NextResponse.json({ error: 'Nome da opção é obrigatório' }, { status: 400 });
    }

    if (!body.choices || body.choices.length === 0) {
      console.log('[PUT Option API] ❌ Validação falhou: Sem escolhas');
      return NextResponse.json({ error: 'Adicione pelo menos uma escolha' }, { status: 400 });
    }

    // Deletar escolhas antigas
    console.log('[PUT Option API] 🗑️ Deletando escolhas antigas...');
    const deletedChoices = await prisma.productOptionChoice.deleteMany({
      where: { optionId }
    });
    console.log(`[PUT Option API] ✅ ${deletedChoices.count} escolhas antigas deletadas`);

    // Atualizar opção com novas escolhas
    console.log('[PUT Option API] 💾 Atualizando opção com novas escolhas...');
    const option = await prisma.productOption.update({
      where: { id: optionId },
      data: {
        name: body.name.trim(),
        type: body.type,
        description: body.description?.trim() || null,
        minSelection: parseInt(body.minSelection) || 0,
        maxSelection: parseInt(body.maxSelection) || 1,
        allowMultiple: body.allowMultiple === true,
        displayAt: body.displayAt,
        isPaid: body.isPaid === true,
        basePrice: body.isPaid ? parseFloat(body.basePrice) || 0 : 0,
        sortOrder: body.sortOrder || 0,
        choices: {
          create: body.choices.map((choice: any, index: number) => ({
            name: choice.name.trim(),
            price: parseFloat(choice.price) || 0,
            isDefault: choice.isDefault === true,
            isActive: true,
            sortOrder: choice.sortOrder || index
          }))
        }
      },
      include: {
        choices: true,
      },
    });

    console.log('[PUT Option API] ✅ Opção atualizada com sucesso!');
    console.log(`[PUT Option API] Nome: ${option.name}`);
    console.log(`[PUT Option API] Tipo: ${option.type}`);
    console.log(`[PUT Option API] Exibir em: ${option.displayAt}`);
    console.log(`[PUT Option API] Novas escolhas: ${option.choices.length}`);

    // Revalidar páginas que mostram produtos
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/admin/cardapio');

    return NextResponse.json({ option });
  } catch (error) {
    console.error('[PUT Option API] ❌ Erro ao atualizar opção:', error);
    return NextResponse.json({ error: 'Erro ao atualizar opção' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { optionId } = await params;

    console.log('[DELETE Option API] 🗑️ Deletando opção:', optionId);

    // Hard delete com cascade (vai deletar as escolhas automaticamente)
    await prisma.productOption.delete({
      where: { id: optionId }
    });

    console.log('[DELETE Option API] ✅ Opção deletada com sucesso (cascade deletou as escolhas)');

    // Revalidar páginas que mostram produtos
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/admin/cardapio');

    return NextResponse.json({
      success: true,
      message: 'Opção deletada com sucesso'
    });
  } catch (error) {
    console.error('[DELETE Option API] ❌ Erro ao remover opção:', error);
    return NextResponse.json({ error: 'Erro ao remover opção' }, { status: 500 });
  }
}

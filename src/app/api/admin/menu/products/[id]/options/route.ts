import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    console.log(`[GET Options API] 🔍 Buscando opções para produto: ${id}`);

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

    console.log(`[GET Options API] ✅ Opções encontradas: ${options.length}`);

    if (options.length > 0) {
      console.log('[GET Options API] Detalhes:');
      options.forEach((opt, idx) => {
        console.log(`  ${idx + 1}. ${opt.name} (${opt.type}, ${opt.displayAt}) - ${opt.choices.length} escolhas`);
      });
    }

    return NextResponse.json({ options });
  } catch (error) {
    console.error('[GET Options API] ❌ Erro ao buscar opções:', error);
    return NextResponse.json({ error: 'Erro ao buscar opções', options: [] }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const productId = id;

    console.log('[POST Options API] 📥 Criando nova opção');
    console.log('[POST Options API] Produto ID:', productId);
    console.log('[POST Options API] Dados recebidos:', JSON.stringify(body, null, 2));

    // Validações
    if (!body.name || body.name.trim() === '') {
      console.log('[POST Options API] ❌ Validação falhou: Nome vazio');
      return NextResponse.json({ error: 'Nome da opção é obrigatório' }, { status: 400 });
    }

    if (!body.choices || body.choices.length === 0) {
      console.log('[POST Options API] ❌ Validação falhou: Sem escolhas');
      return NextResponse.json({ error: 'Adicione pelo menos uma escolha' }, { status: 400 });
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.log('[POST Options API] ❌ Produto não encontrado');
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Buscar a maior ordem atual
    const maxOrder = await prisma.productOption.findFirst({
      where: { productId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const nextOrder = (maxOrder?.sortOrder || 0) + 1;

    console.log('[POST Options API] ✅ Validações passaram, criando opção...');

    // Criar a opção
    const option = await prisma.productOption.create({
      data: {
        productId,
        name: body.name.trim(),
        type: body.type || 'OPTIONAL',
        description: body.description?.trim() || null,
        minSelection: parseInt(body.minSelection) || 0,
        maxSelection: parseInt(body.maxSelection) || 1,
        allowMultiple: body.allowMultiple === true,
        displayAt: body.displayAt || 'CART',
        isPaid: body.isPaid === true,
        basePrice: body.isPaid ? parseFloat(body.basePrice) || 0 : 0,
        sortOrder: nextOrder,
        isActive: true,
        choices: {
          create: body.choices?.map((choice: any, index: number) => ({
            name: choice.name.trim(),
            price: parseFloat(choice.price) || 0,
            isDefault: choice.isDefault === true,
            sortOrder: index + 1,
            isActive: true,
          })) || [],
        },
      },
      include: {
        choices: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    console.log('[POST Options API] ✅ Opção criada com sucesso!');
    console.log(`[POST Options API] ID: ${option.id}`);
    console.log(`[POST Options API] Nome: ${option.name}`);
    console.log(`[POST Options API] Tipo: ${option.type}`);
    console.log(`[POST Options API] Exibir em: ${option.displayAt}`);
    console.log(`[POST Options API] É paga: ${option.isPaid} (€${option.basePrice})`);
    console.log(`[POST Options API] Escolhas criadas: ${option.choices.length}`);

    // Revalidar páginas que mostram produtos
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/admin/cardapio');

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    console.error('[POST Options API] ❌ Erro ao criar opção:', error);
    return NextResponse.json({ error: 'Erro ao criar opção' }, { status: 500 });
  }
}

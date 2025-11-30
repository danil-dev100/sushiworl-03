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

    return NextResponse.json({ options });
  } catch (error) {
    console.error('[Product Options API] Erro ao buscar opções:', error);
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

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Buscar a maior ordem atual
    const maxOrder = await prisma.productOption.findFirst({
      where: { productId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const nextOrder = (maxOrder?.sortOrder || 0) + 1;

    // Criar a opção
    const option = await prisma.productOption.create({
      data: {
        productId,
        name: body.name,
        type: body.type,
        description: body.description,
        minSelection: body.minSelection || 0,
        maxSelection: body.maxSelection || 1,
        allowMultiple: body.allowMultiple || false,
        displayAt: body.displayAt || 'CART',
        isPaid: body.isPaid || false,
        basePrice: body.basePrice || 0,
        sortOrder: nextOrder,
        isActive: true,
        choices: {
          create: body.choices?.map((choice: any, index: number) => ({
            name: choice.name,
            price: choice.price || 0,
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

    // Revalidar páginas que mostram produtos
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/admin/cardapio');

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    console.error('[Product Options API] Erro ao criar opção:', error);
    return NextResponse.json({ error: 'Erro ao criar opção' }, { status: 500 });
  }
}

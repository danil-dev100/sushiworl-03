import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const options = await prisma.productOption.findMany({
      where: {
        productId: params.productId,
      },
      include: {
        choices: {
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
    return NextResponse.json({ error: 'Erro ao buscar opções' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const option = await prisma.productOption.create({
      data: {
        productId: params.productId,
        name: body.name,
        type: body.type,
        description: body.description,
        minSelection: body.minSelection || 0,
        maxSelection: body.maxSelection || 1,
        allowMultiple: body.allowMultiple || false,
        displayAt: body.displayAt || 'CART',
        isPaid: body.isPaid || false,
        basePrice: body.basePrice || 0,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder || 0,
        choices: {
          create: (body.choices || []).map((choice: any, index: number) => ({
            name: choice.name,
            price: choice.price || 0,
            isDefault: choice.isDefault || false,
            isActive: choice.isActive ?? true,
            sortOrder: choice.sortOrder ?? index,
          })),
        },
      },
      include: {
        choices: true,
      },
    });

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    console.error('[Product Options API] Erro ao criar opção:', error);
    return NextResponse.json({ error: 'Erro ao criar opção' }, { status: 500 });
  }
}


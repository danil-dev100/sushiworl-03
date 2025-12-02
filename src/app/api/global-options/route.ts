import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Listar todas as opções globais
export async function GET() {
  try {
    console.log('[Global Options GET] 🔍 Buscando opções globais...');

    const options = await prisma.globalOption.findMany({
      include: {
        choices: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        assignments: {
          select: {
            id: true,
            assignmentType: true,
            targetId: true,
            minSelection: true,
            maxSelection: true,
            allowMultiple: true,
            sortOrder: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`[Global Options GET] ✅ ${options.length} opções encontradas`);

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.error('[Global Options GET] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar opções globais' },
      { status: 500 }
    );
  }
}

// POST - Criar nova opção global
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await req.json();

    console.log('[Global Options POST] 📥 Criando opção global');
    console.log('[Global Options POST] Dados:', JSON.stringify(data, null, 2));

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

    // Buscar a maior ordem atual
    const maxOrder = await prisma.globalOption.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });

    const nextOrder = (maxOrder?.sortOrder || 0) + 1;

    // Criar opção global
    const option = await prisma.globalOption.create({
      data: {
        name: data.name.trim(),
        type: data.type || 'OPTIONAL',
        description: data.description?.trim() || null,
        displayAt: data.displayAt || 'CART',
        isPaid: data.isPaid === true,
        basePrice: data.isPaid ? parseFloat(data.basePrice) || 0 : 0,
        isActive: true,
        sortOrder: nextOrder,
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

    console.log('[Global Options POST] ✅ Opção criada:', option.id);

    return NextResponse.json({ success: true, option }, { status: 201 });
  } catch (error) {
    console.error('[Global Options POST] ❌ Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar opção global' },
      { status: 500 }
    );
  }
}

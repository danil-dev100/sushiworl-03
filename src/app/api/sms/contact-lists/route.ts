import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação para criar lista
const createListSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

// GET - Listar todas as listas de contatos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const lists = await prisma.smsContactList.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        totalContacts: true,
        validContacts: true,
        invalidContacts: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      lists: lists.map(list => ({
        ...list,
        contactCount: list._count.contacts,
      })),
    });
  } catch (error) {
    console.error('[Contact Lists GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar listas de contatos' },
      { status: 500 }
    );
  }
}

// POST - Criar nova lista de contatos
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validar dados
    const validationResult = createListSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, description } = validationResult.data;

    // Criar lista
    const list = await prisma.smsContactList.create({
      data: {
        name,
        description,
        createdBy: session.user.id,
      },
    });

    console.log('[Contact Lists] Lista criada:', { id: list.id, name: list.name });

    return NextResponse.json({
      success: true,
      list,
    });
  } catch (error) {
    console.error('[Contact Lists POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lista de contatos' },
      { status: 500 }
    );
  }
}

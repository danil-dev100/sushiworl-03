import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// GET - Listar todas as áreas de entrega
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const deliveryAreas = await prisma.deliveryArea.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(deliveryAreas);
  } catch (error) {
    console.error('[Delivery Areas API][GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar áreas de entrega' },
      { status: 500 }
    );
  }
}

// POST - Criar nova área de entrega
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      polygon,
      color,
      deliveryType,
      deliveryFee,
      minOrderValue,
      isActive,
    } = body;

    if (!name || !polygon || polygon.length < 3) {
      return NextResponse.json(
        { error: 'Dados inválidos. Nome e polígono (mín. 3 pontos) são obrigatórios.' },
        { status: 400 }
      );
    }

    // Obter o próximo sortOrder
    const maxOrder = await prisma.deliveryArea.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const deliveryArea = await prisma.deliveryArea.create({
      data: {
        name,
        polygon,
        color: color || '#3B82F6',
        deliveryType: deliveryType || 'PAID',
        deliveryFee: deliveryFee || 0,
        minOrderValue: minOrderValue || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    revalidatePath('/admin/configuracoes/areas-entrega');

    return NextResponse.json(deliveryArea);
  } catch (error) {
    console.error('[Delivery Areas API][POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar área de entrega' },
      { status: 500 }
    );
  }
}


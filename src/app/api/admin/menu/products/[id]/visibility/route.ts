import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;

    const product = await prisma.product.update({
      where: { id },
      data: {
        isVisible: body.isVisible,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[Products API] Erro ao atualizar visibilidade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar visibilidade' },
      { status: 500 }
    );
  }
}


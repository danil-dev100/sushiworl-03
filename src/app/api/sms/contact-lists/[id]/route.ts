import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Obter detalhes de uma lista
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const list = await prisma.smsContactList.findUnique({
      where: { id },
      include: {
        contacts: {
          take: 100, // Limitar para não sobrecarregar
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            phoneNumber: true,
            name: true,
            email: true,
            isValid: true,
            isOptedOut: true,
            messagesSent: true,
            messagesDelivered: true,
            lastMessageAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: { contacts: true },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      list: {
        ...list,
        contactCount: list._count.contacts,
      },
    });
  } catch (error) {
    console.error('[Contact List GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lista de contatos' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar uma lista
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar se a lista existe
    const list = await prisma.smsContactList.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    // Deletar lista (contatos serão deletados em cascata)
    await prisma.smsContactList.delete({
      where: { id },
    });

    console.log('[Contact List DELETE] Lista deletada:', { id, name: list.name });

    return NextResponse.json({
      success: true,
      message: 'Lista deletada com sucesso',
    });
  } catch (error) {
    console.error('[Contact List DELETE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar lista de contatos' },
      { status: 500 }
    );
  }
}

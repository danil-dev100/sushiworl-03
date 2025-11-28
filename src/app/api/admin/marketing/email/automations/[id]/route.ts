import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, flow, isActive, isDraft } = body;

    const automation = await prisma.emailAutomation.update({
      where: { id },
      data: {
        name,
        description,
        flow,
        isActive,
        isDraft,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error('Erro ao atualizar automação:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar automação' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.emailAutomation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar automação:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar automação' },
      { status: 500 }
    );
  }
}

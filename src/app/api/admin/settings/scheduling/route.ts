import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageSettings } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageSettings(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const settings = await prisma.settings.findFirst({
      select: {
        schedulingMinTime: true,
        schedulingEnabled: true,
      },
    });

    return NextResponse.json({
      schedulingMinTime: settings?.schedulingMinTime ?? 120,
      schedulingEnabled: settings?.schedulingEnabled ?? true,
    });
  } catch (error) {
    console.error('[Scheduling Settings API] Erro ao buscar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração de agendamento' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageSettings(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { schedulingMinTime, schedulingEnabled } = body;

    // Preparar dados para atualização
    const updateData: { schedulingMinTime?: number; schedulingEnabled?: boolean } = {};

    // Validar tempo mínimo se fornecido
    if (schedulingMinTime !== undefined) {
      if (typeof schedulingMinTime !== 'number' || schedulingMinTime < 5 || schedulingMinTime > 60) {
        return NextResponse.json(
          { error: 'Tempo mínimo de agendamento deve ser entre 5 e 60 minutos' },
          { status: 400 }
        );
      }

      if (schedulingMinTime % 5 !== 0) {
        return NextResponse.json(
          { error: 'Tempo mínimo de agendamento deve ser múltiplo de 5' },
          { status: 400 }
        );
      }

      updateData.schedulingMinTime = schedulingMinTime;
    }

    // Validar schedulingEnabled se fornecido
    if (schedulingEnabled !== undefined) {
      if (typeof schedulingEnabled !== 'boolean') {
        return NextResponse.json(
          { error: 'schedulingEnabled deve ser um booleano' },
          { status: 400 }
        );
      }

      updateData.schedulingEnabled = schedulingEnabled;
    }

    const existingSettings = await prisma.settings.findFirst();

    let updatedSettings;

    if (existingSettings) {
      updatedSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData,
        select: {
          schedulingMinTime: true,
          schedulingEnabled: true,
        },
      });
    } else {
      updatedSettings = await prisma.settings.create({
        data: {
          companyName: 'SushiWorld',
          nif: '000000000',
          ...updateData,
        },
        select: {
          schedulingMinTime: true,
          schedulingEnabled: true,
        },
      });
    }

    // Revalidar páginas de checkout e agendamento
    revalidatePath('/checkout');
    revalidatePath('/api/scheduling/available-dates');

    console.log('[Scheduling Settings API] Configuração atualizada:', updatedSettings);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('[Scheduling Settings API] Erro ao atualizar:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração de agendamento' },
      { status: 500 }
    );
  }
}

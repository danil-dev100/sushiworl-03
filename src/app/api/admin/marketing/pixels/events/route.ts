import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // @ts-expect-error - TrackingEvent será gerado após prisma generate
    const events = await prisma.trackingEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[Pixels Events API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos', events: [] },
      { status: 500 }
    );
  }
}

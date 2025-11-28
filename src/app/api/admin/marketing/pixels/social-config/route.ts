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

    // @ts-expect-error - SocialShareConfig será gerado após prisma generate
    const config = await prisma.socialShareConfig.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[Social Config API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração', config: null },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, data } = body;

    if (action === 'create') {
      // @ts-expect-error - SocialShareConfig será gerado após prisma generate
      const config = await prisma.socialShareConfig.create({
        data: {
          ogTitle: data.ogTitle,
          ogDescription: data.ogDescription,
          ogImage: data.ogImage,
          ogType: data.ogType || 'website',
          twitterCard: data.twitterCard || 'summary_large_image',
          twitterSite: data.twitterSite,
          siteName: data.siteName,
          locale: data.locale || 'pt_BR',
          isActive: data.isActive ?? true,
        },
      });
      return NextResponse.json(config);
    }

    if (action === 'update') {
      // @ts-expect-error - SocialShareConfig será gerado após prisma generate
      const config = await prisma.socialShareConfig.update({
        where: { id: data.id },
        data: {
          ogTitle: data.ogTitle,
          ogDescription: data.ogDescription,
          ogImage: data.ogImage,
          ogType: data.ogType,
          twitterCard: data.twitterCard,
          twitterSite: data.twitterSite,
          siteName: data.siteName,
          locale: data.locale,
          isActive: data.isActive,
        },
      });
      return NextResponse.json(config);
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Social Config API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

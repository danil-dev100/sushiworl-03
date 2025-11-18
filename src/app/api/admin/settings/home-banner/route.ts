import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type HomeHeroPayload = {
  imageUrl: string | null;
  overlayColor: string;
  overlayOpacity: number;
  headline: string;
  headlineColor: string;
  headlineSize: number;
};

const DEFAULT_SETTINGS = {
  companyName: 'SushiWorld',
  billingName: 'SushiWorld',
  nif: '000000000',
  vatRate: 13,
  vatType: 'INCLUSIVE' as const,
};

function sanitizeOpacity(value: unknown): number {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0.4;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return Number(numeric.toFixed(2));
}

function sanitizeSize(value: unknown): number {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 4.5;
  if (numeric < 2) return 2;
  if (numeric > 8) return 8;
  return Number(numeric.toFixed(1));
}

function sanitizeColor(value: unknown): string {
  if (typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return value.toUpperCase();
  }
  return '#000000';
}

function buildHeroPayload(body: any): HomeHeroPayload {
  return {
    imageUrl: body?.imageUrl ?? null,
    overlayColor: sanitizeColor(body?.overlayColor),
    overlayOpacity: sanitizeOpacity(body?.overlayOpacity ?? 0.4),
    headline:
      typeof body?.headline === 'string' && body.headline.trim().length > 0
        ? body.headline.trim()
        : 'SushiWorld: O Sabor do Japão na Sua Casa',
    headlineColor: sanitizeColor(body?.headlineColor ?? '#FFFFFF'),
    headlineSize: sanitizeSize(body?.headlineSize ?? 4.5),
  };
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = buildHeroPayload(await request.json());

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          ...DEFAULT_SETTINGS,
          banners: {
            home: payload,
          },
        },
      });
    } else {
      const currentBannersRaw = settings.banners;
      let currentBanners = {};
      if (
        currentBannersRaw &&
        typeof currentBannersRaw === 'object' &&
        !Array.isArray(currentBannersRaw)
      ) {
        currentBanners = currentBannersRaw as Record<string, unknown>;
      }

      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          banners: {
            ...currentBanners,
            home: payload,
          },
        },
      });
    }

    revalidatePath('/');
    revalidatePath('/admin/marketing/promocoes');

    return NextResponse.json({
      hero: payload,
      success: true,
    });
  } catch (error) {
    console.error('[Settings][home-banner] erro ao atualizar banner:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar banner da home' },
      { status: 500 }
    );
  }
}


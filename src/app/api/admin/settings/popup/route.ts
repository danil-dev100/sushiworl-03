import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Tipo do payload do popup
export type PopupConfig = {
  title: string;
  message: string;
  imageUrl?: string | null;
  buttonEnabled: boolean;
  buttonText: string;
  buttonLink: string;
  buttonLinkType: 'page' | 'product' | 'external';
  productId?: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  footerText?: string | null;
};

const DEFAULT_SETTINGS = {
  companyName: 'SushiWorld',
  billingName: 'SushiWorld',
  nif: '000000000',
  vatRate: 13,
  vatType: 'INCLUSIVE' as const,
};

const DEFAULT_POPUP_CONFIG: PopupConfig = {
  title: '',
  message: '',
  imageUrl: null,
  buttonEnabled: false,
  buttonText: 'Ver Mais',
  buttonLink: '/',
  buttonLinkType: 'page',
  productId: null,
  backgroundColor: '#FFFFFF',
  textColor: '#333333',
  buttonColor: '#FF6B00',
  buttonTextColor: '#FFFFFF',
  footerText: null,
};

function sanitizeColor(value: unknown, fallback: string): string {
  if (typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return value.toUpperCase();
  }
  return fallback;
}

/**
 * Valida se a URL é segura (HTTP/HTTPS apenas)
 */
function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  const url = value.trim();

  // Bloquear protocolos perigosos
  if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('vbscript:')) {
    return null;
  }

  // Para URLs absolutas, validar protocolo
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }

  // URLs relativas começando com / são permitidas
  if (url.startsWith('/')) {
    return url;
  }

  return null;
}

/**
 * Sanitiza texto removendo caracteres potencialmente perigosos
 */
function sanitizeText(value: unknown, maxLength: number = 1000): string {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .slice(0, maxLength)
    // Remover null bytes e caracteres de controle (exceto newlines)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function buildPopupPayload(body: any): PopupConfig {
  // Determinar tipo de link primeiro para validação
  const buttonLinkType = ['page', 'product', 'external'].includes(body?.buttonLinkType)
    ? body.buttonLinkType
    : 'page';

  // Sanitizar link baseado no tipo
  let buttonLink = '/';
  if (buttonLinkType === 'external') {
    // Links externos devem ser URLs absolutas válidas
    buttonLink = sanitizeUrl(body?.buttonLink) || '#';
  } else {
    // Links internos devem começar com /
    const rawLink = typeof body?.buttonLink === 'string' ? body.buttonLink.trim() : '/';
    buttonLink = rawLink.startsWith('/') ? rawLink : '/';
  }

  return {
    title: sanitizeText(body?.title, 200),
    message: sanitizeText(body?.message, 2000),
    imageUrl: sanitizeUrl(body?.imageUrl),
    buttonEnabled: Boolean(body?.buttonEnabled),
    buttonText: sanitizeText(body?.buttonText, 50) || 'Ver Mais',
    buttonLink,
    buttonLinkType,
    productId: typeof body?.productId === 'string' && body.productId.trim()
      ? body.productId.trim()
      : null,
    backgroundColor: sanitizeColor(body?.backgroundColor, '#FFFFFF'),
    textColor: sanitizeColor(body?.textColor, '#333333'),
    buttonColor: sanitizeColor(body?.buttonColor, '#FF6B00'),
    buttonTextColor: sanitizeColor(body?.buttonTextColor, '#FFFFFF'),
    footerText: sanitizeText(body?.footerText, 200) || null,
  };
}

// GET - Buscar configuração atual do popup
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const settings = await prisma.settings.findFirst({
      select: {
        popupEnabled: true,
        popupConfig: true,
      },
    });

    const popupConfig = settings?.popupConfig as PopupConfig | null;

    return NextResponse.json({
      success: true,
      enabled: settings?.popupEnabled ?? false,
      config: popupConfig ?? DEFAULT_POPUP_CONFIG,
    });
  } catch (error) {
    console.error('[Settings][popup] erro ao buscar popup:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração do popup' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configuração do popup
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const popupConfig = buildPopupPayload(body.config);
    const popupEnabled = Boolean(body.enabled);

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          ...DEFAULT_SETTINGS,
          popupEnabled,
          popupConfig: popupConfig as any,
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          popupEnabled,
          popupConfig: popupConfig as any,
        },
      });
    }

    // Revalidar páginas que exibem o popup
    revalidatePath('/');
    revalidatePath('/cardapio');
    revalidatePath('/checkout');
    revalidatePath('/admin/marketing/promocoes');

    return NextResponse.json({
      success: true,
      enabled: popupEnabled,
      config: popupConfig,
    });
  } catch (error) {
    console.error('[Settings][popup] erro ao atualizar popup:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração do popup' },
      { status: 500 }
    );
  }
}

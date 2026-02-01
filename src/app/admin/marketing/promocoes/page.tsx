import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PromotionsPageContent } from '@/components/admin/marketing/PromotionsPageContent';

function parseHomeHero(settings: any) {
  const DEFAULT = {
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBNzMX6lMna6nX8TjJy5jY_Kv-JczpymR3HD2gGTMwfjEinIlR9ziFO_zQV8AKcSbYx7BEsgrBWBOob-nNOaeEvjrEm8TeNmtAA6oPavzl-eLCGbkwcG_4lWfdccNsy0jWWql6Dj1lU-q9Jxwc2RN0B4GkYX93CFfR-YK7uWhLBAASkyFwY5K3FR_0bx5w_AcA95n3eywQvECREh3WvaQEj1-KUh7BC_f8z0zde_LUz5k83DP9ryssaU6GFpGrZLUcnYnhKfENfyDc',
    overlayColor: '#000000',
    overlayOpacity: 0.4,
    headline: 'SushiWorld: O Sabor do Japão na Sua Casa',
    headlineColor: '#ffffff',
    headlineSize: 4.5,
    bannerHeight: 60,
  };

  const banners = (settings?.banners as Record<string, any>) ?? {};
  const home = banners?.home ?? {};

  return {
    imageUrl: typeof home.imageUrl === 'string' ? home.imageUrl : DEFAULT.imageUrl,
    overlayColor:
      typeof home.overlayColor === 'string' ? home.overlayColor : DEFAULT.overlayColor,
    overlayOpacity:
      typeof home.overlayOpacity === 'number'
        ? Math.min(Math.max(home.overlayOpacity, 0), 1)
        : DEFAULT.overlayOpacity,
    headline:
      typeof home.headline === 'string' && home.headline.trim().length > 0
        ? home.headline
        : DEFAULT.headline,
    headlineColor:
      typeof home.headlineColor === 'string' ? home.headlineColor : DEFAULT.headlineColor,
    headlineSize:
      typeof home.headlineSize === 'number'
        ? Math.min(Math.max(home.headlineSize, 2.5), 6)
        : DEFAULT.headlineSize,
    bannerHeight:
      typeof home.bannerHeight === 'number'
        ? Math.min(Math.max(home.bannerHeight, 30), 100)
        : DEFAULT.bannerHeight,
  };
}

export type PopupConfig = {
  title: string;
  message: string;
  buttonEnabled: boolean;
  buttonText: string;
  buttonLink: string;
  buttonLinkType: 'page' | 'product' | 'external';
  productId?: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
};

const DEFAULT_POPUP_CONFIG: PopupConfig = {
  title: '',
  message: '',
  buttonEnabled: false,
  buttonText: 'Ver Mais',
  buttonLink: '/',
  buttonLinkType: 'page',
  productId: null,
  backgroundColor: '#FFFFFF',
  textColor: '#333333',
  buttonColor: '#FF6B00',
  buttonTextColor: '#FFFFFF',
};

function parsePopupSettings(settings: any): { enabled: boolean; config: PopupConfig } {
  const popupConfig = settings?.popupConfig as PopupConfig | null;

  return {
    enabled: settings?.popupEnabled ?? false,
    config: popupConfig ?? DEFAULT_POPUP_CONFIG,
  };
}

export default async function PromocoesPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  const [promotions, products, settings] = await Promise.all([
    prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        promotionItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                price: true,
              },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        price: true,
      },
    }),
    prisma.settings.findFirst(),
  ]);

  const popupSettings = parsePopupSettings(settings);

  return (
    <PromotionsPageContent
      currentUser={{
        id: session.user.id,
        role: session.user.role,
        managerLevel: session.user.managerLevel ?? null,
      }}
      initialPromotions={promotions}
      products={products}
      homeHero={parseHomeHero(settings)}
      initialPopup={popupSettings}
    />
  );
}
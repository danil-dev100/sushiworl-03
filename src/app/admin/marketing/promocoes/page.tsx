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
    />
  );
}
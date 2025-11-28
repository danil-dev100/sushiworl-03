import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PixelsAdsPageContent } from '@/components/admin/marketing/PixelsAdsPageContent';

export default async function PixelsAdsPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  try {
    const integrations = await prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return (
      <PixelsAdsPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        integrations={integrations as Array<{
          id: string;
          platform: string;
          name: string;
          config: Record<string, unknown> | null;
          isActive: boolean;
          createdAt: Date;
          updatedAt: Date;
        }>}
      />
    );
  } catch (error) {
    console.error('Erro ao buscar dados de pixels:', error);

    return (
      <PixelsAdsPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        integrations={[]}
      />
    );
  }
}

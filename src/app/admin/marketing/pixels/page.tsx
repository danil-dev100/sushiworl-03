import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PixelsAdsPageContent } from '@/components/admin/marketing/PixelsAdsPageContent';

type PixelIntegration = {
  id: string;
  name: string | null;
  platform: string;
  type: string;
  apiKey: string | null;
  apiSecret: string | null;
  pixelId: string | null;
  measurementId: string | null;
  accessToken: string | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default async function PixelsAdsPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  try {
    const integrationsFromDb = await prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Mapear para o tipo esperado pelo componente
    const integrations: PixelIntegration[] = integrationsFromDb.map(integration => ({
      id: integration.id,
      name: integration.name,
      platform: integration.platform,
      type: integration.type,
      apiKey: integration.apiKey,
      apiSecret: integration.apiSecret,
      pixelId: integration.pixelId,
      measurementId: integration.measurementId,
      accessToken: integration.accessToken,
      config: integration.config ? integration.config as Record<string, unknown> : null,
      isActive: integration.isActive,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }));

    return (
      <PixelsAdsPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        integrations={integrations}
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

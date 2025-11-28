import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { IntegrationsPageContent } from '@/components/admin/marketing/IntegrationsPageContent';

export default async function IntegrationsPage() {
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
      <IntegrationsPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        integrations={integrations}
      />
    );
  } catch (error) {
    console.error('Erro ao buscar integrações:', error);

    // Em caso de erro, retorna dados vazios
    return (
      <IntegrationsPageContent
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


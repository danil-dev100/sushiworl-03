import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WebhooksPageContent } from '@/components/admin/marketing/WebhooksPageContent';

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  try {
    const [webhooks, logs] = await Promise.all([
      prisma.webhook.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.webhookLog.findMany({
        orderBy: { triggeredAt: 'desc' },
        take: 50,
        include: {
          webhook: {
            select: { name: true, url: true },
          },
        },
      }),
    ]);

    return (
      <WebhooksPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        webhooks={webhooks}
        logs={logs}
      />
    );
  } catch (error) {
    console.error('Erro ao buscar dados de webhooks:', error);

    // Em caso de erro, retorna dados vazios
    return (
      <WebhooksPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        webhooks={[]}
        logs={[]}
      />
    );
  }
}

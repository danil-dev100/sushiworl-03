import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WebhooksPageContent } from '@/components/admin/marketing/WebhooksPageContent';
import { WebhookDirection } from '@prisma/client';

type WebhookWithHeaders = {
  id: string;
  name: string;
  url: string;
  method: string;
  direction: 'INBOUND' | 'OUTBOUND';
  events: string[];
  headers: Record<string, string> | null;
  secret: string | null;
  isActive: boolean;
  lastTriggeredAt: Date | null;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  try {
    const [webhooksFromDb, logs] = await Promise.all([
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

    // Mapear para o tipo esperado pelo componente
    const webhooks: WebhookWithHeaders[] = webhooksFromDb.map(webhook => ({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      method: webhook.method,
      direction: webhook.direction as 'INBOUND' | 'OUTBOUND',
      events: webhook.events,
      headers: webhook.headers ? (webhook.headers as Record<string, string>) : null,
      secret: webhook.secret,
      isActive: webhook.isActive,
      lastTriggeredAt: webhook.lastTriggeredAt,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    }));

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

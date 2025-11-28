import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmailMarketingPageContent } from '@/components/admin/marketing/EmailMarketingPageContent';

export default async function EmailMarketingPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  try {
    // Buscar automações e templates
    const [automations, templates] = await Promise.all([
      prisma.emailAutomation.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          logs: {
            orderBy: { executedAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.emailTemplate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return (
      <EmailMarketingPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        automations={automations}
        templates={templates}
        dbError={false}
      />
    );
  } catch (error) {
    console.error('Erro ao buscar dados de email marketing:', error);

    // Em caso de erro de banco, ainda mostra a interface com dados vazios
    // para que o usuário possa criar templates e automações quando o banco estiver disponível
    return (
      <EmailMarketingPageContent
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          managerLevel: session.user.managerLevel ?? null,
        }}
        automations={[]}
        templates={[]}
        dbError={true}
      />
    );
  }
}

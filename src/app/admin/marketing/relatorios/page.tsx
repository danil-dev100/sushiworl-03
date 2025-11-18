import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { ReportsPageContent } from '@/components/admin/marketing/ReportsPageContent';

export const metadata = {
  title: 'Relatórios | SushiWorld Admin',
  description: 'Análise de performance, métricas e relatórios de marketing',
};

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  return (
    <ReportsPageContent
      currentUser={{
        id: session.user.id,
        role: session.user.role,
        managerLevel: session.user.managerLevel ?? null,
      }}
    />
  );
}

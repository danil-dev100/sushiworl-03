import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import SMTPSettingsForm from '@/components/admin/email-marketing/SMTPSettingsForm';

export default async function SMTPSettingsPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  try {
    // Buscar configurações SMTP existentes
    const config = await prisma.emailMarketingConfig.findFirst();

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-[#f5f1e9]">
            Configurações SMTP
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure o servidor de email para envio de automações
          </p>
        </div>

        <SMTPSettingsForm initialConfig={config} />
      </div>
    );
  } catch (error) {
    console.error('Erro ao buscar configurações SMTP:', error);

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-[#f5f1e9]">
            Configurações SMTP
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure o servidor de email para envio de automações
          </p>
        </div>

        <SMTPSettingsForm initialConfig={null} />
      </div>
    );
  }
}

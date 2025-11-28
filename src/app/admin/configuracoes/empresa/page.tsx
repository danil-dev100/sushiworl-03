import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { CompanySettingsForm } from '@/components/admin/settings/CompanySettingsForm';
import { getServerSession } from 'next-auth';
import { authOptions, canManageSettings } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TooltipHelper } from '@/components/shared/TooltipHelper';

export const metadata: Metadata = {
  title: 'Configurações da Empresa | Admin - SushiWorld',
  description: 'Configure os dados da empresa e horários de atendimento',
};

async function getSettings() {
  let settings = await prisma.settings.findFirst();

  // Se não existir, criar configurações padrão
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        companyName: 'SushiWorld',
        billingName: 'Guilherme Alberto Rocha Ricardo',
        nif: '295949201',
        phone: '+351 934 841 148',
        email: 'pedidosushiworld@gmail.com',
        address: 'Santa Iria',
        vatRate: 13,
        vatType: 'INCLUSIVE',
        openingHours: {
          monday: { open: '12:00', close: '23:00', closed: false },
          tuesday: { open: '12:00', close: '23:00', closed: false },
          wednesday: { open: '12:00', close: '23:00', closed: true },
          thursday: { open: '12:00', close: '23:00', closed: false },
          friday: { open: '12:00', close: '00:00', closed: false },
          saturday: { open: '12:00', close: '00:00', closed: false },
          sunday: { open: '12:00', close: '23:00', closed: true },
        },
      },
    });
  }

  return settings;
}

export default async function ConfiguracoesEmpresaPage() {
  const session = await getServerSession(authOptions);

  if (!session || !canManageSettings(session.user.role)) {
    redirect('/admin/dashboard');
  }

  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center gap-2">
        <div>
          <h1 className="text-4xl font-black text-[#FF6B00]">
            Configurações da Empresa
          </h1>
          <p className="mt-1 text-sm text-[#a16b45]">
            Configure os dados da empresa, horários e impostos
          </p>
        </div>
        <TooltipHelper text="Configurações gerais da empresa incluindo dados fiscais, horários de funcionamento e informações de contato" />
      </header>

      {/* Form */}
      <CompanySettingsForm initialData={settings} />
    </div>
  );
}

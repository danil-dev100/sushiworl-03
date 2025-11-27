import PrinterSettingsEditor from '@/components/admin/orders/PrinterSettingsEditor';
import prisma from '@/lib/db';

async function getPrinterSettings() {
  try {
    const settings = await prisma.companySettings.findFirst({
      select: {
        printerSettings: true,
      },
    });

    return settings?.printerSettings as any || null;
  } catch (error) {
    console.error('Erro ao buscar configurações de impressora:', error);
    return null;
  }
}

export default async function PrinterSettingsPage() {
  const initialConfig = await getPrinterSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#333333] dark:text-[#f5f1e9]">
          Configurações de Impressão
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Personalize o modelo de recibo para impressão. Arraste as seções para reorganizar e use os
          toggles para mostrar/ocultar campos.
        </p>
      </div>

      <PrinterSettingsEditor initialConfig={initialConfig} />
    </div>
  );
}

import PrinterSettingsEditor from '@/components/admin/orders/PrinterSettingsEditor';

export default async function PrinterSettingsPage() {
  // Configuração inicial é null - será carregada do banco via API no componente cliente
  const initialConfig = null;

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

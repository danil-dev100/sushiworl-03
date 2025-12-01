'use client';

import dynamic from 'next/dynamic';

const PrinterSettingsEditor = dynamic(
  () => import('@/components/admin/orders/PrinterSettingsEditor'),
  { ssr: false }
);

export default function PrinterSettingsPage() {
  // Configuração inicial é undefined - será carregada do banco via API no componente cliente
  const initialConfig = undefined;

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

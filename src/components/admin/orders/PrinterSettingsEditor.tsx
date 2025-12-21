'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, Eye, EyeOff, Save, RotateCcw, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import OrderReceiptPreview, { OrderReceiptConfig } from './OrderReceiptPreview';
import PrintStyles from './PrintStyles';
import { toast } from 'sonner';

interface PrinterSettingsEditorProps {
  initialConfig?: OrderReceiptConfig;
  onSave?: (config: OrderReceiptConfig) => void;
}

const defaultConfig: OrderReceiptConfig = {
  sections: [
    { id: 'payment', name: 'Método de Pagamento', enabled: true, order: 1 },
    { id: 'asap', name: 'Tempo ASAP', enabled: true, order: 2 },
    { id: 'drive-time', name: 'Tempo de Condução', enabled: true, order: 3 },
    { id: 'delivery-info', name: 'Informações de Entrega', enabled: true, order: 4 },
    { id: 'order-details', name: 'Detalhes da Encomenda', enabled: true, order: 5 },
    { id: 'customer-info', name: 'Info do Cliente', enabled: true, order: 6 },
    { id: 'special-instructions', name: 'Instruções Especiais', enabled: true, order: 7 },
    { id: 'items', name: 'Itens do Pedido', enabled: true, order: 8 },
    { id: 'totals', name: 'Totais', enabled: true, order: 9 },
    { id: 'footer', name: 'Rodapé', enabled: true, order: 10 },
  ],
  fields: {
    showPaymentMethod: true,
    showAsapTime: true,
    showEstimatedDrive: true,
    showTrafficInfo: true,
    showDeliveryDistance: true,
    showQRCode: true,
    showOrderNumber: true,
    showOrderDates: true,
    showCustomerName: true,
    showCustomerEmail: true,
    showCustomerPhone: true,
    showSpecialInstructions: true,
    showItemVariants: true,
    showItemNotes: true,
    showSubtotal: true,
    showDeliveryFee: true,
    showBagFee: true,
    showTotal: true,
    showCompanyInfo: true,
    showWebsiteUrl: true,
  },
};

// Mock data para preview - será substituído por dados reais
const mockOrder = {
  id: '123',
  orderNumber: '1117774633',
  paymentMethod: 'Cartão na entrega',
  asapTime: 60,
  estimatedDriveTime: 13,
  trafficInfo: 'Tivemos em consideração o estado do tráfego real em 22 de novembro às 22:18',
  deliveryDistance: 'Norte 9,9 km',
  deliveryAddress: 'Rua Das Camélias 21-1 Direito, 2695-538, São joão da talha',
  placedAt: new Date().toISOString(),
  acceptedAt: new Date().toISOString(),
  completedAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  customer: {
    firstName: 'João',
    lastName: 'Silva',
    email: 'cliente@exemplo.com',
    phone: '+351 910 000 000',
  },
  specialInstructions: 'Ligar quando chegar, não tocar a campainha por favor',
  items: [
    {
      quantity: 1,
      name: 'Combo 1',
      variant: 'Cola 1/1 - Oferta: Cola 1/l',
      notes: 'Sem picante.',
      price: 29.50,
    },
  ],
  subtotal: 29.50,
  deliveryFee: 4.00,
  bagFee: 0.50,
  total: 34.00,
};

export default function PrinterSettingsEditor({ initialConfig, onSave }: PrinterSettingsEditorProps) {
  const [config, setConfig] = useState<OrderReceiptConfig>(initialConfig || defaultConfig);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Carregando...',
    address: '',
    phone: '',
    websiteUrl: '',
  });
  const [printerSettings, setPrinterSettings] = useState({
    printerType: '',
    printerName: '',
    paperSize: '80mm',
  });
  const printRef = useRef<HTMLDivElement>(null);

  // Buscar dados reais da empresa e configurações de impressão
  useEffect(() => {
    // Buscar dados da empresa
    fetch('/api/admin/settings/company-info')
      .then((res) => res.json())
      .then((data) => {
        setCompanyInfo({
          name: data.companyName,
          address: data.companyAddress,
          phone: data.companyPhone,
          websiteUrl: data.websiteUrl,
        });
      })
      .catch((error) => {
        console.error('Erro ao buscar dados da empresa:', error);
        setCompanyInfo({
          name: 'Seu Restaurante',
          address: 'Rua Exemplo, 123, Lisboa',
          phone: '+351 000 000 000',
          websiteUrl: 'seusite.com',
        });
      });

    // Buscar configurações de impressão salvas
    if (!initialConfig) {
      fetch('/api/admin/settings/printer')
        .then((res) => res.json())
        .then((savedConfig) => {
          if (savedConfig && savedConfig.sections) {
            setConfig(savedConfig);
          }
        })
        .catch((error) => {
          console.error('Erro ao buscar configurações de impressão:', error);
          // Manter config padrão em caso de erro
        });
    }

    // Buscar configurações da impressora (tipo, nome, tamanho)
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setPrinterSettings({
            printerType: data.printerType || '',
            printerName: data.printerName || '',
            paperSize: data.paperSize || '80mm',
          });
        }
      })
      .catch((error) => {
        console.error('Erro ao buscar configurações da impressora:', error);
      });
  }, [initialConfig]);

  // Função de impressão
  const handlePrint = () => {
    if (typeof window === 'undefined' || !printRef.current) return;

    // Capturar o HTML do preview
    const printContent = printRef.current.innerHTML;

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Bloqueador de pop-ups impediu a impressão. Por favor, permita pop-ups para este site.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Teste de Impressão - ${companyInfo.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              background: #f5f5f5;
            }
            .print-receipt {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              border: 1px solid #ddd;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .print-receipt {
                box-shadow: none;
                border: none;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newSections = [...config.sections];
    const draggedSection = newSections[draggedItem];
    newSections.splice(draggedItem, 1);
    newSections.splice(index, 0, draggedSection);

    // Atualizar ordem
    const updatedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx + 1,
    }));

    setConfig({ ...config, sections: updatedSections });
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const toggleSection = (sectionId: string) => {
    setConfig({
      ...config,
      sections: config.sections.map((section) =>
        section.id === sectionId ? { ...section, enabled: !section.enabled } : section
      ),
    });
  };

  const toggleField = (fieldName: keyof OrderReceiptConfig['fields']) => {
    setConfig({
      ...config,
      fields: {
        ...config.fields,
        [fieldName]: !config.fields[fieldName],
      },
    });
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setConfig(defaultConfig);
      toast.success('Configurações restauradas para o padrão');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Salvar configurações de layout de impressão
      const printerConfigResponse = await fetch('/api/admin/settings/printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!printerConfigResponse.ok) throw new Error('Erro ao salvar configurações de layout');

      // Salvar configurações da impressora (tipo, nome, tamanho)
      const printerSettingsResponse = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerSettings),
      });

      if (!printerSettingsResponse.ok) throw new Error('Erro ao salvar configurações da impressora');

      toast.success('Configurações de impressão salvas com sucesso!');
      if (onSave) onSave(config);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações de impressão');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PrintStyles />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor de Configurações */}
        <div className="space-y-6">
        <div className="bg-white dark:bg-[#2a1e14] rounded-lg border border-[#e5d5b5] dark:border-[#3d2e1f] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">
              Configurações de Impressão
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrão
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Configurações da Impressora */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-[#3d2e1f]">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9] mb-4">
              Configurações da Impressora
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="printerType" className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                  Tipo de Conexão
                </Label>
                <select
                  id="printerType"
                  value={printerSettings.printerType}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, printerType: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-[#e5d5b5] dark:border-[#3d2e1f] bg-white dark:bg-[#1a120c] text-sm text-[#333333] dark:text-[#f5f1e9] focus:border-[#FF6B00] focus:ring-[#FF6B00] p-2"
                >
                  <option value="">Selecione...</option>
                  <option value="USB">USB</option>
                  <option value="BLUETOOTH">Bluetooth</option>
                </select>
              </div>
              <div>
                <Label htmlFor="paperSize" className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                  Tamanho do Papel
                </Label>
                <select
                  id="paperSize"
                  value={printerSettings.paperSize}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, paperSize: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-[#e5d5b5] dark:border-[#3d2e1f] bg-white dark:bg-[#1a120c] text-sm text-[#333333] dark:text-[#f5f1e9] focus:border-[#FF6B00] focus:ring-[#FF6B00] p-2"
                >
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="printerName" className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                  Nome da Impressora
                </Label>
                <input
                  id="printerName"
                  type="text"
                  value={printerSettings.printerName}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, printerName: e.target.value })}
                  placeholder="Ex: EPSON TM-T20"
                  className="mt-1 block w-full rounded-lg border-[#e5d5b5] dark:border-[#3d2e1f] bg-white dark:bg-[#1a120c] text-sm text-[#333333] dark:text-[#f5f1e9] focus:border-[#FF6B00] focus:ring-[#FF6B00] p-2"
                />
              </div>
            </div>
          </div>

          {/* Seções - Drag and Drop */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9] mb-4">
              Ordem das Seções
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Arraste para reorganizar a ordem de exibição no recibo
            </p>
            <div className="space-y-2">
              {config.sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1a120c] border border-gray-200 dark:border-[#3d2e1f] rounded-lg cursor-move transition-all ${
                    draggedItem === index ? 'opacity-50' : ''
                  } hover:shadow-md`}
                >
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <span className="flex-1 text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                    {index + 1}. {section.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                    className="h-8 w-8 p-0"
                  >
                    {section.enabled ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Campos Detalhados */}
          <div>
            <h3 className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9] mb-4">
              Campos Detalhados
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Escolha quais informações exibir em cada seção
            </p>
            <div className="space-y-4">
              {/* Método de Pagamento */}
              <div className="border-b border-gray-200 dark:border-[#3d2e1f] pb-3">
                <h4 className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9] mb-2">
                  Pagamento & Tempo
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showPaymentMethod" className="text-sm">
                      Método de Pagamento
                    </Label>
                    <Switch
                      id="showPaymentMethod"
                      checked={config.fields.showPaymentMethod}
                      onCheckedChange={() => toggleField('showPaymentMethod')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showAsapTime" className="text-sm">
                      Tempo ASAP
                    </Label>
                    <Switch
                      id="showAsapTime"
                      checked={config.fields.showAsapTime}
                      onCheckedChange={() => toggleField('showAsapTime')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showEstimatedDrive" className="text-sm">
                      Tempo de Condução
                    </Label>
                    <Switch
                      id="showEstimatedDrive"
                      checked={config.fields.showEstimatedDrive}
                      onCheckedChange={() => toggleField('showEstimatedDrive')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTrafficInfo" className="text-sm">
                      Info de Tráfego
                    </Label>
                    <Switch
                      id="showTrafficInfo"
                      checked={config.fields.showTrafficInfo}
                      onCheckedChange={() => toggleField('showTrafficInfo')}
                    />
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div className="border-b border-gray-200 dark:border-[#3d2e1f] pb-3">
                <h4 className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9] mb-2">
                  Entrega
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDeliveryDistance" className="text-sm">
                      Distância de Entrega
                    </Label>
                    <Switch
                      id="showDeliveryDistance"
                      checked={config.fields.showDeliveryDistance}
                      onCheckedChange={() => toggleField('showDeliveryDistance')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showQRCode" className="text-sm">
                      QR Code
                    </Label>
                    <Switch
                      id="showQRCode"
                      checked={config.fields.showQRCode}
                      onCheckedChange={() => toggleField('showQRCode')}
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes da Encomenda */}
              <div className="border-b border-gray-200 dark:border-[#3d2e1f] pb-3">
                <h4 className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9] mb-2">
                  Detalhes da Encomenda
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showOrderNumber" className="text-sm">
                      Número da Encomenda
                    </Label>
                    <Switch
                      id="showOrderNumber"
                      checked={config.fields.showOrderNumber}
                      onCheckedChange={() => toggleField('showOrderNumber')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showOrderDates" className="text-sm">
                      Datas (Colocado/Aceite/Realizado)
                    </Label>
                    <Switch
                      id="showOrderDates"
                      checked={config.fields.showOrderDates}
                      onCheckedChange={() => toggleField('showOrderDates')}
                    />
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="border-b border-gray-200 dark:border-[#3d2e1f] pb-3">
                <h4 className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9] mb-2">
                  Informações do Cliente
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCustomerName" className="text-sm">
                      Nome e Apelido
                    </Label>
                    <Switch
                      id="showCustomerName"
                      checked={config.fields.showCustomerName}
                      onCheckedChange={() => toggleField('showCustomerName')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCustomerEmail" className="text-sm">
                      Email
                    </Label>
                    <Switch
                      id="showCustomerEmail"
                      checked={config.fields.showCustomerEmail}
                      onCheckedChange={() => toggleField('showCustomerEmail')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCustomerPhone" className="text-sm">
                      Telefone
                    </Label>
                    <Switch
                      id="showCustomerPhone"
                      checked={config.fields.showCustomerPhone}
                      onCheckedChange={() => toggleField('showCustomerPhone')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showSpecialInstructions" className="text-sm">
                      Instruções Especiais
                    </Label>
                    <Switch
                      id="showSpecialInstructions"
                      checked={config.fields.showSpecialInstructions}
                      onCheckedChange={() => toggleField('showSpecialInstructions')}
                    />
                  </div>
                </div>
              </div>

              {/* Itens */}
              <div className="border-b border-gray-200 dark:border-[#3d2e1f] pb-3">
                <h4 className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9] mb-2">
                  Itens do Pedido
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showItemVariants" className="text-sm">
                      Variantes/Opções
                    </Label>
                    <Switch
                      id="showItemVariants"
                      checked={config.fields.showItemVariants}
                      onCheckedChange={() => toggleField('showItemVariants')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showItemNotes" className="text-sm">
                      Observações
                    </Label>
                    <Switch
                      id="showItemNotes"
                      checked={config.fields.showItemNotes}
                      onCheckedChange={() => toggleField('showItemNotes')}
                    />
                  </div>
                </div>
              </div>

              {/* Totais */}
              <div className="border-b border-gray-200 dark:border-[#3d2e1f] pb-3">
                <h4 className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9] mb-2">
                  Totais
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showSubtotal" className="text-sm">
                      Subtotal
                    </Label>
                    <Switch
                      id="showSubtotal"
                      checked={config.fields.showSubtotal}
                      onCheckedChange={() => toggleField('showSubtotal')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDeliveryFee" className="text-sm">
                      Taxa de Entrega
                    </Label>
                    <Switch
                      id="showDeliveryFee"
                      checked={config.fields.showDeliveryFee}
                      onCheckedChange={() => toggleField('showDeliveryFee')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBagFee" className="text-sm">
                      Taxa de Saco
                    </Label>
                    <Switch
                      id="showBagFee"
                      checked={config.fields.showBagFee}
                      onCheckedChange={() => toggleField('showBagFee')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTotal" className="text-sm">
                      Total
                    </Label>
                    <Switch
                      id="showTotal"
                      checked={config.fields.showTotal}
                      onCheckedChange={() => toggleField('showTotal')}
                    />
                  </div>
                </div>
              </div>

              {/* Rodapé */}
              <div>
                <h4 className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9] mb-2">
                  Rodapé
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showWebsiteUrl" className="text-sm">
                      URL do Website
                    </Label>
                    <Switch
                      id="showWebsiteUrl"
                      checked={config.fields.showWebsiteUrl}
                      onCheckedChange={() => toggleField('showWebsiteUrl')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompanyInfo" className="text-sm">
                      Informações da Empresa
                    </Label>
                    <Switch
                      id="showCompanyInfo"
                      checked={config.fields.showCompanyInfo}
                      onCheckedChange={() => toggleField('showCompanyInfo')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-6">
        <div className="bg-white dark:bg-[#2a1e14] rounded-lg border border-[#e5d5b5] dark:border-[#3d2e1f] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">
              Preview em Tempo Real
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir Teste
            </Button>
          </div>

          {/* Info sobre dados reais */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              ℹ️ <strong>Dados da empresa:</strong> Este preview usa as informações reais do seu restaurante configuradas em{' '}
              <a href="/admin/configuracoes/empresa" className="underline hover:text-blue-600">
                Configurações da Empresa
              </a>
            </p>
          </div>

          <div className="flex justify-center">
            <div ref={printRef}>
              <OrderReceiptPreview order={mockOrder} companyInfo={companyInfo} config={config} />
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

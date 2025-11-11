'use client';

import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { OpeningHoursEditor } from './OpeningHoursEditor';
import { useRouter } from 'next/navigation';

interface CompanySettingsFormProps {
  initialData: any;
}

export function CompanySettingsForm({ initialData }: CompanySettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: initialData.companyName || '',
    billingName: initialData.billingName || '',
    nif: initialData.nif || '',
    address: initialData.address || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    vatRate: initialData.vatRate || 13,
    vatType: initialData.vatType || 'INCLUSIVE',
    openingHours: initialData.openingHours || {},
    printerType: initialData.printerType || '',
    printerName: initialData.printerName || '',
    paperSize: initialData.paperSize || '80mm',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Configurações salvas com sucesso!');
        router.refresh();
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <details open>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h2 className="text-xl font-bold text-[#FF6B00]">
              Informações Básicas
            </h2>
          </summary>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Nome para Fatura
              </label>
              <input
                type="text"
                value={formData.billingName}
                onChange={(e) =>
                  setFormData({ ...formData, billingName: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                NIF
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) =>
                  setFormData({ ...formData, nif: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Horários de Funcionamento */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h2 className="text-xl font-bold text-[#FF6B00]">
              Horário de Funcionamento
            </h2>
          </summary>
          <div className="mt-6">
            <OpeningHoursEditor
              value={formData.openingHours}
              onChange={(openingHours) =>
                setFormData({ ...formData, openingHours })
              }
            />
          </div>
        </details>
      </div>

      {/* Configurações de IVA */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h2 className="text-xl font-bold text-[#FF6B00]">
              Configurações de IVA
            </h2>
          </summary>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Taxa de IVA (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.vatRate}
                onChange={(e) =>
                  setFormData({ ...formData, vatRate: parseFloat(e.target.value) })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Tipo
              </label>
              <select
                value={formData.vatType}
                onChange={(e) =>
                  setFormData({ ...formData, vatType: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
              >
                <option value="INCLUSIVE">Inclusivo (já incluído no preço)</option>
                <option value="EXCLUSIVE">Exclusivo (somado ao preço)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-[#f5f1e9] p-4 dark:bg-[#23170f]">
            <p className="text-sm text-[#a16b45]">
              <strong>Inclusivo:</strong> O IVA já está incluído no preço do produto.
              <br />
              <strong>Exclusivo:</strong> O IVA será somado ao preço do produto.
            </p>
          </div>
        </details>
      </div>

      {/* Configuração de Impressora */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h2 className="text-xl font-bold text-[#FF6B00]">
              Configuração de Impressora
            </h2>
          </summary>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Tipo de Conexão
              </label>
              <select
                value={formData.printerType}
                onChange={(e) =>
                  setFormData({ ...formData, printerType: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
              >
                <option value="">Selecione...</option>
                <option value="USB">USB</option>
                <option value="BLUETOOTH">Bluetooth</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Tamanho do Papel
              </label>
              <select
                value={formData.paperSize}
                onChange={(e) =>
                  setFormData({ ...formData, paperSize: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
              >
                <option value="58mm">58mm</option>
                <option value="80mm">80mm</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                Nome da Impressora
              </label>
              <input
                type="text"
                value={formData.printerName}
                onChange={(e) =>
                  setFormData({ ...formData, printerName: e.target.value })
                }
                placeholder="Ex: EPSON TM-T20"
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </form>
  );
}


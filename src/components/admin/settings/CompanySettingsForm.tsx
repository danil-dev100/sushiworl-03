'use client';

import { useState } from 'react';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { OpeningHoursEditor } from './OpeningHoursEditor';
import { useRouter } from 'next/navigation';

interface AdditionalItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  isRequired: boolean; // Se o item é obrigatório ou opcional
}

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
    websiteUrl: initialData.websiteUrl || '',
    vatRate: initialData.vatRate || 13,
    vatType: initialData.vatType || 'INCLUSIVE',
    openingHours: initialData.openingHours || {},
    additionalItems: initialData.additionalItems || [
      { id: '1', name: 'Saco para Envio', price: 0.50, isActive: true, isRequired: false },
    ],
    checkoutAdditionalItems: initialData.checkoutAdditionalItems || [],
  });

  const addAdditionalItem = () => {
    const newItem: AdditionalItem = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      isActive: true,
      isRequired: false,
    };
    setFormData({
      ...formData,
      additionalItems: [...formData.additionalItems, newItem],
    });
  };

  const removeAdditionalItem = (id: string) => {
    setFormData({
      ...formData,
      additionalItems: formData.additionalItems.filter((item: AdditionalItem) => item.id !== id),
    });
  };

  const updateAdditionalItem = (id: string, field: keyof AdditionalItem, value: string | number | boolean) => {
    setFormData({
      ...formData,
      additionalItems: formData.additionalItems.map((item: AdditionalItem) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  // Funções para Itens do Checkout
  const addCheckoutItem = () => {
    const newItem: AdditionalItem = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      isActive: true,
      isRequired: false,
    };
    setFormData({
      ...formData,
      checkoutAdditionalItems: [...formData.checkoutAdditionalItems, newItem],
    });
  };

  const removeCheckoutItem = (id: string) => {
    setFormData({
      ...formData,
      checkoutAdditionalItems: formData.checkoutAdditionalItems.filter((item: AdditionalItem) => item.id !== id),
    });
  };

  const updateCheckoutItem = (id: string, field: keyof AdditionalItem, value: string | number | boolean) => {
    setFormData({
      ...formData,
      checkoutAdditionalItems: formData.checkoutAdditionalItems.map((item: AdditionalItem) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CompanySettingsForm] 🚀 Salvando configurações...');
    console.log('[CompanySettingsForm] 📝 formData:', formData);
    console.log('[CompanySettingsForm] ⏰ openingHours:', formData.openingHours);
    setLoading(true);

    try {
      console.log('[CompanySettingsForm] 📡 Fazendo request para /api/admin/settings');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('[CompanySettingsForm] 📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[CompanySettingsForm] ✅ Resposta da API:', result);
        console.log('[CompanySettingsForm] ⏰ openingHours salvo:', result.openingHours);
        alert('Configurações salvas com sucesso!');
        router.refresh();
      } else {
        const error = await response.json();
        console.error('[CompanySettingsForm] ❌ Erro da API:', error);
        alert('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('[CompanySettingsForm] ❌ Erro:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
      console.log('[CompanySettingsForm] ⏹️ Loading finalizado');
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                URL do Site
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                placeholder="https://seurestaurante.com"
                className="mt-1 block w-full rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Este URL será exibido no rodapé do recibo de impressão
              </p>
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

      {/* Itens Adicionais do Carrinho */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h2 className="text-xl font-bold text-[#FF6B00]">
              Itens Adicionais do Carrinho
            </h2>
          </summary>
          <div className="mt-6">
            <p className="text-sm text-[#a16b45] mb-4">
              Configure itens opcionais que podem ser adicionados ao carrinho, como saco para envio, molhos extras, etc.
            </p>

            <div className="space-y-4">
              {formData.additionalItems.map((item: AdditionalItem) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-[#ead9cd] dark:border-[#4a3c30] bg-[#f5f1e9] dark:bg-[#23170f]"
                >
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => updateAdditionalItem(item.id, 'isActive', e.target.checked)}
                    className="h-5 w-5 rounded border-[#ead9cd] text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#a16b45] mb-1">
                        Nome do Item
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateAdditionalItem(item.id, 'name', e.target.value)}
                        placeholder="Ex: Saco para Envio"
                        className="block w-full rounded-lg border-[#ead9cd] bg-white text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#2a1e14] dark:text-[#f5f1e9]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#a16b45] mb-1">
                        Preço (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateAdditionalItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-lg border-[#ead9cd] bg-white text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#2a1e14] dark:text-[#f5f1e9]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#a16b45] mb-1">
                        Tipo
                      </label>
                      <select
                        value={item.isRequired ? 'required' : 'optional'}
                        onChange={(e) => updateAdditionalItem(item.id, 'isRequired', e.target.value === 'required')}
                        className="block w-full rounded-lg border-[#ead9cd] bg-white text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#2a1e14] dark:text-[#f5f1e9]"
                      >
                        <option value="optional">Opcional</option>
                        <option value="required">Obrigatório</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdditionalItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addAdditionalItem}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-[#FF6B00] hover:text-[#FF6B00]/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Item
            </button>

            <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Dica:</strong> Estes itens aparecerão no carrinho para o cliente selecionar antes de finalizar o pedido.
                <br />
                <strong>Opcional:</strong> Cliente pode escolher se quer ou não adicionar.
                <br />
                <strong>Obrigatório:</strong> Item já vem marcado e o cliente precisa desmarcar se não quiser.
              </p>
            </div>
          </div>
        </details>
      </div>

      {/* Itens Adicionais do Checkout */}
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h2 className="text-xl font-bold text-[#FF6B00]">
              Itens Adicionais do Checkout
            </h2>
          </summary>
          <div className="mt-6">
            <p className="text-sm text-[#a16b45] mb-4">
              Configure itens opcionais que aparecerão na página de checkout (finalização do pedido), como gorjeta para entregador, doação, etc.
            </p>

            <div className="space-y-4">
              {formData.checkoutAdditionalItems.map((item: AdditionalItem) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-[#ead9cd] dark:border-[#4a3c30] bg-[#f5f1e9] dark:bg-[#23170f]"
                >
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => updateCheckoutItem(item.id, 'isActive', e.target.checked)}
                    className="h-5 w-5 rounded border-[#ead9cd] text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#a16b45] mb-1">
                        Nome do Item
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateCheckoutItem(item.id, 'name', e.target.value)}
                        placeholder="Ex: Gorjeta para Entregador"
                        className="block w-full rounded-lg border-[#ead9cd] bg-white text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#2a1e14] dark:text-[#f5f1e9]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#a16b45] mb-1">
                        Preço (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateCheckoutItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-lg border-[#ead9cd] bg-white text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#2a1e14] dark:text-[#f5f1e9]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#a16b45] mb-1">
                        Tipo
                      </label>
                      <select
                        value={item.isRequired ? 'required' : 'optional'}
                        onChange={(e) => updateCheckoutItem(item.id, 'isRequired', e.target.value === 'required')}
                        className="block w-full rounded-lg border-[#ead9cd] bg-white text-sm text-[#333333] focus:border-[#FF6B00] focus:ring-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#2a1e14] dark:text-[#f5f1e9]"
                      >
                        <option value="optional">Opcional</option>
                        <option value="required">Obrigatório</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCheckoutItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCheckoutItem}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-[#FF6B00] hover:text-[#FF6B00]/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Item
            </button>

            <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Dica:</strong> Estes itens aparecerão na página final de checkout, onde o cliente confirma o pedido e escolhe a forma de pagamento.
                <br />
                <strong>Opcional:</strong> Cliente pode escolher se quer ou não adicionar.
                <br />
                <strong>Obrigatório:</strong> Item já vem marcado e o cliente precisa desmarcar se não quiser.
              </p>
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


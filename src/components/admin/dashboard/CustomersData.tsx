'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Download,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Euro,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

interface CustomersSummary {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrdersPerCustomer: string | number;
  averageSpentPerCustomer: string | number;
}

interface CustomersResponse {
  customers: Customer[];
  summary: CustomersSummary;
}

export default function CustomersData() {
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (start?: string, end?: string) => {
    try {
      setIsLoading(true);
      let url = '/api/admin/dashboard/customers';
      const params = new URLSearchParams();

      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setCurrentPage(1); // Reset to first page
      } else {
        console.error('[CustomersData] Erro na resposta:', response.status);
      }
    } catch (error) {
      console.error('[CustomersData] Erro ao buscar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDateFilter = () => {
    fetchCustomers(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchCustomers();
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/admin/dashboard/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('CSV exportado com sucesso!');
      } else {
        toast.error('Erro ao exportar CSV');
      }
    } catch (error) {
      console.error('[CustomersData] Erro ao exportar:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrar clientes por busca
  const filteredCustomers = data?.customers.filter((customer) => {
    if (!searchTerm || searchTerm.trim() === '') return true;
    const search = searchTerm.toLowerCase().trim();

    // Verificar cada campo com segurança para null/undefined
    const nameMatch = customer.name ? customer.name.toLowerCase().includes(search) : false;
    const emailMatch = customer.email ? customer.email.toLowerCase().includes(search) : false;
    const phoneMatch = customer.phone ? customer.phone.toLowerCase().includes(search) : false;
    const addressMatch = customer.address ? customer.address.toLowerCase().includes(search) : false;

    return nameMatch || emailMatch || phoneMatch || addressMatch;
  }) || [];

  // Paginação
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
            <span className="text-sm text-[#a16b45] dark:text-[#d4a574]">
              Carregando dados dos clientes...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-900/30">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
              Dados dos Clientes
            </h3>
            <p className="text-sm text-[#a16b45] dark:text-[#d4a574]">
              Informações de contato e histórico de pedidos
            </p>
          </div>
        </div>

        {/* Filtros e Ações */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de data */}
          <div className="flex items-center gap-2 rounded-lg border border-[#ead9cd] bg-[#f5f1e9]/50 p-2 dark:border-[#4a3c30] dark:bg-[#23170f]">
            <Calendar className="h-4 w-4 text-[#a16b45]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-none bg-transparent text-sm text-[#333333] outline-none dark:text-[#f5f1e9]"
              placeholder="Data início"
            />
            <span className="text-[#a16b45]">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-none bg-transparent text-sm text-[#333333] outline-none dark:text-[#f5f1e9]"
              placeholder="Data fim"
            />
            <Button
              onClick={handleApplyDateFilter}
              size="sm"
              className="bg-[#FF6B00] hover:bg-[#e55f00] text-white"
            >
              Filtrar
            </Button>
            {(startDate || endDate) && (
              <Button
                onClick={handleClearFilter}
                size="sm"
                variant="outline"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Exportar CSV */}
          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Resumo */}
      {data?.summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9]/50 p-4 dark:border-[#4a3c30] dark:bg-[#23170f]">
            <div className="flex items-center gap-2 text-sm text-[#a16b45] dark:text-[#d4a574]">
              <Users className="h-4 w-4" />
              Total de Clientes
            </div>
            <div className="mt-1 text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">
              {data.summary.totalCustomers}
            </div>
          </div>
          <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9]/50 p-4 dark:border-[#4a3c30] dark:bg-[#23170f]">
            <div className="flex items-center gap-2 text-sm text-[#a16b45] dark:text-[#d4a574]">
              <ShoppingBag className="h-4 w-4" />
              Total de Pedidos
            </div>
            <div className="mt-1 text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">
              {data.summary.totalOrders}
            </div>
          </div>
          <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9]/50 p-4 dark:border-[#4a3c30] dark:bg-[#23170f]">
            <div className="flex items-center gap-2 text-sm text-[#a16b45] dark:text-[#d4a574]">
              <Euro className="h-4 w-4" />
              Receita Total
            </div>
            <div className="mt-1 text-2xl font-bold text-[#FF6B00]">
              €{Number(data.summary.totalRevenue).toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border border-[#ead9cd] bg-[#f5f1e9]/50 p-4 dark:border-[#4a3c30] dark:bg-[#23170f]">
            <div className="flex items-center gap-2 text-sm text-[#a16b45] dark:text-[#d4a574]">
              <Euro className="h-4 w-4" />
              Média por Cliente
            </div>
            <div className="mt-1 text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">
              €{data.summary.averageSpentPerCustomer}
            </div>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a16b45]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nome, email, telefone ou endereço..."
            className="w-full rounded-lg border border-[#ead9cd] bg-white py-2 pl-10 pr-4 text-sm text-[#333333] outline-none focus:border-[#FF6B00] dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="mb-4 h-16 w-16 text-[#dfc7b4]" />
          <h4 className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
            Nenhum cliente encontrado
          </h4>
          <p className="text-sm text-[#a16b45]">
            {searchTerm
              ? 'Tente ajustar os termos de busca'
              : 'Os clientes aparecerão aqui quando houver pedidos'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ead9cd] dark:border-[#4a3c30]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#a16b45]">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#a16b45]">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#a16b45]">
                    Endereço
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#a16b45]">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#a16b45]">
                    Total Gasto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ead9cd] dark:divide-[#4a3c30]">
                {paginatedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-[#f5f1e9]/50 dark:hover:bg-[#23170f]/50"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                        {customer.name || 'Sem nome'}
                      </div>
                      <div className="text-xs text-[#a16b45]">
                        Último pedido: {new Date(customer.lastOrderDate).toLocaleDateString('pt-PT')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-[#333333] dark:text-[#f5f1e9]">
                            <Phone className="h-3 w-3 text-[#a16b45]" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-[#333333] dark:text-[#f5f1e9]">
                            <Mail className="h-3 w-3 text-[#a16b45]" />
                            <span className="max-w-[200px] truncate">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {customer.address ? (
                        <div className="flex items-start gap-2 text-sm text-[#333333] dark:text-[#f5f1e9]">
                          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#a16b45]" />
                          <span className="max-w-[250px] truncate">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#a16b45]">Não informado</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-lg font-bold text-[#FF6B00]">
                        €{customer.totalSpent.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-[#ead9cd] pt-4 dark:border-[#4a3c30]">
              <div className="text-sm text-[#a16b45]">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de{' '}
                {filteredCustomers.length} clientes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-[#333333] dark:text-[#f5f1e9]">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

interface OrderData {
  id: string;
  total: number;
  items: string;
  emailSent: boolean;
}

export default function ObrigadoPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    // Buscar dados do pedido do sessionStorage
    const storedOrder = sessionStorage.getItem('lastOrder');
    if (storedOrder) {
      setOrderData(JSON.parse(storedOrder));
      // Limpar após leitura
      sessionStorage.removeItem('lastOrder');
    }
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <main className="flex flex-1 justify-center py-10 px-4 sm:px-6 md:px-8">
        <div className="flex flex-col w-full max-w-2xl flex-1 items-center justify-center">
          <div className="w-full bg-white dark:bg-[#3a2a1d] rounded-xl shadow-lg p-6 sm:p-8 md:p-10 text-center flex flex-col gap-6">
            {/* Ícone de Sucesso */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 bg-[#FF6B00]/20 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-[#FF6B00]" />
              </div>
              <h1 className="text-[#FF6B00] tracking-tight text-3xl sm:text-4xl font-bold leading-tight px-4 pb-2 pt-2">
                Obrigado! Seu pedido foi confirmado.
              </h1>
              <p className="text-[#a16b45] dark:text-[#a1a1aa] text-base font-normal leading-normal pt-2 px-4 text-center max-w-md">
                {orderData?.emailSent
                  ? 'Você receberá um e-mail de confirmação em breve com todos os detalhes do seu pedido.'
                  : 'Seu pedido foi registrado com sucesso e está aguardando confirmação do restaurante.'}
              </p>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Resumo da Compra */}
            <div className="text-left w-full bg-[#f5f1e9] dark:bg-[#23170f] p-6 rounded-lg">
              <h4 className="text-[#333333] dark:text-[#f5f1e9] text-lg font-bold leading-tight tracking-[-0.015em] mb-4">
                Resumo da sua compra
              </h4>
              <p className="text-[#333333] dark:text-[#f5f1e9] text-base font-normal leading-normal mb-6">
                {orderData?.items || 'Carregando itens...'}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between gap-x-6 py-1">
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-normal leading-normal">
                    ID do Pedido
                  </p>
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-medium leading-normal text-right">
                    {orderData?.id || '...'}
                  </p>
                </div>
                <div className="flex justify-between gap-x-6 py-1">
                  <p className="text-[#333333] dark:text-[#f5f1e9] text-sm font-normal leading-normal">
                    Valor Total
                  </p>
                  <p className="text-[#FF6B00] text-sm font-bold leading-normal text-right">
                    €{orderData?.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Informação sobre Email */}
            {orderData?.emailSent && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  📧 Um e-mail com o resumo do seu pedido foi enviado para o seu endereço de e-mail cadastrado.
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pedidos"
                className="flex min-w-[84px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#FF6B00] text-white text-base font-bold leading-normal tracking-[0.015em] w-full sm:w-auto hover:opacity-90 transition-opacity"
              >
                <span className="truncate">Ver meus pedidos</span>
              </Link>
              <Link
                href="/"
                className="flex min-w-[84px] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#FF6B00]/20 text-[#FF6B00] text-base font-bold leading-normal tracking-[0.015em] w-full sm:w-auto hover:bg-[#FF6B00]/30 transition-colors"
              >
                <span className="truncate">Voltar à página inicial</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

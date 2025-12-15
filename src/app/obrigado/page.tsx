import { Suspense } from 'react';
import { CheckCircle, Home, Receipt } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Pedido Confirmado - SushiWorld',
  description: 'Seu pedido foi confirmado com sucesso!'
};

function ThankYouContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          {/* Ícone de sucesso */}
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Mensagem principal */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Pedido Confirmado!
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Seu pedido foi aceito com sucesso!
          </p>

          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Você receberá um e-mail de confirmação com os detalhes do seu pedido e o tempo estimado de entrega.
          </p>

          {/* Informação adicional */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              ✅ E-mail de confirmação enviado
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Prepare-se para receber seu pedido em breve!
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <Link
              href="/pedidos"
              className="flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Receipt className="w-5 h-5" />
              Ver Meus Pedidos
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              Voltar ao Início
            </Link>
          </div>
        </div>

        {/* Informação de suporte */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Dúvidas? Entre em contato conosco pelo e-mail ou telefone
        </p>
      </div>
    </div>
  );
}

export default function ObrigadoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}

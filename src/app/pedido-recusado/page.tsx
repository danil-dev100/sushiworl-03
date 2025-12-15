import { Suspense } from 'react';
import { XCircle, Home, ShoppingCart, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Pedido Recusado - SushiWorld',
  description: 'Informações sobre seu pedido'
};

function getRejectionMessage(searchParams: { reason?: string }) {
  const reason = searchParams?.reason || 'offline';

  switch (reason) {
    case 'closed':
      return {
        title: 'Estamos Fechados',
        message: 'Desculpe, estamos fechados neste momento.',
        detail: 'Volte durante nosso horário de funcionamento para fazer seu pedido.',
        icon: <Clock className="w-12 h-12 text-orange-600 dark:text-orange-400" />
      };
    case 'offline':
      return {
        title: 'Restaurante Offline',
        message: 'Desculpe, não estamos aceitando pedidos no momento.',
        detail: 'Estamos temporariamente offline. Tente novamente mais tarde.',
        icon: <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
      };
    case 'high-demand':
    default:
      return {
        title: 'Alta Demanda',
        message: 'Desculpe, devido à alta demanda, não estamos aceitando novos pedidos no momento.',
        detail: 'Por favor, tente novamente mais tarde. Agradecemos sua compreensão!',
        icon: <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
      };
  }
}

async function RejectionContent({ searchParams }: { searchParams: { reason?: string } }) {
  const content = getRejectionMessage(searchParams);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          {/* Ícone */}
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            {content.icon}
          </div>

          {/* Mensagem principal */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {content.title}
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            {content.message}
          </p>

          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {content.detail}
          </p>

          {/* Informação adicional */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              💡 Dica
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Você pode verificar nosso horário de funcionamento e fazer um novo pedido quando estivermos abertos!
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E56000] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Ver Cardápio
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
          Em caso de dúvidas, entre em contato conosco
        </p>
      </div>
    </div>
  );
}

export default async function PedidoRecusadoPage({
  searchParams
}: {
  searchParams: { reason?: string };
}) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RejectionContent searchParams={searchParams} />
    </Suspense>
  );
}

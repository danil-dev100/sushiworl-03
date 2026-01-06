import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ObrigadoClient } from './ObrigadoClient';

// ✅ AGORA É UM SERVER COMPONENT - VALIDA NO SERVIDOR!
export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  // 1. Await searchParams (Next.js 15+ requirement)
  const params = await searchParams;
  const orderId = params.orderId;

  console.log('[Obrigado Page] 🔍 OrderID recebido:', orderId);

  if (!orderId) {
    console.warn('[Obrigado] ❌ Tentativa de acesso sem orderId');
    redirect('/');
  }

  // 2. Buscar pedido NO SERVIDOR (dados validados)
  let order;
  try {
    console.log('[Obrigado Page] 📡 Buscando pedido no banco:', orderId);
    console.log('[Obrigado Page] 🔍 Tipo do orderId:', typeof orderId);
    console.log('[Obrigado Page] 🔍 Length do orderId:', orderId?.length);

    order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: {
            id: true,
            name: true,
            quantity: true,
            priceAtTime: true,
          },
        },
      },
    });

    console.log('[Obrigado Page] ✅ Pedido encontrado:', !!order);
    console.log('[Obrigado Page] 📦 Pedido completo:', order ? 'SIM' : 'NAO');
    if (order) {
      console.log('[Obrigado Page] 📦 OrderID do banco:', order.id);
      console.log('[Obrigado Page] 📦 Total de itens:', order.orderItems?.length);
    }
  } catch (error) {
    console.error('[Obrigado Page] ❌ ERRO CRÍTICO ao buscar pedido:', error);
    console.error('[Obrigado Page] ❌ Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Obrigado Page] ❌ Mensagem:', error instanceof Error ? error.message : String(error));
    console.error('[Obrigado Page] ❌ Stack:', error instanceof Error ? error.stack : 'N/A');
    redirect('/');
  }

  // 3. Se pedido não existe, redirecionar
  if (!order) {
    console.warn('[Obrigado Page] ❌ Pedido não encontrado no banco:', orderId);
    console.warn('[Obrigado Page] ❌ Redirecionando para home...');
    redirect('/');
  }

  // 4. Converter Date para string (serialização)
  const serializedOrder = {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };

  // 5. Passar dados VALIDADOS para componente client
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <ObrigadoClient order={serializedOrder as any} />
    </Suspense>
  );
}

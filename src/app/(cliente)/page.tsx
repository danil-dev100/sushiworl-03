import { Metadata } from 'next';
import HeroBanner from '@/components/cliente/HeroBanner';
import SidebarMenu from '@/components/cliente/SidebarMenu';
import ProductSection from '@/components/cliente/ProductSection';
import DeliveryNotice from '@/components/cliente/DeliveryNotice';
import { prisma } from '@/lib/db';

// Forçar página dinâmica para sempre buscar dados atualizados
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'SushiWorld: Sushi Delivery em Santa Iria | Peça Online',
  description: 'Peça o melhor sushi de Santa Iria no SushiWorld. Combinados, hots, sashimi e muito mais. Delivery rápido e saboroso. Confira nosso cardápio!',
  keywords: 'sushi, delivery, santa iria, cardápio, peça online, comida japonesa',
  openGraph: {
    title: 'SushiWorld: Sushi Delivery em Santa Iria | Peça Online',
    description: 'Peça o melhor sushi de Santa Iria no SushiWorld. Combinados, hots, sashimi e muito mais. Delivery rápido e saboroso.',
    images: [{ url: 'https://sushiworld.pt/images/og-image.jpg' }],
    url: 'https://sushiworld.pt',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SushiWorld: Sushi Delivery em Santa Iria | Peça Online',
    description: 'Peça o melhor sushi de Santa Iria no SushiWorld. Combinados, hots, sashimi e muito mais.',
    images: ['https://sushiworld.pt/images/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://sushiworld.pt',
  },
};

// Buscar produtos em destaque - DIRETO DO PRISMA (Server Component)
async function getFeaturedProducts() {
  try {
    console.log('[getFeaturedProducts] Buscando DIRETO do Prisma');

    const products = await prisma.product.findMany({
      where: {
        featuredOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { featuredOrder: 'asc' },
      take: 3,
    });

    console.log('🔥 PRISMA FEATURED:', products.length, 'produtos');
    if (products.length > 0) {
      console.log('Produtos:', products.map(p => ({ name: p.name, order: p.featuredOrder })));
    }

    // Mapear para o formato esperado pelo ProductSection
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: `€${product.price.toFixed(2)}`,
      discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
      category: product.category,
      image: product.imageUrl,
      status: 'AVAILABLE' as const,
      outOfStock: false,
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar produtos em destaque:', error);
    return [];
  }
}

// Buscar mais vendidos - DIRETO DO PRISMA (Server Component)
async function getBestSellerProducts() {
  try {
    console.log('[getBestSellerProducts] Buscando DIRETO do Prisma');

    const products = await prisma.product.findMany({
      where: {
        bestSellerOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { bestSellerOrder: 'asc' },
      take: 3,
    });

    console.log('🔥 PRISMA BEST SELLERS:', products.length, 'produtos');
    if (products.length > 0) {
      console.log('Produtos:', products.map(p => ({ name: p.name, order: p.bestSellerOrder })));
    }

    // Mapear para o formato esperado pelo ProductSection
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: `€${product.price.toFixed(2)}`,
      discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
      category: product.category,
      image: product.imageUrl,
      status: 'AVAILABLE' as const,
      outOfStock: false,
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar produtos mais vendidos:', error);
    return [];
  }
}

export default async function HomePage() {
  const maisVendidos = await getBestSellerProducts();
  const destaques = await getFeaturedProducts();

  // TESTE ATÔMICO - CONFIRMAR QUE ESTA É A HOME REAL
  console.log('🔥🔥🔥 HOMEPAGE EXECUTADA - maisVendidos:', maisVendidos.length, 'destaques:', destaques.length);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      {/* TESTE NUCLEAR - DEVE APARECER NO TOPO */}
      <div style={{ background: 'black', color: 'lime', padding: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', zIndex: 9999, position: 'relative' }}>
        🔥 HOME CORRETA CARREGADA - DESTAQUES: {destaques.length} | MAIS VENDIDOS: {maisVendidos.length}
      </div>

      <div className="flex-1">
        <HeroBanner />

        {/* Aviso sobre Alergias */}
        <div className="w-full bg-[#f5f1e9] dark:bg-[#23170f] py-4 px-4">
          <p className="text-[#FF6B00] text-center text-xs md:text-sm font-medium max-w-4xl mx-auto">
            Alergias alimentares ou necessidades dietéticas especiais: Antes de realizar o seu pedido, por favor contate diretamente o restaurante.
          </p>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
          <SidebarMenu />

          <main className="flex-1 py-8">
            {/* TESTE NUCLEAR - DEBUG VISUAL */}
            {destaques.length > 0 && (
              <div style={{ backgroundColor: 'red', color: 'white', padding: '20px', marginBottom: '20px' }}>
                <h3>🔥 DEBUG DESTAQUES - DADOS RECEBIDOS:</h3>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(destaques, null, 2)}
                </pre>
              </div>
            )}
            {maisVendidos.length > 0 && (
              <div style={{ backgroundColor: 'blue', color: 'white', padding: '20px', marginBottom: '20px' }}>
                <h3>🔥 DEBUG MAIS VENDIDOS - DADOS RECEBIDOS:</h3>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(maisVendidos, null, 2)}
                </pre>
              </div>
            )}

            <section id="mais-vendidos">
              <h2 className="text-[#FF6B00] text-2xl font-bold tracking-tight pb-6">Mais Vendidos</h2>
              <ProductSection products={maisVendidos} />
            </section>

            <section className="mt-12" id="destaques">
              <h2 className="text-[#FF6B00] text-2xl font-bold tracking-tight pb-6">Destaques</h2>
              <ProductSection products={destaques} />
            </section>

            <DeliveryNotice />
          </main>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'SushiWorld',
            description: 'O melhor sushi delivery em Santa Iria',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Santa Iria',
              addressCountry: 'PT',
            },
            telephone: '+351 934 841 148',
            email: 'pedidosushiworld@gmail.com',
            url: 'https://sushiworld.pt',
            servesCuisine: 'Japanese',
            priceRange: '€€',
          }),
        }}
      />
    </div>
  );
}
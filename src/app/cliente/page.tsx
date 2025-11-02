import { Metadata } from 'next';
import HeroBanner from '@/components/cliente/HeroBanner';
import FloatingMenuNav from '@/components/cliente/FloatingMenuNav';
import ProductSection from '@/components/cliente/ProductSection';
import DeliveryNotice from '@/components/cliente/DeliveryNotice';
import { categories } from '@/lib/products';

export const metadata: Metadata = {
  title: 'SushiWorld: Sushi Delivery em Santa Iria | Peça Online',
  description: 'Peça o melhor sushi de Santa Iria no SushiWorld. Combinados, hots, sashimi e muito mais. Delivery rápido e saboroso. Confira nosso cardápio!',
  keywords: 'sushi, delivery, santa iria, cardápio, peça online, comida japonesa',
  openGraph: {
    title: 'SushiWorld: Sushi Delivery em Santa Iria | Peça Online',
    description: 'Peça o melhor sushi de Santa Iria no SushiWorld. Combinados, hots, sashimi e muito mais. Delivery rápido e saboroso.',
    images: [{ url: 'https://sushiworld.pt/images/og-image.jpg' }], // Substitua por uma imagem real
    url: 'https://sushiworld.pt',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SushiWorld: Sushi Delivery em Santa Iria | Peça Online',
    description: 'Peça o melhor sushi de Santa Iria no SushiWorld. Combinados, hots, sashimi e muito mais.',
    images: ['https://sushiworld.pt/images/twitter-image.jpg'], // Substitua por uma imagem real
  },
  alternates: {
    canonical: 'https://sushiworld.pt',
  },
};

async function getTopProducts() {
  // Simular busca de produtos mais vendidos
  // Em produção, isso seria uma chamada para /api/produtos?top=9
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/produtos?top=9`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    // Fallback para produtos locais se a API não estiver disponível
    const { products } = await import('@/lib/products');
    return products.slice(0, 9);
  }

  return response.json();
}

async function getHighlights() {
  // Simular busca de destaques aleatórios
  // Em produção, isso seria uma chamada para /api/produtos?highlights=6
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/produtos?highlights=6`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    // Fallback para produtos locais se a API não estiver disponível
    const { getRandomProducts } = await import('@/lib/products');
    return getRandomProducts(6);
  }

  return response.json();
}

export default async function HomePage() {
  const [topProducts, highlights] = await Promise.all([
    getTopProducts(),
    getHighlights(),
  ]);

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      {/* Header seria incluído via layout */}
      <div className="flex-1">
        <HeroBanner />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
          <FloatingMenuNav categories={categories} />

          <main className="flex-1 py-8">
            <ProductSection title="Mais Vendidos" products={topProducts} />

            <div className="mt-12">
              <ProductSection title="Destaques" products={highlights} />
            </div>

            <DeliveryNotice />
          </main>
        </div>
      </div>

      {/* Footer seria incluído via layout */}

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
            telephone: '+351 XXX XXX XXX', // Substitua pelo telefone real
            email: 'info@sushiworld.pt', // Substitua pelo email real
            url: 'https://sushiworld.pt',
            servesCuisine: 'Japanese',
            priceRange: '€€',
          }),
        }}
      />
    </div>
  );
}
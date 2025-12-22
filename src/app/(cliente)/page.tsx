import { Metadata } from 'next';
import HeroBanner from '@/components/cliente/HeroBanner';
import SidebarMenu from '@/components/cliente/SidebarMenu';
import ProductSection from '@/components/cliente/ProductSection';
import DeliveryNotice from '@/components/cliente/DeliveryNotice';

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

// Buscar produtos em destaque e mais vendidos
async function getFeaturedProducts() {
  try {
    // Em produção, usar URL absoluta; em dev, usar relativa
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products/featured`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const products = await response.json();
    // Mapear para o formato esperado pelo ProductSection
    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: `€${product.price.toFixed(2)}`,
      discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
      image: product.imageUrl,
      status: 'AVAILABLE' as const,
      outOfStock: false,
    }));
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    return [];
  }
}

async function getBestSellerProducts() {
  try {
    // Em produção, usar URL absoluta; em dev, usar relativa
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products/best-sellers`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const products = await response.json();
    // Mapear para o formato esperado pelo ProductSection
    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: `€${product.price.toFixed(2)}`,
      discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
      image: product.imageUrl,
      status: 'AVAILABLE' as const,
      outOfStock: false,
    }));
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    return [];
  }
}

export default async function HomePage() {
  const maisVendidos = await getBestSellerProducts();
  const destaques = await getFeaturedProducts();
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
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
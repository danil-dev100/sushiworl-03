import { Metadata } from 'next';
import HeroBanner from '@/components/cliente/HeroBanner';
import SidebarMenu from '@/components/cliente/SidebarMenu';
import ProductSection from '@/components/cliente/ProductSection';
import DeliveryNotice from '@/components/cliente/DeliveryNotice';
import { prisma } from '@/lib/db';

// ISR: revalida a cada 5 minutos (reduz invocações no Vercel free plan)
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'SushiWorld Santa Iria | Sushi Delivery - Peça Online',
  description:
    'Peça o melhor sushi de Santa Iria da Azóia no SushiWorld. Combinados, hots, sashimi, temakis e muito mais. Delivery rápido e saboroso direto à sua porta!',
  keywords:
    'sushi delivery santa iria, sushi santa iria de azóia, comida japonesa santa iria, sushiworld, pedir sushi online, delivery sushi lisboa, sushi fresco, combinados sushi',
  openGraph: {
    title: 'SushiWorld Santa Iria | Sushi Delivery - Peça Online',
    description:
      'Peça o melhor sushi de Santa Iria da Azóia no SushiWorld. Combinados, hots, sashimi e muito mais. Delivery rápido e saboroso.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SushiWorld - Sushi Delivery em Santa Iria da Azóia',
      },
    ],
    url: 'https://sushiworld.pt',
    type: 'website',
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SushiWorld Santa Iria | Sushi Delivery',
    description:
      'Peça o melhor sushi de Santa Iria no SushiWorld. Combinados, hots, sashimi e muito mais.',
    images: ['/images/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://sushiworld.pt',
  },
};

// Buscar produtos em destaque - DIRETO DO PRISMA (Server Component)
async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        featuredOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { featuredOrder: 'asc' },
      take: 3,
    });

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
    console.error('Erro ao buscar produtos em destaque:', error);
    return [];
  }
}

// Buscar mais vendidos - DIRETO DO PRISMA (Server Component)
async function getBestSellerProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        bestSellerOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { bestSellerOrder: 'asc' },
      take: 3,
    });

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

      {/* Structured Data - Restaurant (Google Rich Results) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            '@id': 'https://sushiworld.pt/#restaurant',
            name: 'SushiWorld Santa Iria',
            description:
              'O melhor sushi delivery em Santa Iria da Azóia. Sushi fresco, combinados, hots, sashimi e muito mais com entrega rápida.',
            image: 'https://sushiworld.pt/images/og-image.jpg',
            logo: 'https://sushiworld.pt/logo.webp/logo-nova-sushiworl-santa-iria-sem-fundo.webp',
            url: 'https://sushiworld.pt',
            telephone: '+351932722005',
            email: 'pedidosushiworld@gmail.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Santa Iria da Azóia',
              addressLocality: 'Santa Iria da Azóia',
              addressRegion: 'Lisboa',
              postalCode: '2690',
              addressCountry: 'PT',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 38.8481,
              longitude: -9.0886,
            },
            servesCuisine: ['Japonesa', 'Sushi', 'Comida Japonesa'],
            priceRange: '€€',
            currenciesAccepted: 'EUR',
            paymentAccepted: 'Cartão de Crédito, Cartão de Débito, MB Way',
            acceptsReservations: false,
            hasMenu: 'https://sushiworld.pt/cardapio',
            menu: 'https://sushiworld.pt/cardapio',
            areaServed: {
              '@type': 'City',
              name: 'Santa Iria da Azóia',
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ],
                opens: '11:30',
                closes: '22:00',
              },
            ],
            sameAs: [
              'https://www.instagram.com/sushiworld_santairia/',
              'https://www.facebook.com/sushiworldsantairia',
            ],
            potentialAction: {
              '@type': 'OrderAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://sushiworld.pt/cardapio',
                actionPlatform: [
                  'http://schema.org/DesktopWebPlatform',
                  'http://schema.org/MobileWebPlatform',
                ],
              },
              deliveryMethod:
                'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet',
            },
          }),
        }}
      />
    </div>
  );
}
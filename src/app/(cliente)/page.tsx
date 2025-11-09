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

// Dados mockados - TODO: buscar do banco de dados
const maisVendidos = [
  {
    id: 1,
    name: 'Sushi Combo 1',
    description: '24 peças variadas do chef.',
    price: '€15.99',
    discountPrice: '€18.00',
    category: 'Combinados',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1Vbc1_aFilwql5BEeye-NmVdDTFHSuKBkcJ8qRKVVovRKeE3TAzPojj9k6oAOphnL9HPRKAVXk7yP2dy80Si-Id-wwUjKqSDl7aZlQem4wYXUNVFWh_Y1ShXBZBUnPfFLNotjcPor4LzHRufQXVJI33XCub9SSVEYUtbtt2In5HihnIhzvwBfrRtCpKSGZgCyN-E6CPY2yCFcrhtUsrbZ3ugFLBeAXXu9J2bzVbJtTwNLFy7BiKuWF7_lj0tFh0-bQ0OId8ClKMQ',
  },
  {
    id: 2,
    name: 'Hot Roll Philadelphia',
    description: 'Roll crocante com salmão e cream cheese.',
    price: '€8.50',
    discountPrice: '€10.00',
    category: 'Hots',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0zU5rE3-oDs7eJ4UrenQB7fnShbz71IaYZoxW1og3ijsyb-yOBoDE5HKZr41XbrgcH7Xjp44Jp2N_5UKK-_AbOPhMdatzXELjnoWj40XsgR_J88WeOEQefiCa05-nD1pZHfrfoL1kYhuKXrkjEBJL35nz6IcNJjmtOsb8Fxl7576LFDjavtjdjZlXlX3qZa5uzfDO-j28KzE26uwJnSz-VPvutLCODgwAe3PgyxnaGCEdSrgAZNCjI5wRa5LO--jCmRPBFg-ydTU',
  },
  {
    id: 3,
    name: 'Sashimi de Salmão',
    description: '5 fatias frescas de salmão premium.',
    price: '€12.00',
    category: 'Sashimi',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi59EEAk3QK0uJOiAnu1AOMwbcQQO-wPAfVzVC1SANyf0-WD79XMWgBBnJSfsM3SVg_NthkTQqFmKWmQ2U7GK_WXzJ_btgvo-7j2GU4wOERN3bnFP3VQblZsG6TSKlIWMFYXjsnXjG2KdwVQLobkGMqbt24QHpp96eKBO37lM5TOatnlu-fxF3qEJNpzjZOYEGncmvOEhUAxOJ-QxS79aAabVN0bY2Y82EVOmsz3GYYKDLwHlQ3YtKFBFNP2mu-3b1a8u_J8W7HpU',
  },
];

const destaques = [
  {
    id: 4,
    name: 'Ebiten Roll',
    description: 'Roll de camarão panado e abacate.',
    price: '€9.50',
    category: 'Makis',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzvRmfMtBWCPOeM5IOxqLaz_LNDniKlpae-QjdlQCAmF3LvllLNuZLIErk6_U-PdXnmSshN_Qz8vqfnWSp-ZSuFufjLrkxCbrzQNGMiKKWUBtmZTJR49jIPKyQG5C6YbtDjyMuY83qh_uiX1UHhVf69TiqNzXW6ZOg1OVRMJP9i_vz-hx8LanltZ3JuSuuULchmqWeeCUlqv5OMo1u5TaamQBF_cbYgJBddURimmiuDjjaeGdGAh6XQwBIguRqH8zxOKa1O7QR-Fk',
  },
  {
    id: 5,
    name: 'Uramaki Especial da Casa',
    description: 'Criação do chef com peixe branco e molho especial.',
    price: '€13.00',
    discountPrice: '€15.00',
    category: 'Makis',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQrGLmRYLCS48mw9osKHQY8cRJqX_Viua_yO1j3lpFFb87CXS-4B_3k0echZiFjRVEqvgOtovXl438-AIBgFEOJCmKGy_zYpQp8WQRzHoFEZglG5ZQM-z-FUxdJ45d8C1D_q821k46DJ1UR7jqbPBXGySW4zmn8tMrMX_mwuJbaPHIhtgzPezAEqDR5MNq6xs-a6pX7_qX-LQSQr5DnbsZYu7J0XqEdVp_8_cH6hKvb5gh7Krj-M4umtQygY6CdP1L2qZfXiKdOQ',
  },
  {
    id: 6,
    name: 'Spicy Tuna',
    description: 'Roll picante com atum e cebolinho.',
    price: '€8.00',
    category: 'Makis',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNzMX6lMna6nX8TjJy5jY_Kv-JczpymR3HD2gGTMwfjEinIlR9ziFO_zQV8AKcSbYx7BEsgrBWBOob-nNOaeEvjrEm8TeNmtAA6oPavzl-eLCGbkwcG_4lWfdccNsy0jWWql6Dj1lU-q9Jxwc2RN0B4GkYX93CFfR-YK7uWhLBAASkyFwY5K3FR_0bx5w_AcA95n3eywQvECREh3WvaQEj1-KUh7BC_f8z0zde_LUz5k83DP9ryssaU6GFpGrZLUcnYnhKfENfyDc',
  },
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="flex-1">
        <HeroBanner />

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
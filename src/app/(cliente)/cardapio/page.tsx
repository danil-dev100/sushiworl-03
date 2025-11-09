import { Metadata } from 'next';
import SidebarMenu from '@/components/cliente/SidebarMenu';
import ProductSection from '@/components/cliente/ProductSection';

export const metadata: Metadata = {
  title: 'Cardápio - SushiWorld | Delivery em Santa Iria',
  description: 'Confira nosso cardápio completo com combinados, hots, sashimi, nigiri e muito mais. Peça online!',
};

// TODO: Buscar produtos do banco de dados
const produtosPorCategoria = {
  destaques: [
    {
      id: 1,
      name: 'Ebiten Roll',
      description: 'Roll de camarão panado e abacate.',
      price: '€9.50',
      category: 'Makis',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzvRmfMtBWCPOeM5IOxqLaz_LNDniKlpae-QjdlQCAmF3LvllLNuZLIErk6_U-PdXnmSshN_Qz8vqfnWSp-ZSuFufjLrkxCbrzQNGMiKKWUBtmZTJR49jIPKyQG5C6YbtDjyMuY83qh_uiX1UHhVf69TiqNzXW6ZOg1OVRMJP9i_vz-hx8LanltZ3JuSuuULchmqWeeCUlqv5OMo1u5TaamQBF_cbYgJBddURimmiuDjjaeGdGAh6XQwBIguRqH8zxOKa1O7QR-Fk',
    },
    {
      id: 2,
      name: 'Uramaki Especial da Casa',
      description: 'Criação do chef com peixe branco e molho especial.',
      price: '€13.00',
      discountPrice: '€15.00',
      category: 'Makis',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQrGLmRYLCS48mw9osKHQY8cRJqX_Viua_yO1j3lpFFb87CXS-4B_3k0echZiFjRVEqvgOtovXl438-AIBgFEOJCmKGy_zYpQp8WQRzHoFEZglG5ZQM-z-FUxdJ45d8C1D_q821k46DJ1UR7jqbPBXGySW4zmn8tMrMX_mwuJbaPHIhtgzPezAEqDR5MNq6xs-a6pX7_qX-LQSQr5DnbsZYu7J0XqEdVp_8_cH6hKvb5gh7Krj-M4umtQygY6CdP1L2qZfXiKdOQ',
    },
    {
      id: 3,
      name: 'Spicy Tuna',
      description: 'Roll picante com atum e cebolinho.',
      price: '€8.00',
      category: 'Makis',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNzMX6lMna6nX8TjJy5jY_Kv-JczpymR3HD2gGTMwfjEinIlR9ziFO_zQV8AKcSbYx7BEsgrBWBOob-nNOaeEvjrEm8TeNmtAA6oPavzl-eLCGbkwcG_4lWfdccNsy0jWWql6Dj1lU-q9Jxwc2RN0B4GkYX93CFfR-YK7uWhLBAASkyFwY5K3FR_0bx5w_AcA95n3eywQvECREh3WvaQEj1-KUh7BC_f8z0zde_LUz5k83DP9ryssaU6GFpGrZLUcnYnhKfENfyDc',
    },
  ],
  combinados: [
    {
      id: 4,
      name: 'Sushi Combo 1',
      description: '24 peças variadas do chef.',
      price: '€15.99',
      discountPrice: '€18.00',
      category: 'Combinados',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1Vbc1_aFilwql5BEeye-NmVdDTFHSuKBkcJ8qRKVVovRKeE3TAzPojj9k6oAOphnL9HPRKAVXk7yP2dy80Si-Id-wwUjKqSDl7aZlQem4wYXUNVFWh_Y1ShXBZBUnPfFLNotjcPor4LzHRufQXVJI33XCub9SSVEYUtbtt2In5HihnIhzvwBfrRtCpKSGZgCyN-E6CPY2yCFcrhtUsrbZ3ugFLBeAXXu9J2bzVbJtTwNLFy7BiKuWF7_lj0tFh0-bQ0OId8ClKMQ',
    },
  ],
};

export default function CardapioPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        <SidebarMenu activeSection="destaques" />

        <main className="flex-1 py-8">
          <section id="destaques">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">⭐ DESTAQUES</h2>
            <ProductSection products={produtosPorCategoria.destaques} />
          </section>

          <section className="mt-12" id="combinados">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🍣 COMBINADOS</h2>
            <ProductSection products={produtosPorCategoria.combinados} />
          </section>

          <section className="mt-12" id="hots">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🔥 HOTS</h2>
            <ProductSection products={[]} />
          </section>

          <section className="mt-12" id="entradas">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🍤 ENTRADAS</h2>
            <ProductSection products={[]} />
          </section>

          <section className="mt-12" id="poke">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🥗 POKÉ BOWL</h2>
            <ProductSection products={[]} />
          </section>

          <section className="mt-12" id="gunkan">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🍥 GUNKAN</h2>
            <ProductSection products={[]} />
          </section>

          <section className="mt-12" id="sashimi">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🐟 SASHIMI</h2>
            <ProductSection products={[]} />
          </section>

          <section className="mt-12" id="nigiri">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🍙 NIGIRI</h2>
            <ProductSection products={[]} />
          </section>

          <section className="mt-12" id="makis">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🥢 MAKIS</h2>
            <ProductSection products={[]} />
          </section>

          <section className="mt-12" id="temaki">
            <h2 className="text-[#FF6B00] text-3xl font-bold tracking-tight pb-6">🍦 TEMAKI</h2>
            <ProductSection products={[]} />
          </section>
        </main>
      </div>
    </div>
  );
}


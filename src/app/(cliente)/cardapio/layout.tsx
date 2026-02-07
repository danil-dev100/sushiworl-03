import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cardápio - Sushi Delivery em Santa Iria da Azóia',
  description:
    'Veja o cardápio completo do SushiWorld. Combinados, hots, sashimi, temakis, pratos quentes e muito mais. Peça online com entrega rápida em Santa Iria da Azóia.',
  keywords:
    'cardápio sushi santa iria, menu sushi delivery, combinados sushi, hots roll, sashimi fresco, comida japonesa santa iria',
  openGraph: {
    title: 'Cardápio SushiWorld - Sushi Delivery Santa Iria',
    description:
      'Combinados, hots, sashimi, temakis e muito mais. Peça online com entrega rápida.',
    url: 'https://sushiworld.pt/cardapio',
    type: 'website',
  },
  alternates: {
    canonical: 'https://sushiworld.pt/cardapio',
  },
};

export default function CardapioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

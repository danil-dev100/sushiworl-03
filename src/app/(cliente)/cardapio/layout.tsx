import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cardápio - Sushi Delivery em Santa Iria da Azóia',
  description:
    'Veja o cardápio completo do SushiWorld. Combinados, hots, sashimi, temakis, pratos quentes e muito mais. Encomende online com entrega ao domicílio em Santa Iria da Azóia.',
  keywords:
    'cardápio sushi santa iria, menu comida japonesa, combinados sushi, hots roll, sashimi fresco, restaurante japonês santa iria, encomendar sushi online',
  openGraph: {
    title: 'Cardápio SushiWorld - Sushi Delivery Santa Iria',
    description:
      'Combinados, hots, sashimi, temakis e muito mais. Encomende online com entrega ao domicílio.',
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

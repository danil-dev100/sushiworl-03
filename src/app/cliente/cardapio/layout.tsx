import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cardápio | SushiWorld Delivery Portugal',
  description: 'Explore nosso cardápio completo de sushi, sashimi, temaki, poke e muito mais. Entrega rápida em Portugal.',
  keywords: ['sushi', 'cardápio', 'delivery', 'portugal', 'sashimi', 'temaki', 'poke'],
  openGraph: {
    title: 'Cardápio Completo - SushiWorld',
    description: 'Os melhores sushis frescos com entrega rápida',
    images: ['/banner-site-novo-sushiword.webp'],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cardápio SushiWorld',
    description: 'Explore nosso cardápio completo',
    images: ['/banner-site-novo-sushiword.webp'],
  },
};

export default function CardapioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
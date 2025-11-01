import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, ChefHat, Gift } from 'lucide-react';
import { Metadata } from 'next';
import HomeClient from '@/components/cliente/HomeClient';

export const metadata: Metadata = {
  title: 'SushiWorld Delivery - Sushi Fresco em Santa Iria 🍣',
  description: 'Sushi fresco, rápido e delicioso entregue na sua casa. Peça online nossas combinações, pokes, temakis e muito mais. Entrega rápida em Santa Iria.',
  keywords: 'sushi, delivery, sushi portugal, sushi lisboa, sushi santa iria, combinado sushi, sushi world, poke bowl, temaki',
  openGraph: {
    title: 'SushiWorld Delivery - Sushi Fresco Online 🍣',
    description: 'O melhor sushi de Portugal entregue na sua casa. Ingredientes frescos e entrega rápida.',
    url: 'https://sushiworld.pt',
    siteName: 'SushiWorld Delivery',
    images: [
      {
        url: '/banner-site-novo-sushiword.webp',
        width: 1200,
        height: 630,
        alt: 'SushiWorld - Sushi Fresco e Delicioso',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SushiWorld Delivery - Sushi Fresco Online 🍣',
    description: 'O melhor sushi de Portugal entregue na sua casa.',
    images: ['/banner-site-novo-sushiword.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://sushiworld.pt',
  },
};

export default function Home() {
  return <HomeClient />;
}
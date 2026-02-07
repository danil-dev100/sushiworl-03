import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/', '/carrinho/', '/login/', '/obrigado/', '/pedido-recusado/'],
      },
    ],
    sitemap: 'https://sushiworld.pt/sitemap.xml',
  };
}

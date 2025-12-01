import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { CardapioContent } from '@/components/cliente/CardapioContent';

export const metadata: Metadata = {
  title: 'Cardápio - SushiWorld | Delivery em Santa Iria',
  description: 'Confira nosso cardápio completo com combinados, hots, sashimi, nigiri e muito mais. Peça online!',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        discountPrice: true,
        category: true,
        imageUrl: true,
        status: true,
        outOfStock: true,
        isHot: true,
        isHalal: true,
        isVegan: true,
        isVegetarian: true,
        isDairyFree: true,
        isRaw: true,
        isGlutenFree: true,
        isNutFree: true,
        isFeatured: true,
        isTopSeller: true,
      },
    });

    // Agrupar produtos por categoria
    const produtosPorCategoria: Record<string, any[]> = {};
    
    products.forEach((product) => {
      const categoryKey = product.category.toLowerCase().replace(/\s+/g, '-');
      if (!produtosPorCategoria[categoryKey]) {
        produtosPorCategoria[categoryKey] = [];
      }
      
      produtosPorCategoria[categoryKey].push({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: `€${product.price.toFixed(2)}`,
        discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
        category: product.category,
        image: product.imageUrl,
        status: product.status,
        outOfStock: product.outOfStock,
        isHot: product.isHot,
        isHalal: product.isHalal,
        isVegan: product.isVegan,
        isVegetarian: product.isVegetarian,
        isDairyFree: product.isDairyFree,
        isRaw: product.isRaw,
        isGlutenFree: product.isGlutenFree,
        isNutFree: product.isNutFree,
      });
    });

    // Adicionar produtos em destaque
    produtosPorCategoria['destaques'] = products
      .filter(p => p.isFeatured)
      .map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: `€${product.price.toFixed(2)}`,
        discountPrice: product.discountPrice ? `€${product.discountPrice.toFixed(2)}` : undefined,
        category: product.category,
        image: product.imageUrl,
        status: product.status,
        outOfStock: product.outOfStock,
      }));

    return produtosPorCategoria;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return {};
  }
}

export default async function CardapioPage() {
  const produtosPorCategoria = await getProducts();
  return <CardapioContent produtosPorCategoria={produtosPorCategoria} />;
}


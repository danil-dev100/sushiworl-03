import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { MenuPageContent } from '@/components/admin/menu/MenuPageContent';

export const metadata: Metadata = {
  title: 'Gestão de Cardápio | Admin - SushiWorld',
  description: 'Gerencie o cardápio do restaurante',
};

async function getMenuData() {
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          productOptions: {
            include: {
              choices: true,
            },
          },
        },
      }),
      // Buscar categorias únicas dos produtos
      prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
    ]);

    const uniqueCategories = categories.map((c) => c.category);

    return { products, categories: uniqueCategories };
  } catch (error) {
    console.error('[Menu] Erro ao carregar dados:', error);
    return { products: [], categories: [] };
  }
}

export default async function MenuPage() {
  const { products, categories } = await getMenuData();

  return <MenuPageContent initialProducts={products} categories={categories} />;
}


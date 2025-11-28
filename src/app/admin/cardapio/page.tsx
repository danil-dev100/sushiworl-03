import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { MenuPageContent } from '@/components/admin/menu/MenuPageContent';

export const metadata: Metadata = {
  title: 'Gestão de Cardápio | Admin - SushiWorld',
  description: 'Gerencie o cardápio do restaurante',
};

// Forçar revalidação a cada request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getMenuData() {
  try {
    console.log('[Menu Page] Buscando produtos...');

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        // TEMPORÁRIO: Remover productOptions até sincronizar schema
        // include: {
        //   productOptions: {
        //     include: {
        //       choices: true,
        //     },
        //   },
        // },
      }),
      // Buscar categorias únicas dos produtos
      prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
    ]);

    const uniqueCategories = categories.map((c) => c.category);

    console.log('[Menu Page] Produtos encontrados:', products.length);
    console.log('[Menu Page] Categorias:', uniqueCategories);

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


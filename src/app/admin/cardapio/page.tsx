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

    const [products, dbCategories, productCategories] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      // Buscar todas as categorias da tabela (incluindo vazias) - ADMIN VÊ TODAS
      prisma.category.findMany({
        orderBy: { order: 'asc' },
      }),
      // Buscar categorias dos produtos (para incluir antigas que não estão na tabela)
      prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
    ]);

    // Combinar categorias da tabela + categorias antigas dos produtos
    const dbCategoryNames = dbCategories.map(c => c.name);
    const oldCategories = productCategories
      .map(c => c.category)
      .filter(cat => !dbCategoryNames.includes(cat));

    const allCategories = [...dbCategoryNames, ...oldCategories];

    console.log('[Menu Page] Produtos encontrados:', products.length);
    console.log('[Menu Page] Categorias (incluindo vazias):', allCategories);

    return { products, categories: allCategories };
  } catch (error) {
    console.error('[Menu] Erro ao carregar dados:', error);
    return { products: [], categories: [] };
  }
}

export default async function MenuPage() {
  const { products, categories } = await getMenuData();

  return <MenuPageContent initialProducts={products} categories={categories} />;
}


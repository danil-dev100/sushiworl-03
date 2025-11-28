const { PrismaClient } = require('@prisma/client');

async function testAPI() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Testando API de produtos...');

    // Simular a mesma query da API
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        productOptions: {
          include: {
            choices: true,
          },
        },
      },
    });

    console.log(`✅ API retornaria: ${products.length} produtos`);

    if (products.length > 0) {
      console.log('📦 Primeiro produto:', {
        id: products[0].id,
        name: products[0].name,
        category: products[0].category,
        price: products[0].price,
        isVisible: products[0].isVisible,
      });
    }

    // Testar apenas produtos visíveis
    const visibleProducts = products.filter(p => p.isVisible);
    console.log(`👁️  Produtos visíveis: ${visibleProducts.length}`);

    // Testar busca de categorias
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    console.log(`🏷️  Categorias encontradas: ${categories.length}`);
    console.log('📋 Categorias:', categories.map(c => c.category));

  } catch (error) {
    console.error('❌ Erro na API:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();

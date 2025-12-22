import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  step: string;
  status: 'SUCCESS' | 'FAIL' | 'WARNING';
  message: string;
  data?: any;
}

async function verifyFeaturedProducts() {
  const results: CheckResult[] = [];

  console.log('\n🔍 VERIFICAÇÃO AUTOMÁTICA - PRODUTOS EM DESTAQUE E MAIS VENDIDOS\n');
  console.log('='.repeat(80));

  // 1️⃣ Verificar produtos com featuredOrder no banco
  try {
    const featuredProducts = await prisma.product.findMany({
      where: {
        featuredOrder: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        featuredOrder: true,
        isVisible: true,
        status: true,
      },
      orderBy: { featuredOrder: 'asc' },
    });

    if (featuredProducts.length > 0) {
      results.push({
        step: '1. Produtos com featuredOrder no banco',
        status: 'SUCCESS',
        message: `${featuredProducts.length} produto(s) encontrado(s)`,
        data: featuredProducts.map(p => ({
          name: p.name,
          order: p.featuredOrder,
          type: typeof p.featuredOrder,
          isVisible: p.isVisible,
          status: p.status,
        })),
      });
    } else {
      results.push({
        step: '1. Produtos com featuredOrder no banco',
        status: 'WARNING',
        message: 'Nenhum produto com featuredOrder > 0 encontrado',
      });
    }
  } catch (error) {
    results.push({
      step: '1. Produtos com featuredOrder no banco',
      status: 'FAIL',
      message: `Erro: ${error}`,
    });
  }

  // 2️⃣ Verificar produtos com bestSellerOrder no banco
  try {
    const bestSellerProducts = await prisma.product.findMany({
      where: {
        bestSellerOrder: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        bestSellerOrder: true,
        isVisible: true,
        status: true,
      },
      orderBy: { bestSellerOrder: 'asc' },
    });

    if (bestSellerProducts.length > 0) {
      results.push({
        step: '2. Produtos com bestSellerOrder no banco',
        status: 'SUCCESS',
        message: `${bestSellerProducts.length} produto(s) encontrado(s)`,
        data: bestSellerProducts.map(p => ({
          name: p.name,
          order: p.bestSellerOrder,
          type: typeof p.bestSellerOrder,
          isVisible: p.isVisible,
          status: p.status,
        })),
      });
    } else {
      results.push({
        step: '2. Produtos com bestSellerOrder no banco',
        status: 'WARNING',
        message: 'Nenhum produto com bestSellerOrder > 0 encontrado',
      });
    }
  } catch (error) {
    results.push({
      step: '2. Produtos com bestSellerOrder no banco',
      status: 'FAIL',
      message: `Erro: ${error}`,
    });
  }

  // 3️⃣ Verificar produtos visíveis e disponíveis para Featured
  try {
    const visibleFeatured = await prisma.product.findMany({
      where: {
        featuredOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { featuredOrder: 'asc' },
      take: 3,
    });

    if (visibleFeatured.length > 0) {
      results.push({
        step: '3. Produtos Featured visíveis e disponíveis (query da API)',
        status: 'SUCCESS',
        message: `${visibleFeatured.length} produto(s) que aparecerão na Home`,
        data: visibleFeatured.map(p => ({
          id: p.id,
          name: p.name,
          featuredOrder: p.featuredOrder,
        })),
      });
    } else {
      results.push({
        step: '3. Produtos Featured visíveis e disponíveis (query da API)',
        status: 'WARNING',
        message: 'Nenhum produto atende aos critérios: featuredOrder > 0, isVisible: true, status: AVAILABLE',
      });
    }
  } catch (error) {
    results.push({
      step: '3. Produtos Featured visíveis e disponíveis',
      status: 'FAIL',
      message: `Erro: ${error}`,
    });
  }

  // 4️⃣ Verificar produtos visíveis e disponíveis para Best Sellers
  try {
    const visibleBestSellers = await prisma.product.findMany({
      where: {
        bestSellerOrder: { gt: 0 },
        isVisible: true,
        status: 'AVAILABLE',
      },
      orderBy: { bestSellerOrder: 'asc' },
      take: 3,
    });

    if (visibleBestSellers.length > 0) {
      results.push({
        step: '4. Produtos Best Sellers visíveis e disponíveis (query da API)',
        status: 'SUCCESS',
        message: `${visibleBestSellers.length} produto(s) que aparecerão na Home`,
        data: visibleBestSellers.map(p => ({
          id: p.id,
          name: p.name,
          bestSellerOrder: p.bestSellerOrder,
        })),
      });
    } else {
      results.push({
        step: '4. Produtos Best Sellers visíveis e disponíveis (query da API)',
        status: 'WARNING',
        message: 'Nenhum produto atende aos critérios: bestSellerOrder > 0, isVisible: true, status: AVAILABLE',
      });
    }
  } catch (error) {
    results.push({
      step: '4. Produtos Best Sellers visíveis e disponíveis',
      status: 'FAIL',
      message: `Erro: ${error}`,
    });
  }

  // Exibir resultados
  console.log('\n');
  results.forEach((result, index) => {
    const icon = result.status === 'SUCCESS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log('   Dados:', JSON.stringify(result.data, null, 2));
    }
    if (index < results.length - 1) console.log('');
  });

  console.log('\n' + '='.repeat(80));

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  console.log(`\n📊 RESUMO: ${successCount} ✅ | ${warningCount} ⚠️ | ${failCount} ❌\n`);

  if (failCount > 0) {
    console.log('❌ FALHAS ENCONTRADAS - Verifique os erros acima');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('⚠️ AVISOS ENCONTRADOS - Produtos podem não aparecer na Home');
    console.log('💡 PRÓXIMO PASSO: Edite produtos no admin e defina posições (1-3)');
  } else {
    console.log('✅ TUDO OK - Produtos devem aparecer na Home!');
  }

  await prisma.$disconnect();
}

verifyFeaturedProducts().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

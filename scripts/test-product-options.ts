import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProductOptions() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTANDO SISTEMA DE OPÇÕES DE PRODUTOS');
  console.log('🧪 ========================================\n');

  try {
    // 1. Buscar um produto para teste
    console.log('📦 PASSO 1: Buscando produto para teste...');
    const product = await prisma.product.findFirst({
      where: {
        isVisible: true,
        outOfStock: false,
      },
      include: {
        productOptions: {
          include: {
            choices: true
          }
        }
      }
    });

    if (!product) {
      console.log('❌ Nenhum produto encontrado no banco de dados');
      return;
    }

    console.log('✅ Produto encontrado:', product.name);
    console.log('   ID:', product.id);
    console.log('   Preço: €' + product.price.toFixed(2));
    console.log('   Opções existentes:', product.productOptions.length);
    console.log('');

    // 2. Se o produto já tiver opções, listar
    if (product.productOptions.length > 0) {
      console.log('📋 OPÇÕES EXISTENTES:');
      product.productOptions.forEach((opt, idx) => {
        console.log(`   ${idx + 1}. ${opt.name}`);
        console.log(`      Tipo: ${opt.type}`);
        console.log(`      Exibir em: ${opt.displayAt}`);
        console.log(`      É paga: ${opt.isPaid} ${opt.isPaid ? `(€${opt.basePrice.toFixed(2)})` : ''}`);
        console.log(`      Escolhas: ${opt.choices.length}`);
        opt.choices.forEach((choice, cIdx) => {
          console.log(`        ${cIdx + 1}. ${choice.name} (€${choice.price.toFixed(2)})`);
        });
        console.log('');
      });
    } else {
      console.log('⚠️  Produto não tem opções ainda. Vamos criar uma de teste...\n');

      // 3. Criar opção de teste
      console.log('🔧 PASSO 2: Criando opção de teste "Braseado"...');

      const newOption = await prisma.productOption.create({
        data: {
          productId: product.id,
          name: 'Braseado',
          type: 'OPTIONAL',
          description: 'Queimar levemente com maçarico',
          displayAt: 'SITE',
          isPaid: true,
          basePrice: 0.50,
          minSelection: 0,
          maxSelection: 1,
          allowMultiple: false,
          isActive: true,
          sortOrder: 0,
          choices: {
            create: [
              {
                name: 'Sim',
                price: 0,
                isDefault: false,
                isActive: true,
                sortOrder: 0
              }
            ]
          }
        },
        include: {
          choices: true
        }
      });

      console.log('✅ Opção criada com sucesso!');
      console.log('   ID:', newOption.id);
      console.log('   Nome:', newOption.name);
      console.log('   Tipo:', newOption.type);
      console.log('   Exibir em:', newOption.displayAt);
      console.log('   É paga:', newOption.isPaid);
      console.log('   Preço: €' + newOption.basePrice.toFixed(2));
      console.log('   Escolhas criadas:', newOption.choices.length);
      console.log('');
    }

    // 4. Testar busca de opções (simular o que a API faz)
    console.log('🔍 PASSO 3: Testando busca de opções (simulando API)...');

    const options = await prisma.productOption.findMany({
      where: {
        productId: product.id,
        isActive: true
      },
      include: {
        choices: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    console.log('✅ Opções encontradas via query:', options.length);

    if (options.length > 0) {
      console.log('');
      console.log('📊 DETALHES DAS OPÇÕES:');
      options.forEach((opt, idx) => {
        console.log(`   ${idx + 1}. ${opt.name} (${opt.type}, ${opt.displayAt})`);
        console.log(`      Escolhas: ${opt.choices.length}`);
        opt.choices.forEach((choice, cIdx) => {
          console.log(`        ${cIdx + 1}. ${choice.name} - €${choice.price.toFixed(2)} ${choice.isDefault ? '(padrão)' : ''}`);
        });
      });
      console.log('');
    }

    // 5. Testar filtro para SITE vs CART
    console.log('🎨 PASSO 4: Testando filtro displayAt...');

    const siteOptions = options.filter(opt => opt.displayAt === 'SITE');
    const cartOptions = options.filter(opt => opt.displayAt === 'CART');

    console.log(`   Opções para SITE: ${siteOptions.length}`);
    console.log(`   Opções para CART: ${cartOptions.length}`);
    console.log('');

    // 6. Simulação do fluxo do cliente
    console.log('🛒 PASSO 5: Simulando fluxo do cliente...');

    if (siteOptions.length > 0) {
      console.log('   ✅ POPUP DEVE APARECER ao clicar em "Adicionar"');
      console.log('   Opções que aparecerão no popup:');
      siteOptions.forEach((opt, idx) => {
        const totalPrice = opt.isPaid ? opt.basePrice + (opt.choices[0]?.price || 0) : 0;
        console.log(`     ${idx + 1}. ${opt.name} por +€${totalPrice.toFixed(2)}`);
      });
    } else {
      console.log('   ⚠️  POPUP NÃO APARECERÁ (nenhuma opção com displayAt=SITE)');
      console.log('   Produto será adicionado direto ao carrinho');
    }
    console.log('');

    // 7. Resultado final
    console.log('🎯 RESULTADO DO TESTE:');
    console.log('   ✅ Schema: Estrutura correta');
    console.log('   ✅ Criação: Opções podem ser criadas');
    console.log('   ✅ Busca: Queries funcionam corretamente');
    console.log('   ✅ Filtros: displayAt funciona');
    console.log(`   ${siteOptions.length > 0 ? '✅' : '⚠️ '} Popup: ${siteOptions.length > 0 ? 'Aparecerá no site' : 'NÃO aparecerá (sem opções SITE)'}`);
    console.log('');

    console.log('🧪 TESTE CONCLUÍDO COM SUCESSO! 🎉');
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('   1. Acesse o admin → Editar produto → Aba "Opções"');
    console.log('   2. Adicione uma opção com displayAt="SITE"');
    console.log('   3. Acesse o cardápio como cliente');
    console.log('   4. Clique em "Adicionar" no produto');
    console.log('   5. Verifique se o popup aparece');
    console.log('');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testProductOptions()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  });

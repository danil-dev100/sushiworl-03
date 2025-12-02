import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOptionsStatus() {
  console.log('🔍 ========================================');
  console.log('🔍 VERIFICANDO STATUS DAS OPÇÕES');
  console.log('🔍 ========================================\n');

  try {
    // 1. Verificar se existem produtos
    const productsCount = await prisma.product.count();
    console.log('📦 Total de produtos:', productsCount);

    // 2. Verificar se existem opções
    const optionsCount = await prisma.productOption.count();
    console.log('⚙️  Total de opções criadas:', optionsCount);

    if (optionsCount === 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: Não há nenhuma opção criada no banco de dados!');
      console.log('📝 SOLUÇÃO: Acesse o admin → Produtos → Editar Produto → Aba "Opções" e crie uma opção');
      console.log('');
      await prisma.$disconnect();
      return;
    }

    // 3. Listar todas as opções
    console.log('\n📋 LISTANDO TODAS AS OPÇÕES:\n');

    const options = await prisma.productOption.findMany({
      include: {
        product: {
          select: {
            name: true,
            isVisible: true,
          }
        },
        choices: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    options.forEach((opt, idx) => {
      console.log(`\n${idx + 1}. Opção: ${opt.name}`);
      console.log(`   Produto: ${opt.product.name}`);
      console.log(`   Produto visível: ${opt.product.isVisible ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`   Tipo: ${opt.type}`);
      console.log(`   Exibir em: ${opt.displayAt} ${opt.displayAt === 'SITE' ? '✅' : '⚠️ (deveria ser SITE)'}`);
      console.log(`   Ativa: ${opt.isActive ? 'SIM ✅' : 'NÃO ❌'}`);

      // Verificar se tem os campos novos
      try {
        console.log(`   É paga: ${(opt as any).isPaid ? 'SIM' : 'NÃO'}`);
        console.log(`   Preço base: €${((opt as any).basePrice || 0).toFixed(2)}`);
      } catch (e) {
        console.log(`   ⚠️  Campos isPaid/basePrice ainda não existem no banco`);
      }

      console.log(`   Escolhas: ${opt.choices.length}`);

      if (opt.choices.length === 0) {
        console.log(`   ⚠️  PROBLEMA: Opção sem escolhas!`);
      } else {
        opt.choices.forEach((choice, cIdx) => {
          console.log(`      ${cIdx + 1}. ${choice.name} (€${choice.price.toFixed(2)}) ${choice.isActive ? '✅' : '❌'}`);
        });
      }
    });

    // 4. Verificar opções que aparecerão no SITE
    console.log('\n\n🎨 ========================================');
    console.log('🎨 OPÇÕES QUE APARECERÃO NO POPUP DO SITE');
    console.log('🎨 ========================================\n');

    const siteOptions = options.filter(opt =>
      opt.displayAt === 'SITE' &&
      opt.isActive === true &&
      opt.choices.length > 0 &&
      opt.product.isVisible === true
    );

    if (siteOptions.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhuma opção configurada para aparecer no SITE!\n');
      console.log('📝 POSSÍVEIS CAUSAS:');
      console.log('   1. displayAt está definido como "CART" ao invés de "SITE"');
      console.log('   2. isActive está false');
      console.log('   3. Opção não tem escolhas (choices)');
      console.log('   4. Produto não está visível');
      console.log('');
      console.log('📝 SOLUÇÃO: Edite a opção no admin e garanta que:');
      console.log('   ✓ "Exibir em" = SITE');
      console.log('   ✓ "Ativa" = true');
      console.log('   ✓ Tem pelo menos 1 escolha');
      console.log('   ✓ O produto está visível');
      console.log('');
    } else {
      console.log(`✅ ${siteOptions.length} opção(ões) configurada(s) corretamente:\n`);
      siteOptions.forEach((opt, idx) => {
        console.log(`   ${idx + 1}. ${opt.name} → Produto: ${opt.product.name}`);
      });
      console.log('');
      console.log('✅ O popup DEVE aparecer ao clicar em "Adicionar" nestes produtos!');
      console.log('');
    }

    // 5. Resumo e próximos passos
    console.log('\n📊 ========================================');
    console.log('📊 RESUMO DO DIAGNÓSTICO');
    console.log('📊 ========================================\n');

    console.log(`Total de opções: ${optionsCount}`);
    console.log(`Opções que aparecerão no SITE: ${siteOptions.length}`);
    console.log('');

    if (siteOptions.length > 0) {
      console.log('✅ SISTEMA CONFIGURADO CORRETAMENTE!');
      console.log('');
      console.log('📝 PRÓXIMOS PASSOS PARA TESTAR:');
      console.log('   1. Acesse o site como cliente');
      console.log('   2. Abra o console do navegador (F12)');
      console.log('   3. Clique em "Adicionar" em um produto que tem opção');
      console.log('   4. Verifique os logs detalhados no console');
      console.log('   5. O popup DEVE aparecer');
      console.log('');
    } else {
      console.log('❌ CONFIGURAÇÃO NECESSÁRIA!');
      console.log('');
      console.log('📝 AÇÃO NECESSÁRIA:');
      console.log('   1. Acesse: Admin → Produtos → Editar Produto');
      console.log('   2. Vá na aba "Opções"');
      console.log('   3. Crie/edite uma opção com:');
      console.log('      - Exibir em: SITE');
      console.log('      - Ativa: SIM');
      console.log('      - Pelo menos 1 escolha');
      console.log('   4. Salve e teste novamente');
      console.log('');
    }

  } catch (error) {
    console.error('❌ ERRO AO VERIFICAR:', error);

    if (error instanceof Error && error.message.includes('column')) {
      console.log('\n⚠️  CAMPOS NOVOS AINDA NÃO EXISTEM NO BANCO DE DADOS');
      console.log('');
      console.log('📝 Execute este SQL no Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE "ProductOption"');
      console.log('ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false,');
      console.log('ADD COLUMN IF NOT EXISTS "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;');
      console.log('');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
checkOptionsStatus()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  });

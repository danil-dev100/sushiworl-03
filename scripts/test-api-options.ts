/**
 * Script para testar a API de opções
 * Simula o que o cliente faz ao clicar em "Adicionar"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiOptions() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTE DA API DE OPÇÕES (SIMULAÇÃO CLIENTE)');
  console.log('🧪 ========================================\n');

  try {
    // 1. Buscar um produto que tem opções
    console.log('📦 PASSO 1: Buscando produto com opções...');

    const productWithOptions = await prisma.product.findFirst({
      where: {
        isVisible: true,
        productOptions: {
          some: {
            isActive: true,
            displayAt: 'SITE',
          }
        }
      },
      include: {
        productOptions: {
          where: {
            isActive: true,
            displayAt: 'SITE',
          },
          include: {
            choices: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!productWithOptions) {
      console.log('❌ Nenhum produto com opções SITE encontrado');
      return;
    }

    console.log('✅ Produto encontrado:', productWithOptions.name);
    console.log('   ID:', productWithOptions.id);
    console.log('   Opções SITE:', productWithOptions.productOptions.length);
    console.log('');

    // 2. Simular o que a API pública retorna
    console.log('📡 PASSO 2: Simulando resposta da API /api/products/[id]/options...');

    const apiResponse = {
      success: true,
      options: productWithOptions.productOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        type: opt.type,
        description: opt.description,
        displayAt: opt.displayAt,
        isPaid: opt.isPaid,
        basePrice: opt.basePrice,
        isActive: opt.isActive,
        choices: opt.choices.map(ch => ({
          id: ch.id,
          name: ch.name,
          price: ch.price,
          isDefault: ch.isDefault,
        }))
      }))
    };

    console.log('📦 Resposta da API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log('');

    // 3. Simular o filtro do ProductCard
    console.log('🔍 PASSO 3: Aplicando filtro do ProductCard...');

    const allOptions = apiResponse.options || [];
    console.log(`   Total de opções recebidas: ${allOptions.length}`);

    const activeOptions = allOptions.filter((opt: any) => {
      const isValid = opt.displayAt === 'SITE' &&
                     opt.isActive === true &&
                     opt.choices?.length > 0;

      console.log(`   ${opt.name}: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      if (!isValid) {
        if (opt.displayAt !== 'SITE') console.log(`      ↳ displayAt="${opt.displayAt}" (precisa ser "SITE")`);
        if (!opt.isActive) console.log(`      ↳ isActive=false`);
        if (!opt.choices?.length) console.log(`      ↳ sem escolhas`);
      }

      return isValid;
    });

    console.log('');
    console.log(`   📱 Opções válidas para SITE: ${activeOptions.length}`);
    console.log('');

    // 4. Verificar o que deve acontecer
    console.log('🎯 PASSO 4: Resultado esperado...');

    if (activeOptions.length > 0) {
      console.log('   ✅ POPUP DEVE APARECER!');
      console.log('');
      console.log('   Opção a ser exibida:');
      const firstOption = activeOptions[0];
      const totalPrice = firstOption.isPaid
        ? firstOption.basePrice + (firstOption.choices[0]?.price || 0)
        : 0;

      console.log(`      Nome: ${firstOption.name}`);
      console.log(`      Tipo: ${firstOption.type}`);
      console.log(`      É paga: ${firstOption.isPaid}`);
      console.log(`      Preço base: €${firstOption.basePrice.toFixed(2)}`);
      console.log(`      Primeira escolha: ${firstOption.choices[0]?.name} (€${firstOption.choices[0]?.price.toFixed(2)})`);
      console.log(`      PREÇO TOTAL DO OPCIONAL: €${totalPrice.toFixed(2)}`);
      console.log('');
      console.log('   Popup mostrará:');
      console.log(`      Título: "Turbine seu pedido!"`);
      console.log(`      Opção: "${firstOption.name}"`);
      console.log(`      Preço: "+€${totalPrice.toFixed(2).replace('.', ',')}"`);
      console.log(`      Botão 1: "Sim, quero! (+€${totalPrice.toFixed(2).replace('.', ',')})"`);
      console.log(`      Botão 2: "Não, obrigado"`);
      console.log('');
    } else {
      console.log('   ⚠️  POPUP NÃO APARECERÁ');
      console.log('   Produto será adicionado direto ao carrinho');
      console.log('');
    }

    // 5. Resumo
    console.log('📊 ========================================');
    console.log('📊 RESUMO DO TESTE');
    console.log('📊 ========================================\n');

    console.log('Produto testado:', productWithOptions.name);
    console.log('Opções no banco:', productWithOptions.productOptions.length);
    console.log('Opções após filtro SITE:', activeOptions.length);
    console.log('Popup deve aparecer:', activeOptions.length > 0 ? 'SIM ✅' : 'NÃO ❌');
    console.log('');

    if (activeOptions.length > 0) {
      console.log('✅ SISTEMA FUNCIONANDO CORRETAMENTE!');
      console.log('');
      console.log('Se o popup NÃO está aparecendo no navegador, o problema é no frontend:');
      console.log('   1. React state não está atualizando');
      console.log('   2. Componente SimpleProductOptionsDialog não está renderizando');
      console.log('   3. CSS está escondendo o popup');
      console.log('   4. Erro JavaScript no console');
      console.log('');
    }

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testApiOptions()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  });

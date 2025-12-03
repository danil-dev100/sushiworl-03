import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOption() {
  console.log('🧪 Criando opção de teste do sistema de opções globais\n');

  try {
    // Verificar se já existe
    const existing = await prisma.globalOption.findFirst({
      where: { name: 'Braseado' }
    });

    if (existing) {
      console.log('⚠️  Opção "Braseado" já existe');
      console.log('   ID:', existing.id);
      console.log('\n🗑️  Deletando opção existente para recriar...');

      await prisma.globalOption.delete({
        where: { id: existing.id }
      });

      console.log('✅ Opção antiga deletada\n');
    }

    // Criar opção
    console.log('📝 Criando nova opção "Braseado"...');

    const option = await prisma.globalOption.create({
      data: {
        name: 'Braseado',
        type: 'OPTIONAL',
        description: 'Quer brasear o sushi/gunkan? (aquecido)',
        displayAt: 'SITE',
        isPaid: false,
        basePrice: 0,
        isActive: true,
        sortOrder: 0,
        choices: {
          create: [
            {
              name: 'Sim, brasear',
              price: 0,
              isDefault: false,
              isActive: true,
              sortOrder: 0
            },
            {
              name: 'Não, obrigado',
              price: 0,
              isDefault: true,
              isActive: true,
              sortOrder: 1
            }
          ]
        }
      },
      include: {
        choices: true
      }
    });

    console.log('✅ Opção criada com sucesso!\n');
    console.log('📦 Detalhes da Opção:');
    console.log('   ID:', option.id);
    console.log('   Nome:', option.name);
    console.log('   Tipo:', option.type);
    console.log('   Exibir em:', option.displayAt);
    console.log('   É pago?:', option.isPaid ? `Sim (€${option.basePrice})` : 'Não');
    console.log('   Ativa?:', option.isActive ? 'Sim' : 'Não');
    console.log('   Escolhas:', option.choices.length);

    option.choices.forEach((choice, i) => {
      const defaultMark = choice.isDefault ? ' [PADRÃO]' : '';
      const priceMark = choice.price > 0 ? ` (+€${choice.price})` : '';
      console.log(`     ${i + 1}. ${choice.name}${priceMark}${defaultMark}`);
    });

    // Aplicar em todo o site
    console.log('\n🌐 Criando atribuição SITE_WIDE...');

    const assignment = await prisma.globalOptionAssignment.create({
      data: {
        globalOptionId: option.id,
        assignmentType: 'SITE_WIDE',
        minSelection: 0,
        maxSelection: 1,
        allowMultiple: false,
        sortOrder: 0
      }
    });

    console.log('✅ Atribuição criada com sucesso!');
    console.log('   ID:', assignment.id);
    console.log('   Tipo:', assignment.assignmentType);
    console.log('   Target ID:', assignment.targetId || 'null (todos os produtos)');

    console.log('\n✨ Teste concluído com sucesso!\n');
    console.log('📋 Próximos passos para testar:');
    console.log('   1. Acesse: http://localhost:3000/admin/opcoes');
    console.log('   2. Você deve ver a opção "Braseado" na lista');
    console.log('   3. Vá para o cardápio: http://localhost:3000/cardapio');
    console.log('   4. Clique em "Adicionar" em qualquer produto');
    console.log('   5. O popup deve mostrar a opção "Braseado"');
    console.log('\n🎯 A opção está aplicada em TODOS os produtos do site!');

  } catch (error) {
    console.error('\n❌ Erro ao criar opção de teste:', error);

    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOption();

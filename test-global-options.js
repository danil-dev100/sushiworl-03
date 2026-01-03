require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL configurada:', process.env.DATABASE_URL ? 'Sim' : 'Não');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testGlobalOptions() {
  try {
    console.log('🔍 Testando criação de opção global...\n');

    // 1. Verificar opções existentes
    const existing = await prisma.globalOption.findMany({
      include: {
        choices: true
      }
    });
    console.log(`📊 Opções existentes: ${existing.length}`);
    if (existing.length > 0) {
      console.log('Primeira opção:', JSON.stringify(existing[0], null, 2));
    }

    // 2. Buscar a maior ordem atual
    const maxOrder = await prisma.globalOption.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });
    const nextOrder = (maxOrder?.sortOrder || 0) + 1;
    console.log(`\n📈 Próxima ordem: ${nextOrder}`);

    // 3. Criar nova opção de teste
    console.log('\n✨ Criando nova opção de teste...');
    const testOption = await prisma.globalOption.create({
      data: {
        name: 'Braseado (TESTE API)',
        type: 'OPTIONAL',
        description: 'Quer brasear o sushi? (aquecido)',
        displayAt: 'SITE',
        isPaid: false,
        basePrice: 0,
        isActive: true,
        sortOrder: nextOrder,
        choices: {
          create: [
            {
              name: 'Sim',
              price: 0,
              isDefault: false,
              isActive: true,
              sortOrder: 0
            },
            {
              name: 'Não',
              price: 0,
              isDefault: true,
              isActive: true,
              sortOrder: 1
            }
          ]
        }
      },
      include: {
        choices: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    console.log('✅ Opção criada com sucesso!');
    console.log(JSON.stringify(testOption, null, 2));

    // 4. Verificar se foi salva
    const verification = await prisma.globalOption.findUnique({
      where: { id: testOption.id },
      include: { choices: true }
    });

    if (verification) {
      console.log('\n✅ VERIFICAÇÃO: Opção encontrada no banco de dados!');
      console.log(`ID: ${verification.id}`);
      console.log(`Nome: ${verification.name}`);
      console.log(`Escolhas: ${verification.choices.length}`);
    } else {
      console.log('\n❌ ERRO: Opção NÃO encontrada após criação!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testGlobalOptions()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Teste falhou:', error);
    process.exit(1);
  });

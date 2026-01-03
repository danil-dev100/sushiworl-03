const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdditionalItems() {
  try {
    console.log('🔍 Verificando additionalItems...\n');
    
    const settings = await prisma.settings.findFirst({
      select: {
        id: true,
        companyName: true,
        additionalItems: true,
        checkoutAdditionalItems: true
      }
    });

    if (!settings) {
      console.log('❌ Nenhuma configuração encontrada');
      return;
    }

    console.log('✅ Settings encontrado:');
    console.log('   ID:', settings.id);
    console.log('   Company:', settings.companyName);
    console.log('\n📦 additionalItems:');
    console.log(JSON.stringify(settings.additionalItems, null, 2));
    console.log('\n📦 checkoutAdditionalItems:');
    console.log(JSON.stringify(settings.checkoutAdditionalItems, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdditionalItems();

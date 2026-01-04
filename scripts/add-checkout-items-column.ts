import { prisma } from '../src/lib/db';

async function main() {
  console.log('🔄 Adicionando coluna checkoutAdditionalItems à tabela Order...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order"
    ADD COLUMN IF NOT EXISTS "checkoutAdditionalItems" JSONB;
  `);

  console.log('✅ Coluna adicionada com sucesso!');
}

main()
  .then(() => {
    console.log('🎉 Migration concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migration:', error);
    process.exit(1);
  });

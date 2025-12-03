// Script para executar migration SQL no Supabase
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || 'postgresql://postgres:54esxXG3FLNPHrcU@db.wmuprrgmczfkihqvqrph.supabase.co:5432/postgres?pgbouncer=false'
  });

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    console.log('\n📝 Executando migration: Adicionar coluna searchContexts...');

    const result = await client.query(`
      ALTER TABLE "DeliveryArea"
      ADD COLUMN IF NOT EXISTS "searchContexts" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);

    console.log('✅ Migration executada com sucesso!');

    // Verificar se a coluna foi criada
    console.log('\n🔍 Verificando se a coluna foi criada...');
    const verification = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'DeliveryArea' AND column_name = 'searchContexts';
    `);

    if (verification.rows.length > 0) {
      console.log('✅ Coluna criada com sucesso:');
      console.log(verification.rows[0]);
    } else {
      console.log('❌ Coluna não encontrada!');
    }

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Desconectado do banco de dados');
  }
}

runMigration();

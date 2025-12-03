// Script para forçar regeneração do Prisma Client
// Útil quando o servidor dev está bloqueando os arquivos

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Forçando regeneração do Prisma Client...\n');

// Caminho para o diretório .prisma/client
const prismaClientPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '.pnpm',
  '@prisma+client@6.18.0_prism_0052725c552b82a17786ccd4d942bbff',
  'node_modules',
  '.prisma',
  'client'
);

// Tentar deletar arquivos temporários
console.log('🗑️  Removendo arquivos temporários do Prisma...');
try {
  const files = fs.readdirSync(prismaClientPath);
  const tmpFiles = files.filter(f => f.includes('.tmp'));

  tmpFiles.forEach(file => {
    const filePath = path.join(prismaClientPath, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`   ✓ Removido: ${file}`);
    } catch (err) {
      console.log(`   ✗ Não foi possível remover: ${file}`);
    }
  });
} catch (err) {
  console.log('   ⚠️  Diretório não encontrado ou erro ao acessar');
}

console.log('\n⏸️  ATENÇÃO: Você DEVE parar o servidor dev (Ctrl+C) antes de continuar!\n');
console.log('Pressione qualquer tecla depois de parar o servidor...');

// Aguardar input do usuário
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.once('data', () => {
  process.stdin.setRawMode(false);

  console.log('\n🔄 Tentando gerar Prisma Client...\n');

  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('\n✅ Prisma Client gerado com sucesso!');
    console.log('\n▶️  Agora você pode reiniciar o servidor: npm run dev\n');
  } catch (error) {
    console.error('\n❌ Erro ao gerar Prisma Client');
    console.error('Certifique-se de que o servidor dev está PARADO!\n');
    process.exit(1);
  }

  process.exit(0);
});

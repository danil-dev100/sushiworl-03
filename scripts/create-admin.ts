import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Criando usuário administrador...\n');

  // Dados do admin
  const email = 'admin@sushiworld.pt';
  const password = 'admin123'; // TROCAR DEPOIS DO PRIMEIRO LOGIN
  const name = 'Administrador';

  // Verificar se já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('⚠️  Usuário admin já existe!');
    console.log('📧 Email:', existingUser.email);
    console.log('👤 Nome:', existingUser.name);
    console.log('\n💡 Para resetar a senha, delete o usuário no Prisma Studio e rode este script novamente.');
    return;
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar admin
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      firstLogin: true, // Forçar troca de senha no primeiro login
    },
  });

  console.log('✅ Administrador criado com sucesso!\n');
  console.log('📧 Email:', admin.email);
  console.log('👤 Nome:', admin.name);
  console.log('🔑 Senha temporária:', password);
  console.log('\n⚠️  IMPORTANTE: Troque a senha no primeiro login!');
  console.log('🌐 Acesse: http://localhost:3000/login\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao criar administrador:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


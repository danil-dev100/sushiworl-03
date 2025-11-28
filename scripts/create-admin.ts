import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔄 Recriando usuário admin...');

    // Primeiro deletar usuário existente se houver
    await prisma.user.deleteMany({
      where: { email: 'admin@sushiworld.pt' },
    });

    console.log('👤 Criando usuário admin...');

    console.log('👤 Criando usuário admin...');

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash('123sushi', 10);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@sushiworld.pt',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        firstLogin: true,
        isActive: true,
      },
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Senha: 123sushi`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha no primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar/verificar usuário admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
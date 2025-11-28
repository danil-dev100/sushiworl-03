import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testando funcionalidades de Email Marketing...\n');

  try {
    // 1. Criar um template de exemplo
    console.log('1. Criando template de email...');
    const template = await prisma.emailTemplate.create({
      data: {
        id: 'test-template-' + Date.now(),
        name: 'Bem-vindo',
        subject: 'Bem-vindo ao SushiWorld!',
        htmlContent: '<h1>Olá!</h1><p>Bem-vindo ao nosso restaurante.</p>',
        textContent: 'Olá! Bem-vindo ao nosso restaurante.',
        fromName: 'SushiWorld',
        fromEmail: 'pedidosushiworld@gmail.com',
        isActive: true,
      },
    });
    console.log('✅ Template criado:', template.name);

    // 2. Criar uma automação de exemplo
    console.log('\n2. Criando automação de email...');
    const automation = await prisma.emailAutomation.create({
      data: {
        id: 'test-automation-' + Date.now(),
        name: 'Boas-vindas a Novos Clientes',
        description: 'Envia email de boas-vindas quando um novo cliente se registra',
        flow: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              data: { triggerType: 'USER_REGISTERED' },
              position: { x: 100, y: 100 },
            },
            {
              id: 'email-1',
              type: 'email',
              data: { subject: 'Bem-vindo!', templateId: template.id },
              position: { x: 100, y: 200 },
            },
          ],
          edges: [
            {
              id: 'edge-1',
              source: 'trigger-1',
              target: 'email-1',
            },
          ],
        },
        isActive: false,
        isDraft: true,
      },
    });
    console.log('✅ Automação criada:', automation.name);

    // 3. Criar configuração SMTP de exemplo
    console.log('\n3. Criando configuração SMTP...');
    const smtpSettings = await prisma.smtpSettings.create({
      data: {
        id: 'smtp-config-' + Date.now(),
        smtpServer: 'smtp.hostinger.com',
        smtpPort: 587,
        smtpUser: 'pedidosushiworld@gmail.com',
        smtpPassword: '',  // Será preenchido pelo usuário
        useTls: true,
        defaultFromName: 'SushiWorld',
        defaultFromEmail: 'pedidosushiworld@gmail.com',
      },
    });
    console.log('✅ Configuração SMTP criada');

    // 4. Listar todos os templates
    console.log('\n4. Listando templates...');
    const templates = await prisma.emailTemplate.findMany();
    console.log(`✅ Total de templates: ${templates.length}`);

    // 5. Listar todas as automações
    console.log('\n5. Listando automações...');
    const automations = await prisma.emailAutomation.findMany({
      include: {
        logs: true,
      },
    });
    console.log(`✅ Total de automações: ${automations.length}`);

    console.log('\n✅ Todos os testes passaram! Sistema de Email Marketing está funcionando.');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

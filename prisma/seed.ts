import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (cuidado em produção!)
  console.log('🗑️  Limpando dados existentes...');
  await prisma.emailCampaignLog.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.printHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotionItem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.productOptionChoice.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.product.deleteMany();
  await prisma.deliveryArea.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar usuário admin padrão
  console.log('👤 Criando usuário admin...');
  const hashedPassword = await bcrypt.hash('123sushi', 10);
  
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
  console.log(`✅ Admin criado: ${admin.email}`);

  // 2. Criar configurações iniciais da empresa
  console.log('⚙️  Criando configurações da empresa...');
  const settings = await prisma.settings.create({
    data: {
      companyName: 'SushiWorld',
      billingName: 'Guilherme Alberto Rocha Ricardo',
      nif: '295949201',
      address: 'SANTA IRIA',
      phone: '+351 934 841 148',
      email: 'pedidosushiworld@gmail.com',
      vatRate: 13,
      vatType: 'INCLUSIVE',
      openingHours: {
        monday: { open: '11:00', close: '23:00', closed: false },
        tuesday: { open: '11:00', close: '23:00', closed: false },
        wednesday: { open: '11:00', close: '23:00', closed: false },
        thursday: { open: '11:00', close: '23:00', closed: false },
        friday: { open: '11:00', close: '23:00', closed: false },
        saturday: { open: '11:00', close: '23:00', closed: false },
        sunday: { open: '11:00', close: '23:00', closed: false },
      },
      bannerMode: 'STATIC',
      popupEnabled: false,
    },
  });
  console.log('✅ Configurações criadas');

  // 3. Criar área de entrega padrão (Santa Iria)
  console.log('📍 Criando área de entrega padrão...');
  const deliveryArea = await prisma.deliveryArea.create({
    data: {
      name: 'Santa Iria - Centro',
      polygon: [
        [38.8501, -9.0634],
        [38.8520, -9.0580],
        [38.8480, -9.0550],
        [38.8460, -9.0600],
        [38.8501, -9.0634],
      ],
      color: '#FF6B00',
      deliveryType: 'FREE',
      deliveryFee: 0,
      minOrderValue: 15,
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log('✅ Área de entrega criada');

  // 4. Criar produtos de exemplo (baseado no cardápio fornecido)
  console.log('🍱 Criando produtos de exemplo...');

  const categories = [
    'Entradas',
    'Temaki',
    'Hossomaki',
    'Sashimi',
    'Poke',
    'Gunkan',
    'Nigiri',
    'Futomaki',
    'Hot Roll',
    'Combinados',
  ];

  // Produtos de exemplo do cardápio
  const sampleProducts = [
    {
      sku: '001',
      name: 'Gunkan Mix 10 Peças',
      description: '2 Salmão, 2 Salmão Braseado, 2 Salmão Morango, 2 Salmão Phila, 2 Salmão queijo brie',
      price: 14.90,
      category: 'Combinados',
      imageUrl: '/produtos/1.webp',
      isTopSeller: true,
      isFeatured: true,
    },
    {
      sku: '002',
      name: 'Hot Mix 22 Peças',
      description: '8 Uramaki Salmão philadelphia, 5 hot phila, 5 hot crispy, 2 camarão tempura, 2 mini crepe de legumes',
      price: 16.50,
      category: 'Combinados',
      imageUrl: '/produtos/2.webp',
      isTopSeller: true,
    },
    {
      sku: '016',
      name: 'Ebi Fry Salmão 6 Peças',
      description: 'Camarão tempura, enrolado no Salmão',
      price: 7.80,
      category: 'Entradas',
      imageUrl: '/produtos/16.webp',
      allergens: ['Peixe', 'Marisco'],
    },
    {
      sku: '023',
      name: 'Temaki Veggie',
      description: 'Cone enrolado com frutas da estação',
      price: 5.20,
      category: 'Temaki',
      imageUrl: '/produtos/23.webp',
      isVegan: true,
      isVegetarian: true,
    },
    {
      sku: '042',
      name: 'Nigiri Salmão 4 Peças',
      description: 'Bolinho de arroz coberto com salmão',
      price: 4.00,
      category: 'Nigiri',
      imageUrl: '/produtos/42.webp',
      allergens: ['Peixe'],
      isFeatured: true,
    },
    {
      sku: '045',
      name: 'Sashimi de Salmão 5 Peças',
      description: 'Fatias de Salmão',
      price: 6.10,
      category: 'Sashimi',
      imageUrl: '/produtos/45.webp',
      allergens: ['Peixe'],
      isRaw: true,
    },
    {
      sku: '075',
      name: 'Gunkan Salmão Phila Maracujá',
      description: 'Gunkan de salmão com philadelphia e maracujá',
      price: 6.50,
      category: 'Gunkan',
      imageUrl: '/produtos/75.webp',
      allergens: ['Peixe', 'Leite'],
    },
  ];

  for (const productData of sampleProducts) {
    await prisma.product.create({
      data: {
        ...productData,
        status: 'AVAILABLE',
        isVisible: true,
        outOfStock: false,
      },
    });
  }
  console.log(`✅ ${sampleProducts.length} produtos criados`);

  // 5. Criar opção extra de exemplo (Braseado)
  console.log('🔧 Criando opções extras de exemplo...');
  const nigiriProduct = await prisma.product.findFirst({
    where: { sku: '042' },
  });

  if (nigiriProduct) {
    const option = await prisma.productOption.create({
      data: {
        productId: nigiriProduct.id,
        name: 'Finalização',
        type: 'OPTIONAL',
        description: 'Escolha como deseja seu nigiri',
        minSelection: 0,
        maxSelection: 1,
        allowMultiple: false,
        displayAt: 'SITE',
        isActive: true,
        sortOrder: 1,
      },
    });

    await prisma.productOptionChoice.createMany({
      data: [
        {
          optionId: option.id,
          name: 'Braseado',
          price: 2.50,
          isDefault: false,
          isActive: true,
          sortOrder: 1,
        },
        {
          optionId: option.id,
          name: 'Normal',
          price: 0,
          isDefault: true,
          isActive: true,
          sortOrder: 2,
        },
      ],
    });
    console.log('✅ Opções extras criadas');
  }

  // 6. Criar promoção de exemplo
  console.log('🎉 Criando promoção de exemplo...');
  await prisma.promotion.create({
    data: {
      name: 'Primeira Compra',
      code: 'BEMVINDO10',
      type: 'FIRST_PURCHASE',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 20,
      title: 'Ganhe 10% de desconto',
      description: 'Na sua primeira compra acima de €20',
      isActive: true,
      isFirstPurchaseOnly: true,
      usageLimit: 1000,
      usageCount: 0,
    },
  });
  console.log('✅ Promoção criada');

  // 7. Criar campanha de email de boas-vindas
  console.log('📧 Criando campanha de email...');
  await prisma.emailCampaign.create({
    data: {
      name: 'Confirmação de Pedido',
      subject: 'Seu pedido foi recebido! 🍱',
      type: 'TRANSACTIONAL',
      trigger: 'ORDER_CONFIRMED',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF6B00;">Pedido Confirmado!</h1>
          <p>Olá {{customerName}},</p>
          <p>Seu pedido #{{orderNumber}} foi recebido e está sendo preparado com carinho.</p>
          <p><strong>Total: €{{total}}</strong></p>
          <p>Obrigado por escolher o SushiWorld!</p>
        </div>
      `,
      textContent: 'Seu pedido foi confirmado!',
      fromName: 'SushiWorld',
      fromEmail: 'pedidosushiworld@gmail.com',
      isActive: true,
    },
  });
  console.log('✅ Campanha de email criada');

  console.log('');
  console.log('✨ Seed concluído com sucesso!');
  console.log('');
  console.log('📝 Credenciais de acesso:');
  console.log('   Email: admin@sushiworld.pt');
  console.log('   Senha: 123sushi');
  console.log('');
  console.log('⚠️  IMPORTANTE: Altere a senha no primeiro login!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


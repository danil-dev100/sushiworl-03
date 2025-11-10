import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed completo do banco de dados...');

  // Limpar dados existentes
  console.log('🗑️  Limpando dados existentes...');
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
  await prisma.emailCampaign.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar usuário admin
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

  // 2. Criar configurações da empresa
  console.log('⚙️  Criando configurações da empresa...');
  await prisma.settings.create({
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

  // 3. Criar área de entrega
  console.log('📍 Criando área de entrega...');
  await prisma.deliveryArea.create({
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

  // 4. Criar todos os produtos do cardápio
  console.log('🍱 Criando produtos do cardápio...');

  const products = [
    // COMBINADOS
    { sku: '1', name: 'Gunkan Mix 10 Peças', description: '2- Salmão, 2- Salmão Braseado, 2- Salmão Morango, 2- Salmão Phila, 2- Salmão queijo brie', price: 14.90, category: 'Combinados', imageUrl: '/produtos.webp/1.webp', isTopSeller: true, isFeatured: true, allergens: ['Peixe', 'Leite'] },
    { sku: '2', name: 'Hot Mix 22 Peças', description: '8- Uramaki Salmão philadelphia, 5- hot phila, 5- hot crispy, 2- camarão tempura, 2- mini crepe de legumes', price: 16.50, category: 'Combinados', imageUrl: '/produtos.webp/2.webp', isTopSeller: true, isFeatured: true, allergens: ['Peixe', 'Marisco', 'Leite', 'Trigo'] },
    { sku: '3', name: 'Mini World 15 Peças', description: '8- Uramaki Salmão Crispy, 2- nigiri salmão, 5- Sashimi Salmão', price: 13.90, category: 'Combinados', imageUrl: '/produtos.webp/3.webp', isTopSeller: true, allergens: ['Peixe'] },
    { sku: '4', name: 'Veggie 20 Peças', description: '8- Hossomaki morango e manga, 8- Uramaki manga, morango e rúcula, 4- Futomaki Veggie', price: 13.90, category: 'Combinados', imageUrl: '/produtos.webp/4.webp', isVegan: true, isVegetarian: true, isFeatured: true },
    { sku: '8', name: 'Special Salmon 20 Peças', description: '6- Sashimi salmão, 4- Nigiri Salmão, 4- Gunkan Salmão, 6- Salmão Neta Phila (opção de brasear +1€)', price: 18.90, category: 'Combinados', imageUrl: '/produtos.webp/8.webp', allergens: ['Peixe', 'Leite'] },
    { sku: '9', name: 'Salmão Mix 24 Peças', description: '4- sashimi de salmão, 2- gunkan phila morango, 2- nigiri de salmão, 8- hossomaki de salmão, 4- hot phila, 4- hot crispy', price: 19.50, category: 'Combinados', imageUrl: '/produtos.webp/9.webp', allergens: ['Peixe', 'Leite', 'Trigo'] },
    { sku: '10', name: 'Eat Sushi 34 Peças', description: '8- Uramaki Salmão Phila, 8- Uramaki Especial Ebi Salmão, 8- Hossomaki Salmão, 10- Hot Roll Phila', price: 23.90, category: 'Combinados', imageUrl: '/produtos.webp/10.webp', allergens: ['Peixe', 'Marisco', 'Leite', 'Trigo'] },
    { sku: '11', name: 'Special Hot 40 Peças', description: '10- hot phila, 10- hot crispy, 6- Gyosas frango e legumes, 4- Tempura de camarão, 6- Crepes de legumes, 4- Camarão batata', price: 31.90, category: 'Combinados', imageUrl: '/produtos.webp/11.webp', allergens: ['Peixe', 'Marisco', 'Leite', 'Trigo', 'Ovos'] },
    { sku: '12', name: 'World 50 Peças', description: '8- Sashimi Salmão, 8- Futomaki Califórnia, 8- uramaki salmão crispy, 8- Hossomaki de salmão, 8- Hossomaki de atum, 6- Nigiri de salmão, 4- Gunkan de Salmão', price: 33.90, category: 'Combinados', imageUrl: '/produtos.webp/12.webp', allergens: ['Peixe'] },
    { sku: '13', name: 'Tropical 60 Peças', description: '8- uramaki california tradicional, 8- uramaki phila morango, 8- uramaki salmão picante, 8- uramaki ebi especial salmão, 8- hossomaki de salmão, 8- hossomaki de pepino, 8- hossomaki delícias, 4- futomaki california', price: 43.90, category: 'Combinados', imageUrl: '/produtos.webp/13.webp', allergens: ['Peixe', 'Marisco', 'Leite'] },
    { sku: '14', name: 'World Premium 50 Peças', description: '6- Sashimi Salmão, 6- Sashimi Atum, 6- Sashimi Peixe Branco, 4- Uramaki Salmão Phila manga, 4- Uramaki Salmão Phila Morango, 2- Nigiri Salmão, 2- Nigiri Salmão Braseado, 2- Atum, 2- Gunkan Salmão, 2- Gunkan Morango, 2- Gunkan Massago, 4- Hossomaki Atum, 4- Hossomaki Salmão, 4- Futomaki California', price: 34.50, category: 'Combinados', imageUrl: '/produtos.webp/14.webp', allergens: ['Peixe', 'Leite'] },
    { sku: '15', name: 'World Mix 50 Peças', description: '8- Hot roll Phila, 8- Uramaki salmão Crispy, 8- Uramaki califórnia, 8- Hossomaki de pepino, 4- Nigiri Salmão, 4- Gunkan Salmão, 8- Futomaki Califórnia, 2- Ebi fry Salmão braseado', price: 32.90, category: 'Combinados', imageUrl: '/produtos.webp/15.webp', allergens: ['Peixe', 'Marisco', 'Leite', 'Trigo'] },

    // ENTRADAS
    { sku: '16', name: 'Ebi Fry Salmão 6 Peças', description: 'Camarão tempura, enrolado no Salmão', price: 7.80, category: 'Entradas', imageUrl: '/produtos.webp/16.webp', allergens: ['Peixe', 'Marisco', 'Trigo'] },
    { sku: '17', name: 'Salmão Neta Phila 6 Peças', description: 'Fatia de Salmão enrolado com queijo philadelphia', price: 6.90, category: 'Entradas', imageUrl: '/produtos.webp/17.webp', allergens: ['Peixe', 'Leite'] },
    { sku: '18', name: 'Kimuchi de Salmão 200g', description: 'Cubos de salmão temperado com molho kimuchi, alho francês, semente de sésamo, cebolinho e tougarashi', price: 14.90, category: 'Entradas', imageUrl: '/produtos.webp/18.webp', isHot: true, allergens: ['Peixe', 'Sojabeans'] },
    { sku: '19', name: 'Crepe de Legumes 4 Peças', description: 'Mini crepes de legumes', price: 3.70, category: 'Entradas', imageUrl: '/produtos.webp/19.webp', isVegetarian: true, allergens: ['Trigo', 'Ovos'] },
    { sku: '20', name: 'Tempura de Camarão 4 Peças', description: 'Camarão Panado e frito', price: 4.50, category: 'Entradas', imageUrl: '/produtos.webp/20.webp', allergens: ['Marisco', 'Trigo'] },
    { sku: '21', name: 'Gyosas de Camarão 4 Peças', description: 'Gyosas recheadas de camarão', price: 6.10, category: 'Entradas', imageUrl: '/produtos.webp/21.webp', allergens: ['Marisco', 'Trigo'] },
    { sku: '22', name: 'Gyosas de Frango 4 Peças', description: 'Gyosas recheadas de frango', price: 4.10, category: 'Entradas', imageUrl: '/produtos.webp/22.webp', allergens: ['Trigo'] },

    // TEMAKI
    { sku: '23', name: 'Temaki Veggie', description: 'Cone enrolado com frutas da estação', price: 5.20, category: 'Temaki', imageUrl: '/produtos.webp/23.webp', isVegan: true, isVegetarian: true },
    { sku: '24', name: 'Temaki Salmão Phila', description: 'Peixe cortado em cubos com philadelphia e enrolado tipo cone', price: 6.60, category: 'Temaki', imageUrl: '/produtos.webp/24.webp', allergens: ['Peixe', 'Leite'] },
    { sku: '25', name: 'Temaki Califórnia', description: 'Peixe cortado em cubos, manga, pepino e enrolado tipo cone', price: 6.20, category: 'Temaki', imageUrl: '/produtos.webp/25.webp', allergens: ['Peixe'] },
    { sku: '26', name: 'Temaki Salmão', description: 'Peixe cortado em cubos e enrolado tipo cone', price: 6.50, category: 'Temaki', imageUrl: '/produtos.webp/26.webp', allergens: ['Peixe'] },
    { sku: '27', name: 'Temaki Atum', description: 'Peixe cortado em cubos e enrolado tipo cone', price: 6.90, category: 'Temaki', imageUrl: '/produtos.webp/27.webp', allergens: ['Peixe'] },
    { sku: '28', name: 'Temaki Hot', description: 'Cone de salmão, panado e frito, com queijo creme, maionese japonesa e cebola frita', price: 8.90, category: 'Temaki', imageUrl: '/produtos.webp/28.webp', allergens: ['Peixe', 'Leite', 'Trigo', 'Ovos'] },

    // HOT ROLL
    { sku: '29', name: 'Hot Salmão, Morango e Manga', description: 'Rolo de sushi, panado e frito com queijo creme, morango e manga', price: 6.35, category: 'Hot Roll', imageUrl: '/produtos.webp/29.webp', allergens: ['Peixe', 'Leite', 'Trigo'] },
    { sku: '30', name: 'Hot Salmão', description: 'Rolo de sushi, panado e frito', price: 6.00, category: 'Hot Roll', imageUrl: '/produtos.webp/30.webp', allergens: ['Peixe', 'Trigo'] },
    { sku: '31', name: 'Hot Camarão Tempura Phila', description: 'Rolo de sushi, panado e frito com camarão tempura e queijo creme', price: 7.90, category: 'Hot Roll', imageUrl: '/produtos.webp/31.webp', allergens: ['Marisco', 'Leite', 'Trigo'] },
    { sku: '32', name: 'Hot Salmão Phila', description: 'Rolo de sushi, panado e frito com queijo creme', price: 6.20, category: 'Hot Roll', imageUrl: '/produtos.webp/32.webp', allergens: ['Peixe', 'Leite', 'Trigo'] },
    { sku: '33', name: 'Hot Atum', description: 'Rolo de sushi panado e frito', price: 6.70, category: 'Hot Roll', imageUrl: '/produtos.webp/33.webp', allergens: ['Peixe', 'Trigo'] },
    { sku: '34', name: 'Hot Salmão Crispy', description: 'Rolo de sushi, panado e frito com maionese e cebola frita', price: 6.35, category: 'Hot Roll', imageUrl: '/produtos.webp/34.webp', allergens: ['Peixe', 'Trigo', 'Ovos'] },
    { sku: '35', name: 'Sushi Dog 1 Uni', description: 'Hossomaki de salmão panado e frito, com cubos de salmão por cima com molho de maionese e queijo creme', price: 12.00, category: 'Hot Roll', imageUrl: '/produtos.webp/35.webp', allergens: ['Peixe', 'Leite', 'Trigo', 'Ovos'] },

    // POKE
    { sku: '36', name: 'Poke Hawaiano', description: 'Arroz de sushi, maionese, salmão, morango e Goma Wakame', price: 12.90, category: 'Poke', imageUrl: '/produtos.webp/36.webp', allergens: ['Peixe', 'Ovos'] },
    { sku: '37', name: 'Poke Especial de Salmão', description: 'Arroz de sushi, maionese, salmão, manga, goma wakame, amêndoas e tomate cereja', price: 15.90, category: 'Poke', imageUrl: '/produtos.webp/37.webp', allergens: ['Peixe', 'Ovos', 'Frutos de casca rija'] },
    { sku: '38', name: 'Poke de Abacate', description: 'Arroz de sushi, maionese, salmão e abacate', price: 13.90, category: 'Poke', imageUrl: '/produtos.webp/38.webp', allergens: ['Peixe', 'Ovos'] },
    { sku: '39', name: 'Poke Tradicional', description: 'Arroz de sushi, maionese, atum, abacate, pepino, cebola roxa, cebolinha', price: 15.90, category: 'Poke', imageUrl: '/produtos.webp/39.webp', allergens: ['Peixe', 'Ovos'] },
    { sku: '40', name: 'Poke de Salmão', description: 'Arroz de sushi, maionese, cebola roxa, pepino e salmão', price: 12.90, category: 'Poke', imageUrl: '/produtos.webp/40.webp', allergens: ['Peixe', 'Ovos'] },
    { sku: '41', name: 'Poke Veggie', description: 'Arroz de sushi, maionese, morango, manga, pepino, rúcula e abacate', price: 11.50, category: 'Poke', imageUrl: '/produtos.webp/41.webp', isVegetarian: true, allergens: ['Ovos'] },

    // NIGIRI
    { sku: '42', name: 'Nigiri Salmão 4 Peças', description: 'Bolinho de arroz coberto com salmão', price: 4.00, category: 'Nigiri', imageUrl: '/produtos.webp/42.webp', isFeatured: true, allergens: ['Peixe'] },
    { sku: '43', name: 'Nigiri Atum 4 Peças', description: 'Bolinho de arroz coberto com atum', price: 4.50, category: 'Nigiri', imageUrl: '/produtos.webp/43.webp', allergens: ['Peixe'] },
    { sku: '44', name: 'Nigiri Veggie 4 Peças', description: 'Bolinho de arroz coberto com vegetais', price: 3.80, category: 'Nigiri', imageUrl: '/produtos.webp/44.webp', isVegan: true, isVegetarian: true },

    // SASHIMI
    { sku: '45', name: 'Sashimi de Salmão 5 Peças', description: 'Fatias de Salmão', price: 6.10, category: 'Sashimi', imageUrl: '/produtos.webp/45.webp', isRaw: true, allergens: ['Peixe'] },
    { sku: '46', name: 'Sashimi de Atum 5 Peças', description: 'Fatias de atum', price: 6.30, category: 'Sashimi', imageUrl: '/produtos.webp/46.webp', isRaw: true, allergens: ['Peixe'] },
    { sku: '47', name: 'Sashimi Mix 15 Peças', description: 'Fatias de peixe variadas', price: 10.90, category: 'Sashimi', imageUrl: '/produtos.webp/47.webp', isRaw: true, allergens: ['Peixe'] },
    { sku: '48', name: 'Sashimi Peixe Branco 5 Peças', description: 'Fatias de peixe branco', price: 5.90, category: 'Sashimi', imageUrl: '/produtos.webp/48.webp', isRaw: true, allergens: ['Peixe'] },

    // HOSSOMAKI
    { sku: '49', name: 'Sakemaki', description: 'Rolo de arroz com a alga por fora (Salmão)', price: 4.40, category: 'Hossomaki', imageUrl: '/produtos.webp/49.webp', allergens: ['Peixe'] },
    { sku: '50', name: 'Kappamaki', description: 'Rolo de arroz com a alga por fora (Pepino)', price: 3.20, category: 'Hossomaki', imageUrl: '/produtos.webp/50.webp', isVegan: true, isVegetarian: true },
    { sku: '51', name: 'Tempuramaki', description: 'Rolo de arroz com a alga por fora (Camarão tempura)', price: 4.90, category: 'Hossomaki', imageUrl: '/produtos.webp/51.webp', allergens: ['Marisco', 'Trigo'] },
    { sku: '52', name: 'Ebimaki', description: 'Rolo de arroz com a alga por fora (Camarão)', price: 4.90, category: 'Hossomaki', imageUrl: '/produtos.webp/52.webp', allergens: ['Marisco'] },
    { sku: '53', name: 'Tekkamaki', description: 'Rolo de arroz com a alga por fora (Atum)', price: 4.90, category: 'Hossomaki', imageUrl: '/produtos.webp/53.webp', allergens: ['Peixe'] },
    { sku: '54', name: 'Avocadomaki', description: 'Rolo de arroz com alga por fora (Abacate)', price: 3.50, category: 'Hossomaki', imageUrl: '/produtos.webp/54.webp', isVegan: true, isVegetarian: true },

    // FUTOMAKI
    { sku: '55', name: 'Futomaki Veggie', description: 'Arroz de sushi, morango, manga e pepino', price: 3.90, category: 'Futomaki', imageUrl: '/produtos.webp/55.webp', isVegan: true, isVegetarian: true },
    { sku: '56', name: 'Futomaki Califórnia', description: 'Arroz de sushi, salmão, manga e pepino', price: 4.10, category: 'Futomaki', imageUrl: '/produtos.webp/56.webp', allergens: ['Peixe'] },
    { sku: '57', name: 'Futomaki Salmão, Abacate e Camarão', description: 'Arroz de sushi, salmão, camarão cozido e abacate', price: 5.90, category: 'Futomaki', imageUrl: '/produtos.webp/57.webp', allergens: ['Peixe', 'Marisco'] },
    { sku: '58', name: 'Futomaki Atum Abacate', description: 'Arroz de sushi, atum e abacate', price: 5.90, category: 'Futomaki', imageUrl: '/produtos.webp/58.webp', allergens: ['Peixe'] },
    { sku: '59', name: 'Futomaki Atum Pepino', description: 'Arroz de sushi, atum e pepino', price: 5.50, category: 'Futomaki', imageUrl: '/produtos.webp/59.webp', allergens: ['Peixe'] },

    // GUNKAN
    { sku: '75', name: 'Gunkan Salmão Phila Maracujá', description: 'Gunkan de salmão com philadelphia e maracujá', price: 6.50, category: 'Gunkan', imageUrl: '/produtos.webp/75.webp', allergens: ['Peixe', 'Leite'] },
    { sku: '76', name: 'Gunkan Salmão Queijo Brie Braseado', description: 'Gunkan de salmão com queijo brie braseado', price: 6.60, category: 'Gunkan', imageUrl: '/produtos.webp/76.webp', allergens: ['Peixe', 'Leite'] },
    { sku: '77', name: 'Gunkan Salmão Massago', description: 'Gunkan de salmão com massago', price: 8.00, category: 'Gunkan', imageUrl: '/produtos.webp/77.webp', allergens: ['Peixe'] },
  ];

  console.log(`📦 Criando ${products.length} produtos...`);
  
  for (const productData of products) {
    await prisma.product.create({
      data: {
        ...productData,
        status: 'AVAILABLE',
        isVisible: true,
        outOfStock: false,
      },
    });
  }
  
  console.log(`✅ ${products.length} produtos criados com sucesso`);

  // 5. Criar opções extras (Braseado) para produtos específicos
  console.log('🔧 Criando opções extras...');
  
  // Produtos que podem ter a opção "Braseado"
  const productsWithBraseado = ['17', '42', '43', '75', '76', '8'];
  
  for (const sku of productsWithBraseado) {
    const product = await prisma.product.findUnique({
      where: { sku },
    });

    if (product) {
      const option = await prisma.productOption.create({
        data: {
          productId: product.id,
          name: 'Finalização',
          type: 'OPTIONAL',
          description: 'Escolha como deseja seu prato',
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
            name: 'Normal',
            price: 0,
            isDefault: true,
            isActive: true,
            sortOrder: 1,
          },
          {
            optionId: option.id,
            name: 'Braseado',
            price: sku === '8' ? 1.00 : 2.50, // Special Salmon tem +1€, outros +2.50€
            isDefault: false,
            isActive: true,
            sortOrder: 2,
          },
        ],
      });
    }
  }
  
  console.log('✅ Opções extras criadas');

  // 6. Criar promoção de primeira compra
  console.log('🎉 Criando promoção...');
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

  // 7. Criar campanha de email
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
  console.log('✨ Seed completo concluído com sucesso!');
  console.log('');
  console.log('📊 Resumo:');
  console.log(`   - ${products.length} produtos criados`);
  console.log(`   - ${productsWithBraseado.length} produtos com opção "Braseado"`);
  console.log('   - 1 área de entrega configurada');
  console.log('   - 1 promoção ativa');
  console.log('   - 1 campanha de email');
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


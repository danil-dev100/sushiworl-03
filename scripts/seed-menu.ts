import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Produtos do cardápio baseados no arquivo docs/descriçao-cardapio.txt
const menuProducts = [
  // ENTRADAS
  { sku: '16', name: 'Ebi Fry Salmão 6 Peças', description: 'Camarão tempura, enrolado no Salmão', price: 7.80, category: 'Entradas' },
  { sku: '17', name: 'Salmão Neta Phila 6 Peças', description: 'Fatia de Salmão enrolado com queijo philadelphia', price: 6.90, category: 'Entradas' },
  { sku: '18', name: 'Kimuchi de Salmão 200g', description: 'Cubos de salmão temperado com molho kimuchi, alho francês, semente de sésamo, cebolinho e tougarashi', price: 14.90, category: 'Entradas' },
  { sku: '19', name: 'Crepe de Legumes 4 Peças', description: 'Mini crepes de legumes', price: 3.70, category: 'Entradas' },
  { sku: '20', name: 'Tempura de Camarão 4 Peças', description: 'Camarão Panado e frito', price: 4.50, category: 'Entradas' },
  { sku: '21', name: 'Gyosas de Camarão 4 Peças', description: 'Gyosas recheadas de camarão', price: 6.10, category: 'Entradas' },
  { sku: '22', name: 'Gyosas de Frango 4 Peças', description: 'Gyosas recheadas de frango', price: 4.10, category: 'Entradas' },

  // TEMAKI
  { sku: '23', name: 'Temaki Veggie', description: 'Cone enrolado com frutas da estação', price: 5.20, category: 'Temaki' },
  { sku: '24', name: 'Temaki Salmão Phila', description: 'Peixe cortado em cubos com philadelphia e enrolado tipo cone', price: 6.60, category: 'Temaki' },
  { sku: '25', name: 'Temaki Califórnia', description: 'Peixe cortado em cubos, manga, pepino e enrolado tipo cone', price: 6.20, category: 'Temaki' },
  { sku: '26', name: 'Temaki Salmão', description: 'Peixe cortado em cubos e enrolado tipo cone', price: 6.50, category: 'Temaki' },
  { sku: '27', name: 'Temaki Atum', description: 'Peixe cortado em cubos e enrolado tipo cone', price: 6.90, category: 'Temaki' },
  { sku: '28', name: 'Temaki Hot', description: 'Cone de salmão, panado e frito, com queijo creme, maionese japonesa e cebola frita', price: 8.90, category: 'Temaki' },

  // HOSSOMAKI
  { sku: '49', name: 'Sakemaki', description: 'Rolo de arroz com a alga por fora (Salmão)', price: 4.40, category: 'Hossomaki' },
  { sku: '50', name: 'Kappamaki', description: 'Rolo de arroz com a alga por fora (Pepino)', price: 3.20, category: 'Hossomaki' },
  { sku: '51', name: 'Tempuramaki', description: 'Rolo de arroz com a alga por fora (Camarão tempura)', price: 4.90, category: 'Hossomaki' },
  { sku: '52', name: 'Ebimaki', description: 'Rolo de arroz com a alga por fora (Camarão)', price: 4.90, category: 'Hossomaki' },
  { sku: '53', name: 'Tekkamaki', description: 'Rolo de arroz com a alga por fora (Atum)', price: 4.90, category: 'Hossomaki' },
  { sku: '54', name: 'Avocadomaki', description: 'Rolo de arroz com alga por fora (Abacate)', price: 3.50, category: 'Hossomaki' },

  // SASHIMI
  { sku: '45', name: 'Sashimi de Salmão 5 Peças', description: 'Fatias de Salmão', price: 6.10, category: 'Sashimi' },
  { sku: '46', name: 'Sashimi de Atum 5 Peças', description: 'Fatias de atum', price: 6.30, category: 'Sashimi' },
  { sku: '47', name: 'Sashimi Mix 15 Peças', description: 'Fatias de peixe variadas', price: 10.90, category: 'Sashimi' },
  { sku: '48', name: 'Sashimi Peixe Branco 5 Peças', description: 'Fatias de peixe branco', price: 5.90, category: 'Sashimi' },

  // POKE
  { sku: '36', name: 'Poke Hawaiano', description: 'Arroz de sushi, maionese, salmão, morango e Goma Wakame', price: 12.90, category: 'Poke' },
  { sku: '37', name: 'Poke Especial de Salmão', description: 'Arroz de sushi, maionese, salmão, manga, goma wakame, amêndoas e tomate cereja', price: 15.90, category: 'Poke' },
  { sku: '38', name: 'Poke de Abacate', description: 'Arroz de sushi, maionese, salmão e abacate', price: 13.90, category: 'Poke' },
  { sku: '39', name: 'Poke Tradicional', description: 'Arroz de sushi, maionese, atum, abacate, pepino, cebola roxa, cebolinha', price: 15.90, category: 'Poke' },
  { sku: '40', name: 'Poke de Salmão', description: 'Arroz de sushi, maionese, cebola roxa, pepino e salmão', price: 12.90, category: 'Poke' },
  { sku: '41', name: 'Poke Veggie', description: 'Arroz de sushi, maionese, morango, manga, pepino, rúcula e abacate', price: 11.50, category: 'Poke' },

  // GUNKAN
  { sku: '75', name: 'Gunkan Salmão Phila Maracujá', description: 'Gunkan de salmão com philadelphia e maracujá', price: 6.50, category: 'Gunkan' },
  { sku: '76', name: 'Gunkan Salmão Queijo Brie Braseado', description: 'Gunkan de salmão com queijo brie braseado', price: 6.60, category: 'Gunkan' },
  { sku: '77', name: 'Gunkan Salmão Massago', description: 'Gunkan de salmão com massago', price: 8.00, category: 'Gunkan' },

  // NIGIRI
  { sku: '42', name: 'Nigiri Salmão 4 Peças', description: 'Bolinho de arroz coberto com salmão', price: 4.00, category: 'Nigiri' },
  { sku: '43', name: 'Nigiri Atum 4 Peças', description: 'Bolinho de arroz coberto com atum', price: 4.50, category: 'Nigiri' },
  { sku: '44', name: 'Nigiri Veggie 4 Peças', description: 'Bolinho de arroz coberto com vegetais', price: 3.80, category: 'Nigiri' },

  // FUTOMAKI
  { sku: '55', name: 'Futomaki Veggie', description: 'Arroz de sushi, morango, manga e pepino', price: 3.90, category: 'Futomaki' },
  { sku: '56', name: 'Futomaki Califórnia', description: 'Arroz de sushi, salmão, manga e pepino', price: 4.10, category: 'Futomaki' },
  { sku: '57', name: 'Futomaki Salmão, Abacate e Camarão', description: 'Arroz de sushi, salmão, camarão cozido e abacate', price: 5.90, category: 'Futomaki' },
  { sku: '58', name: 'Futomaki Atum Abacate', description: 'Arroz de sushi, atum e abacate', price: 5.90, category: 'Futomaki' },
  { sku: '59', name: 'Futomaki Atum Pepino', description: 'Arroz de sushi, atum e pepino', price: 5.50, category: 'Futomaki' },

  // HOT ROLL
  { sku: '29', name: 'Hot Salmão, Morango e Manga', description: 'Rolo de sushi, panado e frito com queijo creme, morango e manga', price: 6.35, category: 'Hot Roll' },
  { sku: '30', name: 'Hot Salmão', description: 'Rolo de sushi, panado e frito', price: 6.00, category: 'Hot Roll' },
  { sku: '31', name: 'Hot Camarão Tempura Phila', description: 'Rolo de sushi, panado e frito com camarão tempura e queijo creme', price: 7.90, category: 'Hot Roll' },
  { sku: '32', name: 'Hot Salmão Phila', description: 'Rolo de sushi, panado e frito com queijo creme', price: 6.20, category: 'Hot Roll' },
  { sku: '33', name: 'Hot Atum', description: 'Rolo de sushi panado e frito', price: 6.70, category: 'Hot Roll' },
  { sku: '34', name: 'Hot Salmão Crispy', description: 'Rolo de sushi, panado e frito com maionese e cebola frita', price: 6.35, category: 'Hot Roll' },
  { sku: '35', name: 'Sushi Dog 1 Uni', description: 'Hossomaki de salmão panado e frito, com cubos de salmão por cima com molho de maionese e queijo creme', price: 12.00, category: 'Hot Roll' },

  // COMBINADOS
  { sku: '01', name: 'Gunkan Mix 10 Peças', description: '2- Salmão, 2- Salmão Braseado, 2- Salmão Morango, 2- Salmão Phila, 2- Salmão queijo brie', price: 14.90, category: 'Combinados' },
  { sku: '02', name: 'Hot Mix 22 Peças', description: '8- Uramaki Salmão philadelphia, 5- hot phila, 5- hot crispy, 2- camarão tempura, 2- mini crepe de legumes', price: 16.50, category: 'Combinados' },
  { sku: '03', name: 'Mini World 15 Peças', description: '8- Uramaki Salmão Crispy, 2- nigiri salmão, 5- Sashimi Salmão', price: 13.90, category: 'Combinados' },
  { sku: '04', name: 'Veggie 20 Peças', description: '8- Hossomaki morango e manga, 8- Uramaki manga, morango e rúcula, 4- Futomaki Veggie', price: 13.90, category: 'Combinados' },
  { sku: '08', name: 'Special Salmon 20 Peças', description: '6- Sashimi salmão, 4- Nigiri Salmão, 4- Gunkan Salmão, 6- Salmão Neta Phila (opção de brasear +1€)', price: 18.90, category: 'Combinados' },
  { sku: '09', name: 'Salmão Mix 24 Peças', description: '4- sashimi de salmão, 2- gunkan phila morango, 2- nigiri de salmão, 8- hossomaki de salmão, 4- hot phila, 4- hot crispy', price: 19.50, category: 'Combinados' },
  { sku: '10', name: 'Eat Sushi 34 Peças', description: '8- Uramaki Salmão Phila, 8- Uramaki Especial Ebi Salmão, 8- Hossomaki Salmão, 10- Hot Roll Phila', price: 23.90, category: 'Combinados' },
  { sku: '11', name: 'Special Hot 40 Peças', description: '10- hot phila, 10- hot crispy, 6- Gyosas frango e legumes, 4- Tempura de camarão, 6- Crepes de legumes, 4- Camarão batata', price: 31.90, category: 'Combinados' },
  { sku: '12', name: 'World 50 Peças', description: '8- Sashimi Salmão, 8- Futomaki Califórnia, 8- uramaki salmão crispy, 8- Hossomaki de salmão, 8- Hossomaki de atum, 6- Nigiri de salmão, 4- Gunkan de Salmão', price: 33.90, category: 'Combinados' },
  { sku: '13', name: 'Tropical 60 Peças', description: '8- uramaki california tradicional, 8- uramaki phila morango, 8- uramaki salmão picante, 8- uramaki ebi especial salmão, 8- hossomaki de salmão, 8- hossomaki de pepino, 8- hossomaki delícias, 4- futomaki california', price: 43.90, category: 'Combinados' },
  { sku: '14', name: 'World Premium 50 Peças', description: '6- Sashimi Salmão, 6- Sashimi Atum, 6- Sashimi Peixe Branco, 4- Uramaki Salmão Phila manga, 4- Uramaki Salmão Phila Morango, 2- Nigiri Salmão, 2- Nigiri Salmão Braseado, 2- Atum, 2- Gunkan Salmão, 2- Gunkan Morango, 2- Gunkan Massago, 4- Hossomaki Atum, 4- Hossomaki Salmão, 4- Futomaki California', price: 34.50, category: 'Combinados' },
  { sku: '15', name: 'World Mix 50 Peças', description: '8- Hot roll Phila, 8- Uramaki salmão Crispy, 8- Uramaki califórnia, 8- Hossomaki de pepino, 4- Nigiri Salmão, 4- Gunkan Salmão, 8- Futomaki Califórnia, 2- Ebi fry Salmão braseado', price: 32.90, category: 'Combinados' },
];

async function main() {
  console.log('🍣 Populando cardápio SushiWorld...\n');

  // Verificar quantos produtos já existem
  const existingCount = await prisma.product.count();
  console.log(`📊 Produtos existentes: ${existingCount}`);

  if (existingCount > 0) {
    console.log('⚠️  Já existem produtos no banco. Pulando criação...');
    console.log('   Para recriar, delete os produtos primeiro.');
    return;
  }

  let created = 0;
  let errors = 0;

  for (const product of menuProducts) {
    try {
      await prisma.product.create({
        data: {
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          imageUrl: '/placeholder-sushi.jpg',
          status: 'AVAILABLE',
          isVisible: true,
        },
      });
      created++;
      console.log(`✅ ${product.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  ${product.name} (SKU ${product.sku} já existe)`);
      } else {
        console.error(`❌ Erro ao criar ${product.name}:`, error.message);
        errors++;
      }
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Criados: ${created}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📦 Total de produtos: ${menuProducts.length}`);
}

main()
  .catch((e) => {
    console.error('Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

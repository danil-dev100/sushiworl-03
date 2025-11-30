/**
 * SCRIPT DE IMPORTAÇÃO DINÂMICA DO CARDÁPIO
 * 
 * Este script lê docs/descrição-cardapio.txt e importa produtos para o banco.
 * 
 * QUANDO USAR?
 * - Quando você editar o arquivo descrição-cardapio.txt
 * - Para adicionar novos produtos sem mexer no código
 * 
 * COMO RODAR?
 * npx tsx scripts/importar-cardapio.ts
 */

import { PrismaClient, ProductStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Mapa de categorias para normalizar
const categoriaMap: Record<string, string> = {
  'Entradas': 'Entradas',
  'Temaki': 'Temaki',
  'Hossomaki': 'Hossomaki',
  'Sashimi': 'Sashimi',
  'Poke': 'Poke',
  'Gunkan': 'Gunkan',
  'Uramaki': 'Uramaki',
  'Nigiri': 'Nigiri',
  'Futomaki': 'Futomaki',
  'Hot Roll': 'Hot Roll',
  'Combinados': 'Combinados',
};

async function importarCardapio() {
  console.log('🍱 IMPORTADOR DE CARDÁPIO - SUSHIWORLD\n');

  // 1. Ler arquivo
  const filePath = path.join(process.cwd(), 'docs', 'descrição-cardapio.txt');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo não encontrado:', filePath);
    console.log('💡 Certifique-se de que docs/descrição-cardapio.txt existe!');
    process.exit(1);
  }

  console.log('📖 Lendo arquivo:', filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const linhas = fileContent.split('\n');

  // 2. Parse das linhas
  const produtos = [];
  let linhaParsed = 0;

  for (const linha of linhas) {
    // Ignorar comentários e linhas vazias
    if (linha.startsWith('#') || linha.trim() === '' || linha.startsWith('##')) {
      continue;
    }

    const partes = linha.split('|');
    
    // Formato esperado: Categoria|ID|Nome|Descrição|Preço
    if (partes.length === 5) {
      const [categoria, id, nome, descricao, preco] = partes.map(p => p.trim());

      // Validação básica
      if (!categoria || !id || !nome || !preco) {
        console.warn(`⚠️  Linha inválida ignorada: ${linha}`);
        continue;
      }

      // Parse do preço (pode ter múltiplos preços: "6.10/8.50")
      const precoBase = parseFloat(preco.split('/')[0]);

      if (isNaN(precoBase)) {
        console.warn(`⚠️  Preço inválido na linha: ${linha}`);
        continue;
      }

      produtos.push({
        sku: id,
        name: nome,
        description: descricao,
        price: precoBase,
        category: categoriaMap[categoria] || categoria,
        imageUrl: `/produtos.webp/${id}.webp`,
        status: ProductStatus.AVAILABLE,
        isVisible: true,
        outOfStock: false,
        // Detectar características automaticamente
        isVegan: nome.toLowerCase().includes('veggie') && !descricao.toLowerCase().includes('maionese'),
        isVegetarian: nome.toLowerCase().includes('veggie'),
        isHot: nome.toLowerCase().includes('hot') || descricao.toLowerCase().includes('kimuchi'),
        isRaw: categoria === 'Sashimi',
        // Alérgenos básicos (pode ser expandido)
        allergens: detectarAlergenos(nome, descricao),
      });

      linhaParsed++;
    }
  }

  console.log(`✅ ${linhaParsed} produtos parseados do arquivo\n`);

  if (produtos.length === 0) {
    console.error('❌ Nenhum produto foi parseado!');
    console.log('💡 Verifique o formato do arquivo descrição-cardapio.txt');
    process.exit(1);
  }

  // 3. Importar para o banco (usando upsert para não duplicar)
  console.log('💾 Importando produtos para o banco de dados...\n');
  
  let criados = 0;
  let atualizados = 0;
  let erros = 0;

  for (const produto of produtos) {
    try {
      // Verifica se produto já existe (por SKU)
      const existente = await prisma.product.findUnique({
        where: { sku: produto.sku },
      });

      if (existente) {
        // Atualizar produto existente
        await prisma.product.update({
          where: { sku: produto.sku },
          data: produto,
        });
        console.log(`🔄 Atualizado: ${produto.name} (SKU: ${produto.sku})`);
        atualizados++;
      } else {
        // Criar novo produto
        await prisma.product.create({
          data: produto,
        });
        console.log(`✨ Criado: ${produto.name} (SKU: ${produto.sku})`);
        criados++;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao importar ${produto.name}:`, error.message);
      erros++;
    }
  }

  // 4. Resumo
  console.log('\n📊 RESUMO DA IMPORTAÇÃO');
  console.log('═══════════════════════════════════════');
  console.log(`✨ Produtos criados:     ${criados}`);
  console.log(`🔄 Produtos atualizados: ${atualizados}`);
  console.log(`❌ Erros:                ${erros}`);
  console.log(`📦 Total processado:     ${produtos.length}`);
  console.log('═══════════════════════════════════════\n');

  if (erros > 0) {
    console.log('⚠️  Algumas importações falharam. Verifique os erros acima.');
  } else {
    console.log('🎉 Importação concluída com sucesso!');
  }
}

/**
 * Detecta alérgenos com base no nome e descrição
 */
function detectarAlergenos(nome: string, descricao: string): string[] {
  const texto = `${nome} ${descricao}`.toLowerCase();
  const alergenos: string[] = [];

  if (texto.includes('salmão') || texto.includes('atum') || texto.includes('peixe')) {
    alergenos.push('Peixe');
  }
  if (texto.includes('camarão') || texto.includes('ebi')) {
    alergenos.push('Marisco');
  }
  if (texto.includes('philadelphia') || texto.includes('phila') || texto.includes('queijo') || texto.includes('creme')) {
    alergenos.push('Leite');
  }
  if (texto.includes('panado') || texto.includes('tempura') || texto.includes('gyosa') || texto.includes('crepe')) {
    alergenos.push('Trigo');
  }
  if (texto.includes('maionese')) {
    alergenos.push('Ovos');
  }
  if (texto.includes('amêndoa')) {
    alergenos.push('Frutos de casca rija');
  }
  if (texto.includes('molho') || texto.includes('soja')) {
    alergenos.push('Soja');
  }

  return [...new Set(alergenos)]; // Remove duplicados
}

// Executar importação
importarCardapio()
  .catch((error) => {
    console.error('\n💥 ERRO FATAL:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


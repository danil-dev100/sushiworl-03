import fs from 'fs';
import path from 'path';

export interface Produto {
  id: string;
  categoria: string;
  nome: string;
  descricao: string;
  preco: string;
  imagemUrl: string;
}

/**
 * Parse do arquivo descrição-cardapio.txt
 * Retorna array de produtos organizados
 */
export function parseCardapio(): Produto[] {
  const filePath = path.join(process.cwd(), 'docs', 'descrição-cardapio.txt');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo descrição-cardapio.txt não encontrado em:', filePath);
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const produtos: Produto[] = [];
  const linhas = fileContent.split('\n');

  for (const linha of linhas) {
    if (linha.startsWith('#') || linha.trim() === '' || linha.startsWith('##')) {
      continue;
    }

    const partes = linha.split('|');
    if (partes.length === 5) {
      const [categoria, id, nome, descricao, preco] = partes;

      produtos.push({
        id: id.trim(),
        categoria: categoria.trim(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        preco: preco.trim(),
        imagemUrl: `/produtos/${id.trim()}.webp`,
      });
    }
  }

  return produtos;
}

/**
 * Retorna produtos filtrados por categoria
 */
export function getProdutosPorCategoria(categoria: string): Produto[] {
  const todosProdutos = parseCardapio();
  return todosProdutos.filter(
    (p) => p.categoria.toLowerCase() === categoria.toLowerCase()
  );
}

/**
 * Retorna todas as categorias únicas na ordem definida
 */
export function getCategorias(): string[] {
  const produtos = parseCardapio();
  const categorias = [...new Set(produtos.map((p) => p.categoria))];

  const ordemCategorias = [
    'Entradas',
    'Temaki',
    'Hossomaki',
    'Sashimi',
    'Poke',
    'Gunkan',
    'Uramaki',
    'Nigiri',
    'Futomaki',
    'Hot Roll',
    'Combinados',
  ];

  return categorias.sort((a, b) => {
    const indexA = ordemCategorias.indexOf(a);
    const indexB = ordemCategorias.indexOf(b);
    return indexA - indexB;
  });
}

/**
 * Retorna um produto específico pelo ID
 */
export function getProdutoPorId(id: string): Produto | undefined {
  const produtos = parseCardapio();
  return produtos.find((p) => p.id === id);
}
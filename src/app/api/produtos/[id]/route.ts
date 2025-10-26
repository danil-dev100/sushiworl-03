import { NextResponse } from "next/server";

// Defina o tipo do parâmetro da rota
type ProdutoRouteParams = {
  params: Promise<{ id: string }>; // <-- params é uma Promise
};

export async function GET(request: Request, { params }: ProdutoRouteParams) {
  // Aguarda a resolução da Promise para obter o id
  const { id } = await params; // <-- Usa await aqui

  // ... o restante da lógica da sua API para produtos
  // Exemplo:
  // const produto = await buscarProdutoNoSupabase(id);
  // if (!produto) {
  //   return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  // }

  return NextResponse.json({ message: `Get product ${id}` });
}
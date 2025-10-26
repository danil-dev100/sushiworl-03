import { NextResponse } from "next/server";

// Define o tipo do parâmetro da rota
type PedidoRouteParams = {
  params: Promise<{ id: string }>; // <-- params é uma Promise
};

export async function GET(request: Request, { params }: PedidoRouteParams) {
  // Aguarda a resolução da Promise para obter o id
  const { id } = await params; // <-- Usa await aqui

  // Exemplo de resposta (substitua pela sua lógica real)
  return NextResponse.json({ message: `Get order ${id}` });
}
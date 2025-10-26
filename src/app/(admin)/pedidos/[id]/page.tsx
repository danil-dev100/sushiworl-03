import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Define o tipo de props recebidas pelo componente
type PedidoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PedidoPage({ params }: PedidoPageProps) {
  // Aguarda a resolução da Promise para obter o id
  const { id } = await params;

  // Busca o pedido no banco de dados
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      itens: {
        include: {
          produto: true,
        },
      },
      cliente: true,
    },
  });

  // Se o pedido não existir, mostra a página 404
  if (!pedido) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pedido #{pedido.id}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p><strong>Cliente:</strong> {pedido.cliente?.nome || "Anônimo"}</p>
        <p><strong>Status:</strong> {pedido.status}</p>
        <p><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Itens:</h2>
        <ul className="space-y-2">
          {pedido.itens.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.quantidade}x {item.produto.nome}</span>
              <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
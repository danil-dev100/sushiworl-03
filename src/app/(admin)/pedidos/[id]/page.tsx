import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;  // ← Tipagem como Promise
}) {
  const { id } = await params;  // ← Await aqui!

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
  }) as any;  // ← Remove erros de tipagem (ou use tipos personalizados depois)

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
          {pedido.itens.map((item: any) => (
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
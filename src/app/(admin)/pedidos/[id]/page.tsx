import { notFound } from "next/navigation";

// Define os tipos manualmente
type Produto = {
  id: string;
  nome: string;
};

type ItemPedido = {
  id: string;
  quantidade: number;
  preco: number;
  produto: Produto;
};

type Cliente = {
  id: string;
  nome: string;
};

type Pedido = {
  id: string;
  status: string;
  total: number;
  cliente: Cliente | null;
  itens: ItemPedido[];
};

// Define o tipo do componente com params como Promise
export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Aguarda a resolução da Promise para obter o id
  const { id } = await params;

  // --- AQUI VOCÊ DEVE INSERIR A LÓGICA PARA BUSCAR O PEDIDO NO SUPABASE ---
  // Por enquanto, vamos simular o objeto pedido com dados fictícios
  // Isso resolve os erros de tipagem no VSCode

  let pedido: Pedido | null = null;

  // Simulação de dados (substitua pela chamada real ao Supabase)
  if (id === "1") {
    pedido = {
      id: "1",
      status: "Entregue",
      total: 65.80,
      cliente: { id: "1", nome: "Fulano" },
      itens: [
        {
          id: "1",
          quantidade: 2,
          preco: 32.90,
          produto: { id: "1", nome: "Sushi California" },
        },
      ],
    };
  }

  // Se o pedido não existir, mostra a página 404
  if (!pedido) {
    notFound();
  }

  // Agora, o VSCode reconhecerá as propriedades de 'pedido'
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
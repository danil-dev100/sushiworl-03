import { notFound } from "next/navigation";
// ... outras importações

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>; // <-- Esta linha é crucial
}) {
  // Aguarde a resolução da Promise para obter o id
  const { id } = await params; // <-- Esta linha também é crucial

  // ... o restante da lógica para buscar e editar o produto

  return (
    <div>
      {/* Seu formulário de edição aqui */}
    </div>
  );
}
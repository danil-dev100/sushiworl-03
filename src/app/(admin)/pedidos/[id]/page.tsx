export default function PedidoDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Detalhes do Pedido: {params.id}</h1>
    </div>
  );
}
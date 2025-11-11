'use client';

export function OrdersTable() {
  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <div className="grid grid-cols-1 gap-4 @container md:grid-cols-2 xl:grid-cols-3">
        {/* Exemplo de Card de Pedido */}
        <div className="flex cursor-pointer flex-col gap-4 rounded-lg border-2 border-[#FF6B00] bg-white p-4 shadow-lg dark:bg-[#2a1e14]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#a16b45]">ID do Pedido</p>
              <p className="font-bold text-[#333333] dark:text-[#f5f1e9]">#SW12345</p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
              Pendente
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-[#a16b45]">Cliente</p>
              <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">Ana Silva</p>
            </div>
            <div>
              <p className="text-sm text-[#a16b45]">Total</p>
              <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">€ 45,50</p>
            </div>
            <div>
              <p className="text-sm text-[#a16b45]">Hora</p>
              <p className="font-semibold text-[#333333] dark:text-[#f5f1e9]">12:35</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex-1 rounded-md bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">
              Aceitar
            </button>
            <button className="flex-1 rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Recusar
            </button>
            <button className="flex-1 rounded-md bg-[#FF6B00] py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Imprimir
            </button>
          </div>
        </div>

        {/* Mensagem se não houver pedidos */}
        <div className="col-span-full flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-[#ead9cd] dark:border-[#4a3c30]">
          <div className="text-center">
            <p className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
              Nenhum pedido novo
            </p>
            <p className="mt-1 text-sm text-[#a16b45]">
              Os pedidos aparecerão aqui quando forem feitos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

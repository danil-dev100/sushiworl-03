'use client';

export default function EmailMarketingPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-[#FF6B00]">Email Marketing</h1>
          <p className="text-gray-600 mt-1">
            Automatize suas campanhas de email e aumente suas vendas
          </p>
        </div>
        <button className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg hover:bg-[#FF6B00]/90">
          Novo Fluxo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="h-5 w-5 bg-blue-600 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Fluxos</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="h-5 w-5 bg-green-600 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fluxos Ativos</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="h-5 w-5 bg-purple-600 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Emails Enviados</p>
              <p className="text-2xl font-bold">401</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <div className="h-5 w-5 bg-orange-600 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold">95%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <div className="h-6 w-6 bg-green-600 rounded"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Bem-vindo ao SushiWorld</h3>
                <p className="text-sm text-gray-600">Fluxo de boas-vindas para novos clientes</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>3 nós</span>
                  <span>2 conexões</span>
                  <span>Atualizado 20/11/2025</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 bg-gray-400 rounded"></div>
                  <span className="font-medium">245</span>
                  <span className="text-gray-500">enviados</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <div className="h-4 w-4 bg-green-600 rounded"></div>
                  <span className="font-medium">96%</span>
                  <span className="text-gray-500">sucesso</span>
                </div>
              </div>
              <div className="bg-green-600 text-white px-3 py-1 rounded text-sm">Ativo</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <div className="h-6 w-6 bg-green-600 rounded"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Carrinho Abandonado</h3>
                <p className="text-sm text-gray-600">Recuperação de vendas com desconto especial</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>5 nós</span>
                  <span>4 conexões</span>
                  <span>Atualizado 22/11/2025</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 bg-gray-400 rounded"></div>
                  <span className="font-medium">156</span>
                  <span className="text-gray-500">enviados</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <div className="h-4 w-4 bg-green-600 rounded"></div>
                  <span className="font-medium">91%</span>
                  <span className="text-gray-500">sucesso</span>
                </div>
              </div>
              <div className="bg-green-600 text-white px-3 py-1 rounded text-sm">Ativo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Reembolso | SushiWorld',
  description: 'Trabalhamos para garantir a melhor experiência em cada pedido. Conheça nossa política de reembolso.',
};

export default function PoliticaReembolsoPage() {
  return (
    <div className="bg-gray-50 py-12 lg:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white p-8 lg:p-12 rounded-lg shadow-md">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-center">
            💳 Política de Reembolso – SushiWorld Santa Iria
          </h1>
          
          <div className="text-gray-700 space-y-6 text-base lg:text-lg leading-relaxed">
            <p>
              No SushiWorld Santa Iria, trabalhamos para garantir a melhor experiência em cada pedido.
              Contudo, entendemos que podem ocorrer situações imprevistas e por isso definimos a seguinte política:
            </p>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 1. Pedidos Incorretos ou Incompletos
              </h2>
              <p>
                Se o seu pedido chegar errado, incompleto ou com algum problema, entre em contacto connosco até 30 minutos após a entrega.
                Após confirmação, poderemos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Reenviar o item correto sem custos adicionais; ou</li>
                <li>Efetuar um reembolso total ou parcial, conforme o caso.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 2. Qualidade do Produto
              </h2>
              <p>
                Prezamos pela frescura e qualidade de todos os produtos.
                Caso o produto apresente algum defeito ou problema de conservação, deve comunicar-nos imediatamente para avaliação e substituição ou reembolso.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 3. Cancelamentos
              </h2>
              <p>
                Pedidos podem ser cancelados antes do início da preparação.
                Após o início da produção, não é possível o reembolso, visto que se trata de produto alimentar perecível.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 4. Forma de Reembolso
              </h2>
              <p>
                Os reembolsos, quando aplicáveis, serão realizados através do mesmo método de pagamento utilizado na compra, num prazo máximo de 5 dias úteis.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 5. Contacto
              </h2>
              <p>Para solicitar reembolso ou relatar qualquer problema, entre em contacto através de:</p>
              <ul className="list-none space-y-2 ml-4">
                <li>
                  📧{' '}
                  <a href="mailto:pedidosushiworld@gmail.com" className="text-[#FF6B00] hover:underline font-medium">
                    pedidosushiworld@gmail.com
                  </a>
                </li>
                <li>📞 +351 934 841 148</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

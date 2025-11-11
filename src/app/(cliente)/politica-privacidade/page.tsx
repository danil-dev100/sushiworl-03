import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | SushiWorld',
  description: 'Valorizamos a sua privacidade e estamos comprometidos em proteger os seus dados pessoais.',
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="bg-gray-50 py-12 lg:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white p-8 lg:p-12 rounded-lg shadow-md">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-center">
            🍣 Política de Privacidade – SushiWorld Santa Iria
          </h1>
          
          <div className="text-gray-700 space-y-6 text-base lg:text-lg leading-relaxed">
            <p>
              No SushiWorld Santa Iria, valorizamos a sua privacidade e estamos comprometidos em proteger os seus dados pessoais.
              Esta Política explica como recolhemos, utilizamos e protegemos as suas informações quando utiliza o nosso site, faz um pedido online ou entra em contacto connosco.
            </p>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 1. Dados Recolhidos
              </h2>
              <p>Podemos recolher:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nome e contacto (telefone, e-mail, morada);</li>
                <li>Dados de pagamento (apenas processados por plataformas seguras);</li>
                <li>Informações de entrega e preferências de pedido.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 2. Finalidade do Uso dos Dados
              </h2>
              <p>Usamos os seus dados para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Processar e entregar pedidos;</li>
                <li>Melhorar o serviço e experiência do cliente;</li>
                <li>Enviar comunicações sobre promoções ou novidades (caso autorize).</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 3. Armazenamento e Proteção
              </h2>
              <p>
                Os dados são armazenados de forma segura e nunca partilhados com terceiros, exceto quando necessário para processar o pagamento ou entrega.
                Adotamos medidas técnicas e organizativas adequadas para garantir a proteção e confidencialidade das informações.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 4. Direitos do Titular
              </h2>
              <p>De acordo com o RGPD, tem o direito de:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Aceder, corrigir ou eliminar os seus dados pessoais;</li>
                <li>Retirar o consentimento para comunicações de marketing;</li>
                <li>Solicitar informações sobre o uso dos seus dados.</li>
              </ul>
              <p className="mt-3">
                Para exercer os seus direitos, contacte-nos em{' '}
                <a href="mailto:pedidosushiworld@gmail.com" className="text-[#FF6B00] hover:underline font-medium">
                  pedidosushiworld@gmail.com
                </a>.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-8">
                🔸 5. Alterações a Esta Política
              </h2>
              <p>
                O SushiWorld Santa Iria pode atualizar esta política periodicamente. Recomendamos verificar esta página com regularidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

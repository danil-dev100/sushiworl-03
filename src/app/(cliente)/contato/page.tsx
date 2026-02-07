import { Metadata } from 'next';
import { Phone, Mail, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contato - SushiWorld Santa Iria da Azóia',
  description:
    'Entre em contato com o SushiWorld. Atendimento exclusivo por delivery de sushi em Santa Iria da Azóia. Telefone, email e área de entrega.',
  openGraph: {
    title: 'Contato - SushiWorld Santa Iria da Azóia',
    description:
      'Fale conosco. Atendimento exclusivo por delivery em Santa Iria da Azóia.',
    url: 'https://sushiworld.pt/contato',
  },
  alternates: {
    canonical: 'https://sushiworld.pt/contato',
  },
};

export default function ContatoPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="flex-grow">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#FF6B00] text-center mb-8 md:mb-12">
            Fale Conosco
          </h1>

          {/* Aviso Delivery */}
          <div className="bg-white dark:bg-[#23170f]/50 rounded-xl shadow-lg p-8 md:p-12 w-full mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="flex-shrink-0">
                <Truck className="w-20 h-20 md:w-24 md:h-24 text-[#FF6B00]" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#FF6B00] mb-2">
                  Atendimento Exclusivo por Delivery
                </h2>
                <p className="text-[#333333] dark:text-[#f5f1e9]/90">
                  Para garantir a máxima qualidade e frescura dos nossos pratos, operamos exclusivamente com entregas. 
                  Faça o seu pedido e receba o melhor do SushiWorld no conforto da sua casa.
                </p>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="bg-white dark:bg-[#23170f]/50 rounded-xl shadow-lg p-6 flex items-center gap-4">
              <MapPin className="w-8 h-8 text-[#FF6B00] flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">Nome</h3>
                <p className="text-[#333333] dark:text-[#f5f1e9]/90">SushiWorld</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#23170f]/50 rounded-xl shadow-lg p-6 flex items-center gap-4">
              <Phone className="w-8 h-8 text-[#FF6B00] flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">Telefone</h3>
                <a
                  className="text-[#333333] dark:text-[#f5f1e9]/90 hover:text-[#FF6B00] transition-colors"
                  href="tel:+351932722005"
                >
                  +351 932 722 005
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-[#23170f]/50 rounded-xl shadow-lg p-6 flex items-center gap-4">
              <Mail className="w-8 h-8 text-[#FF6B00] flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">E-mail</h3>
                <a 
                  className="text-[#333333] dark:text-[#f5f1e9]/90 hover:text-[#FF6B00] transition-colors break-all" 
                  href="mailto:pedidosushiworld@gmail.com"
                >
                  pedidosushiworld@gmail.com
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-[#23170f]/50 rounded-xl shadow-lg p-6 flex items-center gap-4">
              <MapPin className="w-8 h-8 text-[#FF6B00] flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">Área de Entrega</h3>
                <p className="text-[#333333] dark:text-[#f5f1e9]/90">SANTA IRIA</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Botão Fixo Inferior */}
      <div className="sticky bottom-0 w-full p-4 bg-[#f5f1e9]/80 dark:bg-[#23170f]/80 backdrop-blur-sm border-t border-[#e5e0d8] dark:border-[#3a2c20]">
        <Link 
          href="/cardapio"
          className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 md:h-14 px-6 bg-[#FF6B00] text-white text-base md:text-lg font-bold hover:opacity-90 transition-opacity"
        >
          Ver Cardápio e Fazer Pedido
        </Link>
      </div>
    </div>
  );
}


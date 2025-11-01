import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f1e9]">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src="/banner-site-novo-sushiword.webp"
          alt="Banner SushiWorld"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Bem-vindo à SushiWorld
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            O melhor sushi fresco entregue na sua porta
          </p>
          <Link
            href="/cardapio"
            className="inline-block bg-[#FF6B00] hover:bg-[#ff8126] text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Ver Cardápio
          </Link>
        </div>
      </section>

      {/* Seção Destaque */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-[#333333] mb-12">
          Por que escolher a SushiWorld?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">🍣</div>
            <h3 className="text-xl font-bold text-[#333333] mb-2">Ingredientes Frescos</h3>
            <p className="text-gray-600">
              Utilizamos apenas ingredientes da mais alta qualidade
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-[#333333] mb-2">Entrega Rápida</h3>
            <p className="text-gray-600">
              Seu pedido chega quentinho em até 45 minutos
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-5xl mb-4">👨‍🍳</div>
            <h3 className="text-xl font-bold text-[#333333] mb-2">Chefs Especializados</h3>
            <p className="text-gray-600">
              Equipe treinada na autêntica culinária japonesa
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[#FF6B00] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para fazer seu pedido?
          </h2>
          <p className="text-xl mb-8">
            Explore nosso cardápio completo e peça agora mesmo!
          </p>
          <Link
            href="/cardapio"
            className="inline-block bg-white text-[#FF6B00] font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Fazer Pedido
          </Link>
        </div>
      </section>
    </main>
  );
}
// /src/app/page.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f1e9]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Image
            src="/logo-nova-sushiworl-santa-iria-sem-fundo.webp"
            alt="SushiWorld Delivery"
            width={160}
            height={60}
            className="h-12 w-auto object-contain"
          />
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-[#FF6B00] font-semibold">Home</Link>
            <Link href="/cardapio" className="text-gray-700 hover:text-[#FF6B00] transition-colors">Cardápio</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            SushiWorld <span className="text-[#FF6B00]">Delivery</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            O melhor sushi de Santa Iria, entregue na sua casa com frescor e qualidade incomparáveis
          </p>
          
          <Link 
            href="/cardapio"
            className="bg-[#FF6B00] hover:bg-[#ff8126] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg inline-block"
          >
            Ver Cardápio Completo
          </Link>
        </div>
      </section>

      {/* Banner Promocional */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/banner-site-novo-sushiword.webp"
              alt="Promoções especiais SushiWorld"
              width={1200}
              height={400}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 SushiWorld Delivery Portugal. Todos os direitos reservados.</p>
          <p className="mt-2 text-sm text-gray-400">
            Desenvolvido com ❤️ para amantes de sushi
          </p>
        </div>
      </footer>
    </div>
  )
}
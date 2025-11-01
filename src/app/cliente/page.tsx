// /src/app/page.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f1e9]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Image 
            src="/logo-nova-sushiworl-santa-iria-sem-fundo.webp"
            alt="SushiWorld"
            width={150}
            height={60}
            className="h-12 w-auto"
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Bem-vindo ao SushiWorld
        </h1>
        
        <div className="text-center">
          <Link 
            href="/cardapio"
            className="bg-[#FF6B00] text-white px-6 py-3 rounded-lg font-semibold"
          >
            Ver Cardápio
          </Link>
        </div>
      </main>
    </div>
  )
}
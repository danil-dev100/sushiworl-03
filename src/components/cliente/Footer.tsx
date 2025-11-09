import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="w-full border-t border-solid border-[#e5e0d8] dark:border-[#3a2c20] bg-[#f5f1e9] dark:bg-[#23170f] text-[#333333] dark:text-[#f5f1e9]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-[#FF6B00] text-2xl">
              <svg className="size-8" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
              </svg>
            </div>
            <span className="text-sm">© {new Date().getFullYear()} SushiWorld. Todos os direitos reservados.</span>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            <Link href="/politica-privacidade" className="text-sm hover:text-[#FF6B00] transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/politica-reembolso" className="text-sm hover:text-[#FF6B00] transition-colors">
              Política de Reembolso e Devolução
            </Link>
            <Link href="/sobre" className="text-sm hover:text-[#FF6B00] transition-colors">
              Sobre Nós
            </Link>
            <a 
              href="https://www.livroreclamacoes.pt/Inicio" 
              rel="noopener noreferrer" 
              target="_blank"
              className="text-sm hover:text-[#FF6B00] transition-colors"
            >
              Livro de Reclamações
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
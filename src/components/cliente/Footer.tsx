import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="w-full border-t border-solid border-[#e5e0d8] dark:border-[#3a2c20] bg-[#f5f1e9] dark:bg-[#23170f] text-[#333333] dark:text-[#f5f1e9]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Logo e Links */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <div className="flex items-center">
            <div className="relative h-8 w-auto">
              <Image
                src="/logo.webp/logo-nova-sushiworl-santa-iria-sem-fundo.webp"
                alt="SushiWorld"
                width={100}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            <Link href="/sobre-nos" className="text-sm hover:text-[#FF6B00] transition-colors">
              Sobre Nós
            </Link>
            <Link href="/politica-privacidade" className="text-sm hover:text-[#FF6B00] transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/politica-reembolso" className="text-sm hover:text-[#FF6B00] transition-colors">
              Reembolso e Devolução
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
        
        {/* Copyright centralizado no final */}
        <div className="border-t border-[#e5e0d8] dark:border-[#3a2c20] pt-6 mt-6">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} SushiWorld. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
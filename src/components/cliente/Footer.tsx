import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <Image
              src="/logo-nova-sushiworl-santa-iria-sem-fundo.webp"
              alt="SushiWorld Logo"
              width={120}
              height={40}
              className="h-10 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-gray-300 mb-4">
              Sushi fresco, rápido e delicioso entregue na sua casa. Ingredientes selecionados e serviço de qualidade.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
            <ul className="space-y-2">
              <li><Link href="/politica-privacidade" className="text-gray-300 hover:text-orange-400 transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/politica-cookies" className="text-gray-300 hover:text-orange-400 transition-colors">Política de Cookies</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-orange-400 transition-colors">FAQ</Link></li>
              <li><Link href="/termos" className="text-gray-300 hover:text-orange-400 transition-colors">Termos e condições</Link></li>
              <li><a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-orange-400 transition-colors">Livro de Reclamações</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <div className="space-y-2">
              <p className="text-gray-300">
                <span className="block">📞 +351 934 841 148</span>
              </p>
              <p className="text-gray-300">
                <span className="block">✉️ pedidosushiworld@gmail.com</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alérgenos Warning */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            ⚠️ <strong>Alérgenos:</strong> Alguns dos nossos produtos podem conter glúten, soja, peixe, marisco, crustáceos, ovos, sésamo e outros alérgenos.
            Em caso de dúvida, entre em contacto connosco antes de efetuar o pedido.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} SushiWorld Delivery. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
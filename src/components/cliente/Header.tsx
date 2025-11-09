'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // TODO: Substituir por estado real do carrinho
  const cartItemsCount = 0;

  const menuItems = [
    { href: '/', label: 'Início' },
    { href: '/cardapio', label: 'Cardápio' },
    { href: 'https://chefguilhermericardo.sushiworld.pt', label: 'Catering', external: true },
    { href: '/contato', label: 'Contato' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e0d8] dark:border-[#3a2c20] px-6 lg:px-10 py-3 bg-[#f5f1e9]/80 dark:bg-[#23170f]/80 backdrop-blur-sm">
      <div className="flex items-center gap-4 text-[#333333] dark:text-[#f5f1e9]">
        <Link href="/" className="flex items-center gap-4">
          <div className="text-[#FF6B00] text-2xl">
            <svg className="size-8" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
            </svg>
          </div>
          <h2 className="text-[#333333] dark:text-[#f5f1e9] text-xl font-bold tracking-tight">SushiWorld</h2>
        </Link>
      </div>

      <div className="flex flex-1 justify-end items-center gap-6">
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#333333] dark:text-[#f5f1e9] text-sm font-medium hover:text-[#FF6B00] transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-[#FF6B00] font-bold'
                    : 'text-[#333333] dark:text-[#f5f1e9] hover:text-[#FF6B00]'
                }`}
              >
                {item.label}
              </Link>
            )
          ))}
        </nav>

        {/* Right side - Login and Cart */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#FF6B00] text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span>Login</span>
          </Link>

          <Link
            href="/carrinho"
            className="relative flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#FF6B00]/20 text-[#FF6B00] gap-2 text-sm font-bold min-w-0 px-2.5 hover:bg-[#FF6B00]/30 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B00] text-white text-xs font-bold">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[#333333] dark:text-[#f5f1e9] hover:text-[#FF6B00] transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-[#f5f1e9] dark:bg-[#23170f] border-b border-[#e5e0d8] dark:border-[#3a2c20]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-[#333333] dark:text-[#f5f1e9] hover:text-[#FF6B00] transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-[#FF6B00] font-bold'
                      : 'text-[#333333] dark:text-[#f5f1e9] hover:text-[#FF6B00]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}
            <Link
              href="/login"
              className="block px-3 py-2 text-[#333333] dark:text-[#f5f1e9] hover:text-[#FF6B00] transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
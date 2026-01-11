'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface SidebarMenuProps {
  categories: Category[];
  activeSection?: string;
}

export default function SidebarMenu({ categories, activeSection = 'destaques' }: SidebarMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isCardapioPage = pathname === '/cardapio';

  const handleClick = (id: string) => {
    // Se estiver na home, redireciona para o cardápio com a seção
    if (!isCardapioPage) {
      router.push(`/cardapio#${id}`);
      return;
    }

    // Se já estiver no cardápio, faz scroll suave
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-56 xl:w-64 py-6 lg:py-8 pr-4 lg:pr-8 shrink-0">
      <div className="flex flex-col gap-1.5 bg-white dark:bg-[#3a2c20] rounded-xl p-3 lg:p-4 shadow-sm">
        {categories.map((category) => {
          const isActive = activeSection === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleClick(category.id)}
              className={`flex items-center gap-2 lg:gap-3 px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#FF6B00]/20 dark:bg-[#FF6B00]/30'
                  : 'hover:bg-[#FF6B00]/10 dark:hover:bg-[#FF6B00]/20'
              }`}
            >
              <span className={`text-base lg:text-lg ${isActive ? 'text-[#FF6B00]' : 'text-[#333333] dark:text-[#f5f1e9]'}`}>
                {category.emoji}
              </span>
              <p className={`text-xs lg:text-sm font-medium ${isActive ? 'text-[#FF6B00] font-bold' : 'text-[#333333] dark:text-[#f5f1e9]'}`}>
                {category.name.toUpperCase()}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

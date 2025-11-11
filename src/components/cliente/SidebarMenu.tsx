'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Eye, Flame, MoreHorizontal, Salad, Wine, Fish, Square, Waves, IceCream, Plus } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  emoji: string;
}

const categories: Category[] = [
  { id: 'destaques', label: 'DESTAQUES', icon: <Sparkles className="w-5 h-5" />, emoji: '⭐' },
  { id: 'combinados', label: 'COMBINADOS', icon: <Eye className="w-5 h-5" />, emoji: '🍣' },
  { id: 'hots', label: 'HOTS', icon: <Flame className="w-5 h-5" />, emoji: '🔥' },
  { id: 'entradas', label: 'ENTRADAS', icon: <MoreHorizontal className="w-5 h-5" />, emoji: '🍤' },
  { id: 'poke', label: 'POKÉ BOWL', icon: <Salad className="w-5 h-5" />, emoji: '🥗' },
  { id: 'gunkan', label: 'GUNKAN', icon: <Wine className="w-5 h-5" />, emoji: '🍥' },
  { id: 'sashimi', label: 'SASHIMI', icon: <Fish className="w-5 h-5" />, emoji: '🐟' },
  { id: 'nigiri', label: 'NIGIRI', icon: <Square className="w-5 h-5" />, emoji: '🍙' },
  { id: 'makis', label: 'MAKIS', icon: <Waves className="w-5 h-5" />, emoji: '🥢' },
  { id: 'temaki', label: 'TEMAKI', icon: <IceCream className="w-5 h-5" />, emoji: '🍦' },
];

interface SidebarMenuProps {
  activeSection?: string;
}

export default function SidebarMenu({ activeSection = 'destaques' }: SidebarMenuProps) {
  const handleClick = (id: string) => {
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
    <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-64 hidden lg:block py-8 pr-8 shrink-0">
      <div className="flex flex-col gap-2 bg-white dark:bg-[#3a2c20] rounded-xl p-4 shadow-sm">
        {categories.map((category) => {
          const isActive = activeSection === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleClick(category.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#FF6B00]/20 dark:bg-[#FF6B00]/30'
                  : 'hover:bg-[#FF6B00]/10 dark:hover:bg-[#FF6B00]/20'
              }`}
            >
              <span className={`text-lg ${isActive ? 'text-[#FF6B00]' : 'text-[#333333] dark:text-[#f5f1e9]'}`}>
                {category.emoji}
              </span>
              <p className={`text-sm font-medium ${isActive ? 'text-[#FF6B00] font-bold' : 'text-[#333333] dark:text-[#f5f1e9]'}`}>
                {category.label}
              </p>
            </button>
          );
        })}
        
        {/* Extras */}
        <button
          onClick={() => handleClick('extras')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FF6B00]/10 dark:hover:bg-[#FF6B00]/20 transition-all duration-200 mt-2 border-t border-[#e5e0d8] dark:border-[#3a2c20] pt-4"
        >
          <Plus className="w-5 h-5 text-[#333333] dark:text-[#f5f1e9]" />
          <p className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
            EXTRAS
          </p>
        </button>
        
        {/* Sobremesas */}
        <button
          onClick={() => handleClick('sobremesas')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FF6B00]/10 dark:hover:bg-[#FF6B00]/20 transition-all duration-200"
        >
          <span className="text-lg">🍰</span>
          <p className="text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
            SOBREMESAS
          </p>
        </button>
      </div>
    </aside>
  );
}


'use client';

interface MenuSidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryEmojis: Record<string, string> = {
  'Entradas': '🍱',
  'Temaki': '🍣',
  'Hossomaki': '🍙',
  'Sashimi': '🐟',
  'Poke': '🥗',
  'Gunkan': '🍚',
  'Uramaki': '🍱',
  'Nigiri': '🍣',
  'Futomaki': '🍙',
  'Hot roll': '🔥',
  'Combinados': '🎁',
  'Makis': '🍱',
  'Hots': '🔥',
  'Poke Bowl': '🥗',
};

export function MenuSidebar({ categories, selectedCategory, onSelectCategory }: MenuSidebarProps) {
  return (
    <aside className="w-64 border-r border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <h2 className="mb-6 text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
        Categorias
      </h2>
      <nav className="flex flex-col gap-2">
        <button
          onClick={() => onSelectCategory('all')}
          className={`rounded-md px-4 py-2 text-left text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#FF6B00]/10 font-bold text-[#FF6B00]'
              : 'text-[#a16b45] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]'
          }`}
        >
          📋 Todos os Produtos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`rounded-md px-4 py-2 text-left text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-[#FF6B00]/10 font-bold text-[#FF6B00]'
                : 'text-[#a16b45] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]'
            }`}
          >
            {categoryEmojis[category] || '🍽️'} {category}
          </button>
        ))}
      </nav>
    </aside>
  );
}


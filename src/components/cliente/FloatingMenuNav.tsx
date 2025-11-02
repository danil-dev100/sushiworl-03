'use client';

interface FloatingMenuNavProps {
  categories: string[];
}

export default function FloatingMenuNav({ categories }: FloatingMenuNavProps) {
  const getIconName = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Destaques': 'spark',
      'Combinados': 'visibility',
      'Hots': 'local_fire_department',
      'Entradas': 'more_horiz',
      'Poke Bowl': 'ramen_dining',
      'Gunkan': 'wine_bar',
      'Sashimi': 'set_meal',
      'Nigiri': 'rice_bowl',
      'Makis': 'sailing',
      'Temaki': 'icecream'
    };
    return iconMap[category] || 'restaurant';
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-64 hidden lg:block py-8 pr-8 shrink-0">
      <div className="flex flex-col gap-2">
        {categories.map((category) => {
          const sectionId = category.toLowerCase().replace(/\s+/g, '-');
          const isActive = category === 'Destaques'; // Destaques como ativo por padrão

          return (
            <button
              key={category}
              onClick={() => scrollToSection(sectionId)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/20 dark:bg-primary/30'
                  : 'hover:bg-primary/10 dark:hover:bg-primary/20'
              }`}
            >
              <span
                className={`material-symbols-outlined text-primary ${isActive ? 'fill-1' : ''}`}
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                {getIconName(category)}
              </span>
              <p className="text-primary text-sm font-medium">{category}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
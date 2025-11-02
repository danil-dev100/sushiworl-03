'use client';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface FloatingMenuNavProps {
  categories: Category[];
}

export default function FloatingMenuNav({ categories }: FloatingMenuNavProps) {
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
          const isActive = category.id === 'destaques'; // Destaques como ativo por padrão

          return (
            <button
              key={category.id}
              onClick={() => scrollToSection(category.id)}
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
                {category.icon}
              </span>
              <p className="text-primary text-sm font-medium">{category.name}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

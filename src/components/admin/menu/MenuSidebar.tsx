'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface MenuSidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onCategoriesChange?: (categories: string[]) => void;
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
  'Extras': '➕',
  'Bebidas': '🥤',
  'Sobremesas': '🍰',
};

const availableEmojis = ['🍽️', '🍱', '🍣', '🍙', '🐟', '🥗', '🍚', '🔥', '🎁', '🥢', '🍦', '🍤', '🥤', '🍰', '➕', '🌟', '💎', '🎉'];

export function MenuSidebar({ categories, selectedCategory, onSelectCategory, onCategoriesChange }: MenuSidebarProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍽️');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'Erro', description: 'Nome da categoria é obrigatório', variant: 'destructive' });
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      toast({ title: 'Erro', description: 'Esta categoria já existe', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          emoji: selectedEmoji,
        }),
      });

      if (response.ok) {
        // Adicionar emoji ao mapa local
        categoryEmojis[newCategoryName.trim()] = selectedEmoji;

        // Atualizar lista de categorias
        if (onCategoriesChange) {
          onCategoriesChange([...categories, newCategoryName.trim()]);
        }

        toast({ title: 'Sucesso', description: `Categoria "${newCategoryName}" criada!` });
        setShowAddDialog(false);
        setNewCategoryName('');
        setSelectedEmoji('🍽️');
      } else {
        throw new Error('Erro ao criar categoria');
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao criar categoria', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="w-64 border-r border-[#ead9cd] bg-white p-6 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
          Categorias
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAddDialog(true)}
          className="h-8 w-8 p-0 text-[#FF6B00] hover:bg-[#FF6B00]/10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
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

      {/* Dialog para adicionar categoria */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9] mb-2">
                Nome da Categoria
              </label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Sobremesas, Bebidas..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-[#f5f1e9] mb-2">
                Emoji
              </label>
              <div className="grid grid-cols-9 gap-2">
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-xl p-2 rounded-lg transition-colors ${
                      selectedEmoji === emoji
                        ? 'bg-[#FF6B00]/20 ring-2 ring-[#FF6B00]'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-[#f5f1e9] dark:bg-[#23170f] rounded-lg">
              <p className="text-sm text-[#a16b45]">
                Preview: <span className="text-lg">{selectedEmoji}</span> {newCategoryName || 'Nome da categoria'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={isLoading}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            >
              {isLoading ? 'Criando...' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}


'use client';

import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍽️');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (category: string) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/menu/categories?category=${encodeURIComponent(categoryToDelete)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Atualizar lista de categorias
        if (onCategoriesChange) {
          onCategoriesChange(categories.filter(c => c !== categoryToDelete));
        }

        // Se a categoria deletada estava selecionada, voltar para "Todos os Produtos"
        if (selectedCategory === categoryToDelete) {
          onSelectCategory('all');
        }

        toast({
          title: 'Sucesso',
          description: `Categoria "${categoryToDelete}" e ${data.deletedCount || 0} produto(s) foram excluídos.`,
        });

        setShowDeleteDialog(false);
        setCategoryToDelete(null);

        // Recarregar a página para atualizar a lista de produtos
        router.refresh();
      } else {
        throw new Error(data.error || 'Erro ao excluir categoria');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir categoria',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
          <div key={category} className="group relative">
            <button
              onClick={() => onSelectCategory(category)}
              className={`w-full rounded-md px-4 py-2 pr-10 text-left text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-[#FF6B00]/10 font-bold text-[#FF6B00]'
                  : 'text-[#a16b45] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]'
              }`}
            >
              {categoryEmojis[category] || '🍽️'} {category}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(category);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
              title={`Excluir categoria "${category}"`}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
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

      {/* Dialog para confirmar exclusão de categoria */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Categoria?</DialogTitle>
            <DialogDescription className="text-[#a16b45] dark:text-[#d4a574]">
              Tem certeza que deseja excluir a categoria <strong>&quot;{categoryToDelete}&quot;</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                ⚠️ Atenção: Esta ação não pode ser desfeita!
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                Todos os produtos desta categoria serão permanentemente excluídos do banco de dados.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setCategoryToDelete(null);
              }}
              disabled={isDeleting}
            >
              Não, Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir Tudo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}


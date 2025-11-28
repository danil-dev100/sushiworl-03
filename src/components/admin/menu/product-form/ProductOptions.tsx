'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ProductOptionDialog } from './ProductOptionDialog';

interface ProductOptionsProps {
  productId?: string;
}

export function ProductOptions({ productId }: ProductOptionsProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadOptions();
    }
  }, [productId]);

  const loadOptions = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/menu/products/${productId}/options`);
      if (response.ok) {
        const data = await response.json();
        setOptions(data.options || []);
      } else {
        console.error('Erro na resposta:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    setEditingOption(null);
    setIsDialogOpen(true);
  };

  const handleEditOption = (option: any) => {
    setEditingOption(option);
    setIsDialogOpen(true);
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!productId) return;

    setDeletingOptionId(optionId);
    try {
      const response = await fetch(
        `/api/admin/menu/products/${productId}/options/${optionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar opção');
      }

      toast.success('Opção removida com sucesso');
      loadOptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar opção');
    } finally {
      setDeletingOptionId(null);
    }
  };

  const handleSaveOption = () => {
    loadOptions();
  };

  if (!productId) {
    return (
      <div className="rounded-md border border-[#ead9cd] bg-[#fff6ed] p-6 text-center dark:border-[#4a3c30] dark:bg-[#2b160a]">
        <p className="text-sm text-[#a16b45]">
          Salve o produto primeiro para adicionar opções e complementos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Adicionais & Complementos</h3>
          <p className="text-xs text-[#a16b45]">
            Exemplo: coberturas extras, escolha de molhos, etc.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
          onClick={handleAddOption}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Opção
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF6B00]" />
          <span className="ml-2 text-sm text-[#a16b45]">Carregando opções...</span>
        </div>
      ) : options.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#ead9cd] p-6 text-center dark:border-[#4a3c30]">
          <p className="text-sm text-[#a16b45]">
            Nenhuma opção adicionada ainda
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between rounded-md border border-[#ead9cd] p-4 dark:border-[#4a3c30]"
            >
              <div>
                <h4 className="font-semibold text-[#333333] dark:text-[#f5f1e9]">
                  {option.name}
                </h4>
                <p className="text-xs text-[#a16b45]">
                  {option.type === 'REQUIRED' ? 'Obrigatório' : 'Opcional'} •{' '}
                  {option.choices?.length || 0} escolhas •{' '}
                  {option.displayAt === 'SITE' ? 'Exibir no site' : 'Exibir no carrinho'}
                  {option.isPaid && option.basePrice > 0 && ` • €${option.basePrice.toFixed(2)}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditOption(option)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={deletingOptionId === option.id}
                    >
                      {deletingOptionId === option.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso removerá permanentemente a
                        opção &quot;{option.name}&quot; e todas as suas escolhas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteOption(option.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductOptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        productId={productId}
        option={editingOption}
        onSave={handleSaveOption}
      />
    </div>
  );
}

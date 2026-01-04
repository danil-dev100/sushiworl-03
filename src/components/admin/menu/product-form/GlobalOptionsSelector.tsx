'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalOption {
  id: string;
  name: string;
  type: string;
  displayAt: string;
  isActive: boolean;
  choices: { id: string; name: string }[];
}

interface GlobalOptionsSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  categoryId?: string;
  onAssigned: () => void;
}

export function GlobalOptionsSelector({
  open,
  onOpenChange,
  productId,
  categoryId,
  onAssigned
}: GlobalOptionsSelectorProps) {
  const [availableOptions, setAvailableOptions] = useState<GlobalOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableOptions();
    }
  }, [open]);

  const loadAvailableOptions = async () => {
    setIsLoading(true);
    try {
      console.log('[GlobalOptionsSelector] 📡 Buscando opções globais disponíveis...');

      // Buscar todas as opções globais ativas
      const response = await fetch('/api/global-options');

      if (!response.ok) {
        throw new Error('Erro ao buscar opções globais');
      }

      const data = await response.json();
      console.log('[GlobalOptionsSelector] ✅ Opções recebidas:', data.options.length);

      setAvailableOptions(data.options || []);
    } catch (error) {
      console.error('[GlobalOptionsSelector] ❌ Erro:', error);
      toast.error('Erro ao carregar opções globais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
  };

  const handleAssign = async () => {
    if (selectedOptions.size === 0) {
      toast.error('Selecione pelo menos uma opção global');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[GlobalOptionsSelector] 🚀 Atribuindo opções ao produto...');

      // Criar atribuições para cada opção selecionada
      const promises = Array.from(selectedOptions).map(globalOptionId =>
        fetch(`/api/global-options/${globalOptionId}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentType: 'PRODUCT',
            targetId: productId,
            minSelection: 0,
            maxSelection: 1,
            allowMultiple: false,
            sortOrder: 0
          })
        })
      );

      const results = await Promise.all(promises);

      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        toast.error(`${failedCount} atribuições falharam`);
      } else {
        toast.success(`${selectedOptions.size} opções atribuídas com sucesso!`);
        onAssigned();
        onOpenChange(false);
        setSelectedOptions(new Set());
      }

    } catch (error) {
      console.error('[GlobalOptionsSelector] ❌ Erro:', error);
      toast.error('Erro ao atribuir opções globais');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#FF6B00]">
            Adicionar Opções Globais
          </DialogTitle>
          <p className="text-sm text-[#a16b45]">
            Selecione as opções globais que deseja aplicar a este produto
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
          </div>
        ) : availableOptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#a16b45]">
              Nenhuma opção global disponível.
            </p>
            <p className="text-sm text-[#a16b45] mt-2">
              Crie opções globais em "Cardápio → Opções Globais"
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-start gap-3 p-4 border border-[#ead9cd] dark:border-[#4a3c30] rounded-lg hover:bg-[#f5f1e9]/50 dark:hover:bg-[#2a1e14]/50 transition-colors"
              >
                <Checkbox
                  id={`option-${option.id}`}
                  checked={selectedOptions.has(option.id)}
                  onCheckedChange={() => handleToggleOption(option.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`option-${option.id}`}
                    className="font-medium text-[#333333] dark:text-[#f5f1e9] cursor-pointer"
                  >
                    {option.name}
                  </label>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] rounded">
                      {option.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                      {option.displayAt === 'SITE' ? 'Site (Popup)' : 'Carrinho'}
                    </span>
                    <span className="text-xs text-[#a16b45]">
                      {option.choices.length} escolhas
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[#ead9cd] dark:border-[#4a3c30]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={isSubmitting || selectedOptions.size === 0}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atribuindo...
              </>
            ) : (
              `Atribuir ${selectedOptions.size > 0 ? `(${selectedOptions.size})` : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

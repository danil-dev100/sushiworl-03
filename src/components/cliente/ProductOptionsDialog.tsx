'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ProductOption {
  id: string;
  name: string;
  type: 'REQUIRED' | 'OPTIONAL';
  description?: string | null;
  minSelection: number;
  maxSelection: number;
  allowMultiple: boolean;
  isPaid: boolean;
  basePrice: number;
  choices: {
    id: string;
    name: string;
    price: number;
    isDefault: boolean;
  }[];
}

interface ProductOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
  };
  options: ProductOption[];
  onAddToCart: (selectedOptions: any[], quantity: number) => void;
}

export function ProductOptionsDialog({
  open,
  onOpenChange,
  product,
  options,
  onAddToCart,
}: ProductOptionsDialogProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar opções padrão (apenas opções obrigatórias e NÃO pagas)
  useEffect(() => {
    if (open) {
      const defaults: Record<string, string[]> = {};
      options.forEach((option) => {
        // Só pré-selecionar se for opção REQUIRED e NÃO paga
        if (option.type === 'REQUIRED' && !option.isPaid) {
          const defaultChoices = option.choices.filter((c) => c.isDefault);
          if (defaultChoices.length > 0) {
            defaults[option.id] = defaultChoices.map((c) => c.id);
          }
        }
        // Opções OPTIONAL ou pagas começam desmarcadas
      });
      setSelectedOptions(defaults);
      setQuantity(1);
    }
  }, [open, options]);

  const handleOptionChange = (optionId: string, choiceId: string, isMultiple: boolean) => {
    setSelectedOptions((prev) => {
      const current = prev[optionId] || [];
      
      if (isMultiple) {
        // Toggle para múltiplas seleções
        if (current.includes(choiceId)) {
          return { ...prev, [optionId]: current.filter((id) => id !== choiceId) };
        } else {
          return { ...prev, [optionId]: [...current, choiceId] };
        }
      } else {
        // Substituir para seleção única
        return { ...prev, [optionId]: [choiceId] };
      }
    });
  };

  const calculateTotal = () => {
    let total = product.price * quantity;

    options.forEach((option) => {
      const selected = selectedOptions[option.id] || [];
      
      // Adicionar preço base se a opção é paga
      if (option.isPaid && selected.length > 0) {
        total += option.basePrice * quantity;
      }

      // Adicionar preço das escolhas
      selected.forEach((choiceId) => {
        const choice = option.choices.find((c) => c.id === choiceId);
        if (choice) {
          total += choice.price * quantity;
        }
      });
    });

    return total;
  };

  const canSubmit = () => {
    // Verificar se todas as opções obrigatórias foram preenchidas
    return options.every((option) => {
      if (option.type === 'REQUIRED') {
        const selected = selectedOptions[option.id] || [];
        return selected.length >= option.minSelection && selected.length <= option.maxSelection;
      }
      return true;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);

    const formattedOptions = options
      .filter((option) => selectedOptions[option.id]?.length > 0)
      .map((option) => ({
        optionId: option.id,
        optionName: option.name,
        choices: selectedOptions[option.id].map((choiceId) => {
          const choice = option.choices.find((c) => c.id === choiceId)!;
          return {
            choiceId: choice.id,
            choiceName: choice.name,
            price: choice.price + (option.isPaid ? option.basePrice : 0),
          };
        }),
      }));

    onAddToCart(formattedOptions, quantity);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#FF6B00]">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem e Descrição */}
          <div className="flex gap-4">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#a16b45]">{product.description}</p>
              <p className="mt-2 text-lg font-bold text-[#333333]">
                €{product.price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Opções */}
          {options.map((option) => (
            <div key={option.id} className="space-y-3 rounded-lg border border-[#ead9cd] p-4">
              <div>
                <h3 className="font-semibold text-[#333333]">
                  {option.name}
                  {option.type === 'REQUIRED' && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </h3>
                {option.description && (
                  <p className="text-xs text-[#a16b45]">{option.description}</p>
                )}
                {option.isPaid && option.basePrice > 0 && (
                  <p className="text-xs font-semibold text-[#FF6B00]">
                    +€{option.basePrice.toFixed(2)}
                  </p>
                )}
              </div>

              {option.maxSelection === 1 ? (
                // Radio buttons para seleção única
                <RadioGroup
                  value={selectedOptions[option.id]?.[0] || ''}
                  onValueChange={(value) => handleOptionChange(option.id, value, false)}
                >
                  {option.choices.map((choice) => (
                    <div key={choice.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={choice.id} id={choice.id} />
                      <Label htmlFor={choice.id} className="flex-1 cursor-pointer">
                        <span>{choice.name}</span>
                        {choice.price > 0 && (
                          <span className="ml-2 text-sm text-[#FF6B00]">
                            +€{choice.price.toFixed(2)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                // Checkboxes para múltiplas seleções
                <div className="space-y-2">
                  {option.choices.map((choice) => (
                    <div key={choice.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={choice.id}
                        checked={selectedOptions[option.id]?.includes(choice.id) || false}
                        onCheckedChange={() =>
                          handleOptionChange(option.id, choice.id, true)
                        }
                      />
                      <Label htmlFor={choice.id} className="flex-1 cursor-pointer">
                        <span>{choice.name}</span>
                        {choice.price > 0 && (
                          <span className="ml-2 text-sm text-[#FF6B00]">
                            +€{choice.price.toFixed(2)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Quantidade */}
          <div className="flex items-center justify-between rounded-lg border border-[#ead9cd] p-4">
            <span className="font-semibold text-[#333333]">Quantidade</span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-bold">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total e Botão */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#a16b45]">Total</p>
              <p className="text-2xl font-bold text-[#FF6B00]">
                €{calculateTotal().toFixed(2)}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                `Adicionar ao Carrinho`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


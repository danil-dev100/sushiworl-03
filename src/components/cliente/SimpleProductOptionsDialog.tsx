'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProductOption {
  id: string;
  name: string;
  type: 'REQUIRED' | 'OPTIONAL';
  description?: string | null;
  isPaid: boolean;
  basePrice: number;
  choices: {
    id: string;
    name: string;
    price: number;
  }[];
}

interface SimpleProductOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
  };
  options: ProductOption[];
  onAddToCart: (withOptions: boolean) => void;
}

export function SimpleProductOptionsDialog({
  open,
  onOpenChange,
  product,
  options,
  onAddToCart,
}: SimpleProductOptionsDialogProps) {
  if (!open || options.length === 0) return null;

  // Para simplicidade, vamos mostrar apenas a primeira opção
  const option = options[0];
  const totalPrice = option.isPaid ? option.basePrice + (option.choices[0]?.price || 0) : 0;

  const handleAccept = () => {
    onAddToCart(true);
    onOpenChange(false);
  };

  const handleReject = () => {
    onAddToCart(false);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-[#f5f1e9] dark:bg-[#23170f] p-6 text-center shadow-lg relative">
        {/* Botão Fechar */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-[#333333] dark:text-[#f5f1e9] hover:text-[#FF6B00] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Título */}
        <h3 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">
          Deseja adicionar um opcional?
        </h3>

        {/* Descrição */}
        <p className="mt-4 text-base text-[#333333]/80 dark:text-[#f5f1e9]/80">
          {option.name} por apenas €{totalPrice.toFixed(2)}?
        </p>

        {option.description && (
          <p className="mt-2 text-sm text-[#a16b45]">
            {option.description}
          </p>
        )}

        {/* Botões */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleAccept}
            className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-[#FF6B00] text-white text-base font-bold hover:opacity-90 transition-opacity"
          >
            Aceitar Opcional (+€{totalPrice.toFixed(2)})
          </button>
          <button
            onClick={handleReject}
            className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-[#FF6B00]/20 dark:bg-white/20 text-[#FF6B00] dark:text-white text-base font-bold hover:bg-[#FF6B00]/30 dark:hover:bg-white/30 transition-colors"
          >
            Adicionar sem Opcional
          </button>
        </div>
      </div>
    </div>
  );
}


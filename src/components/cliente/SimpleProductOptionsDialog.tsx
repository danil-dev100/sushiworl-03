'use client';

import { X, Sparkles, Check } from 'lucide-react';

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
  if (!open || options.length === 0) {
    if (open && options.length === 0) {
      console.log('[SimpleDialog] ⚠️ Dialog aberto mas sem opções!');
    }
    return null;
  }

  console.log('[SimpleDialog] 🎨 Dialog renderizado');
  console.log('[SimpleDialog] Produto:', product.name);
  console.log('[SimpleDialog] Opções disponíveis:', options.length);
  console.log('[SimpleDialog] Primeira opção:', options[0].name, `(€${options[0].basePrice})`);

  const option = options[0];
  const totalPrice = option.isPaid ? option.basePrice + (option.choices[0]?.price || 0) : 0;

  const handleAccept = () => {
    console.log('[SimpleDialog] ✅ Cliente aceitou opcional');
    console.log('[SimpleDialog] Valor adicional: €' + totalPrice.toFixed(2));
    onAddToCart(true);
    onOpenChange(false);
  };

  const handleReject = () => {
    console.log('[SimpleDialog] ❌ Cliente recusou opcional');
    onAddToCart(false);
    onOpenChange(false);
  };

  // Texto persuasivo baseado no tipo de opcional
  const getPersuasiveText = () => {
    const name = option.name.toLowerCase();
    if (name.includes('brasea')) return 'Eleve sua experiência com um toque especial de chef!';
    if (name.includes('queijo') || name.includes('phila')) return 'A cremosidade perfeita para complementar seu pedido!';
    if (name.includes('molho')) return 'O sabor extra que faz toda a diferença!';
    return 'A escolha favorita dos nossos clientes!';
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#f5f1e9] dark:bg-[#23170f] p-6 text-center shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Recomendado
        </div>

        {/* Fechar */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 text-[#333333]/50 dark:text-[#f5f1e9]/50 hover:text-[#FF6B00] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Título */}
        <h3 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9] mt-2">
          Turbine seu pedido!
        </h3>

        {/* Texto persuasivo */}
        <p className="mt-3 text-sm text-[#8b5e3c] dark:text-[#f5f1e9]/70">
          {getPersuasiveText()}
        </p>

        {/* Preço destaque */}
        <div className="mt-4 py-3 px-4 bg-white/50 dark:bg-black/20 rounded-lg">
          <p className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
            {option.name}
          </p>
          <p className="text-2xl font-black text-[#FF6B00] mt-1">
            +€{totalPrice.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Botões */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleAccept}
            className="w-full flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-12 px-4 bg-[#FF6B00] text-white text-base font-bold hover:bg-[#ff7f1f] transition-colors shadow-lg shadow-[#FF6B00]/30"
          >
            <Check className="h-5 w-5" />
            Sim, quero! (+€{totalPrice.toFixed(2).replace('.', ',')})
          </button>
          <button
            onClick={handleReject}
            className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 px-4 border-2 border-[#FF6B00]/30 text-[#FF6B00] dark:text-[#f5f1e9] text-sm font-medium hover:bg-[#FF6B00]/10 transition-colors"
          >
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Clock } from 'lucide-react';
import { sanitizeHtml } from '@/lib/security';
import { useCart } from '@/contexts/CartContext';
import { SimpleProductOptionsDialog } from './SimpleProductOptionsDialog';
import { toast } from 'sonner';

interface ProductCardProps {
  productId: string;
  name: string;
  description: string;
  price: string;
  discountPrice?: string;
  imageUrl: string;
  status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  outOfStock?: boolean;
  storeStatus?: {
    isOpen: boolean;
    message: string | null;
  };
}

export default function ProductCard({
  productId,
  name,
  description,
  price,
  discountPrice,
  imageUrl,
  status = 'AVAILABLE',
  outOfStock = false,
  storeStatus,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const priceNumber = parseFloat(price.replace('€', '').replace(',', '.'));

  const handleAddToCart = async () => {
    // Verificar se a loja está aberta
    if (storeStatus && !storeStatus.isOpen) {
      toast.error(storeStatus.message || 'Lamentamos mas não estamos abertos agora.', {
        duration: 5000,
        icon: <Clock className="h-5 w-5" />,
      });
      return;
    }

    setIsLoadingOptions(true);
    try {
      const response = await fetch(`/api/products/${productId}/options`);

      if (response.ok) {
        const data = await response.json();
        const activeOptions = data.options.filter((opt: any) =>
          opt.isActive && opt.displayAt === 'SITE'
        );

        if (activeOptions.length > 0) {
          setProductOptions(activeOptions);
          setIsDialogOpen(true);
        } else {
          addItem({
            productId,
            name,
            price: priceNumber,
            quantity: 1,
            image: imageUrl,
          });
        }
      } else {
        addItem({
          productId,
          name,
          price: priceNumber,
          quantity: 1,
          image: imageUrl,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar opções:', error);
      addItem({
        productId,
        name,
        price: priceNumber,
        quantity: 1,
        image: imageUrl,
      });
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleAddWithOptions = (withOptions: boolean) => {
    let finalPrice = priceNumber;
    let selectedOptions: any[] = [];

    if (withOptions && productOptions.length > 0) {
      const option = productOptions[0];
      const totalOptionPrice = option.isPaid ? option.basePrice + (option.choices[0]?.price || 0) : 0;
      finalPrice += totalOptionPrice;
      
      selectedOptions = [{
        optionId: option.id,
        optionName: option.name,
        choices: [{
          choiceId: option.choices[0]?.id || '',
          choiceName: option.choices[0]?.name || option.name,
          price: totalOptionPrice,
        }],
      }];
    }

    addItem({
      productId,
      name: withOptions ? `${name} (${productOptions[0]?.name})` : name,
      price: finalPrice,
      quantity: 1,
      image: imageUrl,
      selectedOptions: withOptions ? selectedOptions : undefined,
    });
  };

  const isAvailable = !outOfStock;
  const availabilityText = isAvailable ? 'Disponível' : 'Esgotado';

  const altText = `${name} - ${description}`;

  return (
    <div className="flex flex-col group bg-white/50 dark:bg-black/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg mb-4 overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-col flex-grow">
        <h3 className="font-bold text-[#FF6B00] text-lg">
          {sanitizeHtml(name)}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${isAvailable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {availabilityText}
          </span>
        </div>
        <p
          className="text-price/70 dark:text-background-light/70 text-sm mt-1 mb-3 flex-grow"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
        />
        <div className="flex items-center gap-2">
          <p className="text-price dark:text-background-light text-lg font-bold">
            {price}
          </p>
          {discountPrice && (
            <p className="text-price-discount text-sm font-normal line-through">
              {discountPrice}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={isLoadingOptions || !isAvailable}
        className="mt-4 w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoadingOptions ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : !isAvailable ? (
          'Esgotado'
        ) : (
          'Adicionar'
        )}
      </button>

      {/* Dialog de Opções Simples */}
      <SimpleProductOptionsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={{
          id: productId,
          name,
          price: priceNumber,
        }}
        options={productOptions}
        onAddToCart={handleAddWithOptions}
      />
    </div>
  );
}
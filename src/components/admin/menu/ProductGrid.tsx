'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Edit, Copy, EyeOff, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  category: string;
  imageUrl: string;
  status: string;
  isVisible: boolean;
  isFeatured: boolean;
  isTopSeller: boolean;
  outOfStock: boolean;
  availableUntil: Date | null;
  isHot: boolean;
  isHalal: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  isDairyFree: boolean;
  isRaw: boolean;
  isGlutenFree: boolean;
  isNutFree: boolean;
  ingredients: string | null;
  additives: string | null;
  allergens: string[];
  tags: string[];
  nutritionPer: string | null;
  calories: number | null;
  carbs: number | null;
  totalFat: number | null;
  protein: number | null;
  sugar: number | null;
  salt: number | null;
  orderCount: number;
  productOptions?: any[];
};

interface ProductGridProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onProductsChange: (products: Product[]) => void;
}

export function ProductGrid({ products, onEditProduct, onProductsChange }: ProductGridProps) {
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/menu/products/${product.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !product.isVisible }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar visibilidade');

      const updatedProducts = products.map((p) =>
        p.id === product.id ? { ...p, isVisible: !p.isVisible } : p
      );
      onProductsChange(updatedProducts);

      toast.success(
        product.isVisible ? 'Produto ocultado com sucesso' : 'Produto visível novamente'
      );
    } catch (error) {
      toast.error('Erro ao atualizar visibilidade do produto');
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/menu/products/${product.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao duplicar produto');

      const { product: newProduct } = await response.json();
      onProductsChange([newProduct, ...products]);

      toast.success('Produto duplicado com sucesso');
    } catch (error) {
      toast.error('Erro ao duplicar produto');
    }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      const response = await fetch(`/api/admin/menu/products/${deleteProductId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao remover produto');

      const updatedProducts = products.filter((p) => p.id !== deleteProductId);
      onProductsChange(updatedProducts);

      toast.success('Produto removido com sucesso');
    } catch (error) {
      toast.error('Erro ao remover produto');
    } finally {
      setDeleteProductId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-[#ead9cd] dark:border-[#4a3c30]">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">
            Nenhum produto encontrado
          </p>
          <p className="mt-1 text-sm text-[#a16b45]">
            Adicione produtos ao cardápio para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 @container sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-[#ead9cd] bg-white shadow-sm transition-all hover:shadow-xl dark:border-[#4a3c30] dark:bg-[#2a1e14]"
          >
            {/* Ações */}
            <div className="absolute right-2 top-2 z-10 flex flex-col gap-2 rounded-lg bg-black/50 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEditProduct(product)}
                className="text-white hover:text-[#FF6B00]"
                title="Editar"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDuplicate(product)}
                className="text-white hover:text-[#FF6B00]"
                title="Duplicar"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleToggleVisibility(product)}
                className="text-white hover:text-[#FF6B00]"
                title={product.isVisible ? 'Ocultar' : 'Mostrar'}
              >
                {product.isVisible ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setDeleteProductId(product.id)}
                className="text-white hover:text-red-500"
                title="Remover"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {/* Imagem */}
            <div className="relative aspect-square w-full">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
              {!product.isVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-sm font-bold text-white">Oculto</span>
                </div>
              )}
              {product.outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/60">
                  <span className="text-sm font-bold text-white">Fora de Estoque</span>
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="p-4">
              <h3 className="font-bold text-[#FF6B00]">{product.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                {product.discountPrice ? (
                  <>
                    <p className="text-sm text-[#bfbfbf] line-through">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-sm font-bold text-[#333333] dark:text-[#f5f1e9]">
                      {formatPrice(product.discountPrice)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[#333333] dark:text-[#f5f1e9]">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-[#a16b45]">SKU: {product.sku}</p>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      product.outOfStock
                        ? 'bg-red-500'
                        : product.isVisible
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      product.outOfStock
                        ? 'text-red-600'
                        : product.isVisible
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {product.outOfStock
                      ? 'Fora de Estoque'
                      : product.isVisible
                      ? 'Disponível'
                      : 'Oculto'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente do
              cardápio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


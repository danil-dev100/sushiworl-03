'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProductBasicInfo } from './product-form/ProductBasicInfo';
import { ProductDetails } from './product-form/ProductDetails';
import { ProductNutrition } from './product-form/ProductNutrition';
import { ProductOptions } from './product-form/ProductOptions';
import { ProductAvailability } from './product-form/ProductAvailability';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(300).optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  discountPrice: z.number().min(0).optional().nullable(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  imageUrl: z.string().min(1, 'Imagem é obrigatória (faça upload ou insira URL)'),
  ogImageUrl: z.string().optional().nullable(),
  ogDescription: z.string().max(300).optional().nullable(),
  
  // Status
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isTopSeller: z.boolean().default(false),
  outOfStock: z.boolean().default(false),
  availableUntil: z.string().optional().nullable(),
  
  // Configurações
  isHot: z.boolean().default(false),
  isHalal: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isVegetarian: z.boolean().default(false),
  isDairyFree: z.boolean().default(false),
  isRaw: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isNutFree: z.boolean().default(false),
  
  // Detalhes
  ingredients: z.string().max(2000).optional().nullable(),
  additives: z.string().max(2000).optional().nullable(),
  allergens: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  
  // Nutrição
  nutritionPer: z.enum(['PER_SERVING', 'PER_100G']).optional().nullable(),
  calories: z.number().min(0).optional().nullable(),
  carbs: z.number().min(0).optional().nullable(),
  totalFat: z.number().min(0).optional().nullable(),
  protein: z.number().min(0).optional().nullable(),
  sugar: z.number().min(0).optional().nullable(),
  salt: z.number().min(0).optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
  categories: string[];
  onSave: () => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSave,
}: ProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      price: 0,
      discountPrice: null,
      category: categories[0] || '',
      imageUrl: '',
      ogImageUrl: null,
      ogDescription: null,
      isVisible: true,
      isFeatured: false,
      isTopSeller: false,
      outOfStock: false,
      availableUntil: null,
      isHot: false,
      isHalal: false,
      isVegan: false,
      isVegetarian: false,
      isDairyFree: false,
      isRaw: false,
      isGlutenFree: false,
      isNutFree: false,
      ingredients: null,
      additives: null,
      allergens: [],
      tags: [],
      nutritionPer: null,
      calories: null,
      carbs: null,
      totalFat: null,
      protein: null,
      sugar: null,
      salt: null,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        price: product.price,
        discountPrice: product.discountPrice,
        category: product.category,
        imageUrl: product.imageUrl,
        ogImageUrl: product.ogImageUrl,
        ogDescription: product.ogDescription,
        isVisible: product.isVisible,
        isFeatured: product.isFeatured,
        isTopSeller: product.isTopSeller,
        outOfStock: product.outOfStock,
        availableUntil: product.availableUntil
          ? new Date(product.availableUntil).toISOString().split('T')[0]
          : null,
        isHot: product.isHot,
        isHalal: product.isHalal,
        isVegan: product.isVegan,
        isVegetarian: product.isVegetarian,
        isDairyFree: product.isDairyFree,
        isRaw: product.isRaw,
        isGlutenFree: product.isGlutenFree,
        isNutFree: product.isNutFree,
        ingredients: product.ingredients,
        additives: product.additives,
        allergens: product.allergens || [],
        tags: product.tags || [],
        nutritionPer: product.nutritionPer,
        calories: product.calories,
        carbs: product.carbs,
        totalFat: product.totalFat,
        protein: product.protein,
        sugar: product.sugar,
        salt: product.salt,
      });
    } else {
      form.reset();
    }
  }, [product, form]);

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      const url = product
        ? `/api/admin/menu/products/${product.id}`
        : '/api/admin/menu/products';
      
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar produto');
      }

      toast.success(product ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso');
      onSave();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar produto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#FF6B00]">
            {product ? 'Editar Produto' : 'Adicionar Produto'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do produto. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrição</TabsTrigger>
                <TabsTrigger value="options">Opções</TabsTrigger>
                <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <ProductBasicInfo form={form} categories={categories} />
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <ProductDetails form={form} />
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-4">
                <ProductNutrition form={form} />
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <ProductOptions productId={product?.id} />
              </TabsContent>

              <TabsContent value="availability" className="space-y-4">
                <ProductAvailability form={form} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Produto'
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}


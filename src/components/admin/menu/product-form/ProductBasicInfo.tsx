'use client';

import { useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ProductBasicInfoProps {
  form: UseFormReturn<any>;
  categories: string[];
}

export function ProductBasicInfo({ form, categories }: ProductBasicInfoProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/menu/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const { imageUrl } = await response.json();
      form.setValue('imageUrl', imageUrl);
      toast.success('Imagem enviada com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    form.setValue('imageUrl', '');
  };

  const currentImageUrl = form.watch('imageUrl');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: ENT001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Produto *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Gyoza (5 un.)" {...field} maxLength={100} />
            </FormControl>
            <FormDescription>Máximo 100 caracteres</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field}) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descrição do produto..."
                {...field}
                value={field.value || ''}
                maxLength={300}
                rows={3}
              />
            </FormControl>
            <FormDescription>Máximo 300 caracteres</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço (€) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discountPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço com Desconto (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="imageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Imagem do Produto *</FormLabel>
            <div className="space-y-3">
              {/* Preview da imagem */}
              {currentImageUrl && (
                <div className="relative aspect-square w-48 overflow-hidden rounded-lg border border-[#ead9cd]">
                  <Image
                    src={currentImageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!currentImageUrl && (
                <>
                  {/* Upload de arquivo */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Fazer Upload da Imagem
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Separador */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#ead9cd]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-[#a16b45]">Ou</span>
                    </div>
                  </div>

                  {/* Campo URL manual */}
                  <div className="space-y-2">
                    <FormControl>
                      <Input
                        placeholder="Insira uma URL da imagem..."
                        {...field}
                        disabled={isUploading}
                      />
                    </FormControl>
                  </div>
                </>
              )}
            </div>
            <FormDescription>
              {currentImageUrl 
                ? 'Imagem carregada. Clique no X para remover e adicionar outra.'
                : 'Faça upload de uma imagem ou insira uma URL. Formatos: PNG, JPEG, WEBP (máx. 5MB)'
              }
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Visível no site</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-2 rounded-lg border border-[#ead9cd] bg-[#faf8f5] p-3">
          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        form.setValue('featuredOrder', null);
                      }
                    }}
                  />
                </FormControl>
                <div className="flex-1 space-y-1 leading-none">
                  <FormLabel>Aparecer em Destaques</FormLabel>
                  <FormDescription className="text-sm">
                    Produto aparecerá na seção "Destaques" da página inicial
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch('isFeatured') && (
            <FormField
              control={form.control}
              name="featuredOrder"
              render={({ field }) => (
                <FormItem className="ml-7">
                  <FormLabel>Posição em Destaques</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'null' ? null : parseInt(value))}
                    value={field.value?.toString() || 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a posição" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Sem posição definida</SelectItem>
                      <SelectItem value="1">Posição 1</SelectItem>
                      <SelectItem value="2">Posição 2</SelectItem>
                      <SelectItem value="3">Posição 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Escolha a posição (1, 2 ou 3). Se escolher uma posição já ocupada, este produto substituirá o item atual dessa posição.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-[#ead9cd] bg-[#faf8f5] p-3">
          <FormField
            control={form.control}
            name="isTopSeller"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        form.setValue('bestSellerOrder', null);
                      }
                    }}
                  />
                </FormControl>
                <div className="flex-1 space-y-1 leading-none">
                  <FormLabel>Aparecer em Mais Vendidos</FormLabel>
                  <FormDescription className="text-sm">
                    Produto aparecerá na seção "Mais Vendidos" da página inicial
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch('isTopSeller') && (
            <FormField
              control={form.control}
              name="bestSellerOrder"
              render={({ field }) => (
                <FormItem className="ml-7">
                  <FormLabel>Posição em Mais Vendidos</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'null' ? null : parseInt(value))}
                    value={field.value?.toString() || 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a posição" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Sem posição definida</SelectItem>
                      <SelectItem value="1">Posição 1</SelectItem>
                      <SelectItem value="2">Posição 2</SelectItem>
                      <SelectItem value="3">Posição 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Escolha a posição (1, 2 ou 3). Se escolher uma posição já ocupada, este produto substituirá o item atual dessa posição.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="outOfStock"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Esgotado</FormLabel>
                <FormDescription className="text-sm">
                  Marque se o produto está temporariamente indisponível
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}


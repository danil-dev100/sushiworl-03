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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductAvailabilityProps {
  form: UseFormReturn<any>;
}

export function ProductAvailability({ form }: ProductAvailabilityProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      form.setValue('ogImageUrl', imageUrl);
      toast.success('Imagem OG enviada com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="outOfStock"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Fora de Estoque</FormLabel>
              <FormDescription>
                Marque se o produto está temporariamente indisponível
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="availableUntil"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Disponível Até</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={field.value || ''}
                min={new Date().toISOString().split('T')[0]}
              />
            </FormControl>
            <FormDescription>
              Deixe em branco para disponibilidade indeterminada. O produto ficará
              automaticamente indisponível após esta data.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-md border border-[#ead9cd] bg-[#fff6ed] p-4 dark:border-[#4a3c30] dark:bg-[#2b160a]">
        <h3 className="mb-2 text-sm font-semibold text-[#FF6B00]">
          Imagem para Redes Sociais
        </h3>
        <p className="mb-3 text-xs text-[#a16b45]">
          Personalize como o produto aparece quando compartilhado nas redes sociais
        </p>

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="ogImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagem OG</FormLabel>
                <div className="space-y-2">
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
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Ou insira uma URL..."
                      {...field}
                      value={field.value || ''}
                      disabled={isUploading}
                    />
                  </FormControl>
                </div>
                <FormDescription className="text-xs">
                  Se não informado, usará a imagem principal do produto
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ogDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição OG</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Descrição para redes sociais..."
                    {...field}
                    value={field.value || ''}
                    maxLength={300}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Se não informado, usará a descrição principal do produto
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}


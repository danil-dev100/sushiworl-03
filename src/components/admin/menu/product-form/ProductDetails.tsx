'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useState } from 'react';

const ALLERGENS = [
  'Leite',
  'Frutos de casca rija',
  'Ovos',
  'Amendoins',
  'Peixe',
  'Trigo',
  'Marisco',
  'Soja',
];

interface ProductDetailsProps {
  form: UseFormReturn<any>;
}

export function ProductDetails({ form }: ProductDetailsProps) {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue(
      'tags',
      currentTags.filter((_: string, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Configurações do Item</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="isHot"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">🔥 Quente</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isHalal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">☪️ Halal</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isVegan"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">🌱 Vegan</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isVegetarian"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">🥬 Vegetariano</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isDairyFree"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">🥛 Sem Laticínios</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isRaw"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">🐟 Cru</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isGlutenFree"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">🌾 Sem Glúten</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isNutFree"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">🥜 Sem Nozes</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="ingredients"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ingredientes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Liste os ingredientes..."
                {...field}
                value={field.value || ''}
                maxLength={2000}
                rows={4}
              />
            </FormControl>
            <FormDescription>Máximo 2000 caracteres</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="additives"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Aditivos</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Liste os aditivos..."
                {...field}
                value={field.value || ''}
                maxLength={2000}
                rows={3}
              />
            </FormControl>
            <FormDescription>Máximo 2000 caracteres</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="allergens"
        render={() => (
          <FormItem>
            <FormLabel>Alérgenos</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              {ALLERGENS.map((allergen) => (
                <FormField
                  key={allergen}
                  control={form.control}
                  name="allergens"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(allergen)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(
                              checked
                                ? [...current, allergen]
                                : current.filter((value: string) => value !== allergen)
                            );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">{allergen}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags do Produto</FormLabel>
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-md bg-[#FF6B00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6B00]/90"
              >
                Adicionar
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(field.value || []).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}


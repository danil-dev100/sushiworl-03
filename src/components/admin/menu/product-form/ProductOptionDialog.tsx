'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

const optionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(80),
  type: z.enum(['REQUIRED', 'OPTIONAL']),
  description: z.string().max(150).optional().nullable(),
  minSelection: z.coerce.number().min(0).default(0),
  maxSelection: z.coerce.number().min(1).default(1),
  allowMultiple: z.boolean().default(false),
  displayAt: z.enum(['SITE', 'CART']).default('CART'),
  isPaid: z.boolean().default(false),
  basePrice: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

type OptionFormData = z.infer<typeof optionSchema>;

interface Choice {
  id?: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
}

interface ProductOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  option: any | null;
  onSave: () => void;
}

export function ProductOptionDialog({
  open,
  onOpenChange,
  productId,
  option,
  onSave,
}: ProductOptionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);

  const form = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      name: '',
      type: 'OPTIONAL',
      description: '',
      minSelection: 0,
      maxSelection: 1,
      allowMultiple: false,
      displayAt: 'CART',
      isPaid: false,
      basePrice: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (option) {
      form.reset({
        name: option.name,
        type: option.type,
        description: option.description || '',
        minSelection: option.minSelection,
        maxSelection: option.maxSelection,
        allowMultiple: option.allowMultiple,
        displayAt: option.displayAt,
        isPaid: option.isPaid || false,
        basePrice: option.basePrice || 0,
        isActive: option.isActive,
        sortOrder: option.sortOrder,
      });
      setChoices(option.choices || []);
    } else {
      form.reset();
      setChoices([]);
    }
  }, [option, form]);

  const isPaidValue = form.watch('isPaid');

  const addChoice = () => {
    setChoices([
      ...choices,
      { name: '', price: 0, isDefault: false, isActive: true },
    ]);
  };

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  const updateChoice = (index: number, field: keyof Choice, value: any) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], [field]: value };
    setChoices(updated);
  };

  const onSubmit = async (data: OptionFormData) => {
    if (choices.length === 0) {
      toast.error('Adicione pelo menos uma escolha');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = option
        ? `/api/admin/menu/products/${productId}/options/${option.id}`
        : `/api/admin/menu/products/${productId}/options`;

      const method = option ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          choices,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar opção');
      }

      toast.success(
        option ? 'Opção atualizada com sucesso' : 'Opção criada com sucesso'
      );
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar opção');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#FF6B00]">
            {option ? 'Editar Opção' : 'Adicionar Opção'}
          </DialogTitle>
          <DialogDescription>
            Configure adicionais e complementos para este produto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Nome da Opção *</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Nome que será exibido ao cliente. Exemplo: "Escolha o molho", "Adicionar braseado", "Tamanho"
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Input placeholder="Ex: Escolha o molho" {...field} maxLength={80} />
                  </FormControl>
                  <FormDescription>Máximo 80 caracteres</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Tipo *</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              <strong>Opcional:</strong> Cliente pode ou não selecionar<br />
                              <strong>Obrigatório:</strong> Cliente deve selecionar antes de adicionar ao carrinho
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPTIONAL">Opcional</SelectItem>
                        <SelectItem value="REQUIRED">Obrigatório</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayAt"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Exibir em</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              <strong>No site:</strong> Popup aparece ao clicar em "Adicionar"<br />
                              <strong>No carrinho:</strong> Cliente escolhe depois, no carrinho
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SITE">No site (ao adicionar)</SelectItem>
                        <SelectItem value="CART">No carrinho</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Descrição</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Descrição adicional que aparecerá junto com o nome da opção</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição opcional..."
                      {...field}
                      value={field.value || ''}
                      maxLength={150}
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>Máximo 150 caracteres</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border border-[#ead9cd] bg-[#fff6ed] p-4 dark:border-[#4a3c30] dark:bg-[#2b160a]">
              <h3 className="mb-3 text-sm font-semibold text-[#FF6B00]">Cobrança</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <div className="flex items-center gap-2">
                          <FormLabel>Esta opção é paga</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Marque se a opção tem um custo base. Exemplo: "Braseado" por +€2,50
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormDescription>
                          Se marcado, será cobrado um valor adicional por esta opção
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {isPaidValue && (
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Preço Base *</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Valor que será adicionado ao preço do produto quando esta opção for selecionada
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Valor em euros (€)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="minSelection"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Mínimo</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Quantidade mínima de escolhas que o cliente deve selecionar. Use 0 para opcional.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSelection"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Máximo</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Quantidade máxima de escolhas que o cliente pode selecionar
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowMultiple"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <div className="flex items-center gap-2">
                        <FormLabel>Múltiplas vezes</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Permite que o cliente adicione a mesma escolha várias vezes. Ex: "2x Molho Extra"
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Escolhas</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-[#a16b45] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          <strong>O que são Escolhas?</strong><br />
                          São as opções específicas que o cliente pode selecionar. Exemplo:<br />
                          • Opção: "Escolha o molho"<br />
                          • Escolhas: "Shoyu (+€0)", "Teriyaki (+€1,50)", "Picante (+€1,00)"
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button type="button" size="sm" onClick={addChoice} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Escolha
                </Button>
              </div>

              {choices.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-[#a16b45]">
                  Nenhuma escolha adicionada
                </div>
              ) : (
                <div className="space-y-3">
                  {choices.map((choice, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 rounded-md border p-3"
                    >
                      <div className="col-span-5">
                        <Input
                          placeholder="Nome"
                          value={choice.name}
                          onChange={(e) => updateChoice(index, 'name', e.target.value)}
                          maxLength={80}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Preço"
                          value={choice.price}
                          onChange={(e) =>
                            updateChoice(index, 'price', parseFloat(e.target.value) || 0)
                          }
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Checkbox
                          checked={choice.isDefault}
                          onCheckedChange={(checked) =>
                            updateChoice(index, 'isDefault', checked)
                          }
                        />
                        <span className="ml-2 text-xs">Padrão</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeChoice(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
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
                  'Salvar Opção'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


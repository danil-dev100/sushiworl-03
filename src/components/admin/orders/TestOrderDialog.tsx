'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Wand2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type ManualFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  productId: string;
  quantity: number;
};

const DEFAULT_FORM: ManualFormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  productId: '',
  quantity: 1,
};

export function TestOrderDialog({ 
  products,
  onOrderCreated,
}: { 
  products: ProductOption[];
  onOrderCreated?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ManualFormState>(() => ({
    ...DEFAULT_FORM,
    productId: products[0]?.id ?? '',
  }));

  useEffect(() => {
    if (!form.productId && products.length > 0) {
      setForm((prev) => ({ ...prev, productId: products[0].id }));
    }
  }, [form.productId, products]);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.productId) ?? null;
  }, [form.productId, products]);

  const handleAutoGeneration = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'auto' }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'Falha ao gerar pedido automático');
      }

      toast.success('Pedido de teste criado com sucesso!');
      setOpen(false);
      // Disparar atualização imediata
      onOrderCreated?.();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao criar pedido automático.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.productId) {
      toast.error('Selecione um produto para o pedido.');
      return;
    }

    if (!form.address.trim()) {
      toast.error('Informe o endereço de entrega.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'manual',
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          address: form.address,
          notes: form.notes,
          items: [
            {
              productId: form.productId,
              quantity: form.quantity,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'Falha ao criar pedido manual');
      }

      toast.success('Pedido manual criado com sucesso!');
      setForm({
        ...DEFAULT_FORM,
        productId: products[0]?.id ?? '',
      });
      setOpen(false);
      // Disparar atualização imediata
      onOrderCreated?.();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao criar pedido manual.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPreview = selectedProduct
    ? selectedProduct.price * (form.quantity || 1)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(value) => !isSubmitting && setOpen(value)}>
      <DialogTrigger asChild>
        <Button className="bg-[#FF6B00] hover:bg-[#ff7f1f]" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Pedido teste
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar pedido teste</DialogTitle>
          <DialogDescription>
            Gere um pedido de demonstração para validar os fluxos de trabalho
            do painel.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'auto' | 'manual')}
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="auto">Gerar automático</TabsTrigger>
            <TabsTrigger value="manual">Criar manual</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-4 pt-4">
            <div className="rounded-lg border border-dashed border-[#FF6B00]/40 bg-[#FFF6ED] p-4 text-sm text-[#a16b45] dark:border-[#FF6B00]/30 dark:bg-[#2b160a] dark:text-[#f5e0d0]">
              <p className="font-semibold text-[#FF6B00] dark:text-[#ffb47a]">
                Como funciona?
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Selecionamos automaticamente um produto do cardápio e
                  geramos um pedido completo.
                </li>
                <li>
                  O pedido aparece imediatamente na lista, permitindo testar
                  os botões <strong>Aceitar</strong>, <strong>Recusar</strong> e{' '}
                  <strong>Imprimir</strong>.
                </li>
                <li>
                  Os dados são fictícios e podem ser excluídos a qualquer
                  momento.
                </li>
              </ul>
            </div>

            <Button
              onClick={handleAutoGeneration}
              disabled={isSubmitting}
              className="w-full bg-[#FF6B00] hover:bg-[#ff7f1f]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando pedido automático...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar pedido automático
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="pt-4">
            <form className="space-y-4" onSubmit={handleManualSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Nome do cliente</Label>
                  <Input
                    id="manual-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ex: Ana Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-email">Email</Label>
                  <Input
                    id="manual-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="cliente@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-phone">Telefone</Label>
                  <Input
                    id="manual-phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+351 912 345 678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-product">Produto</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        productId: value,
                      }))
                    }
                    disabled={products.length === 0}
                  >
                    <SelectTrigger id="manual-product">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manual-quantity">Quantidade</Label>
                  <Input
                    id="manual-quantity"
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity: Math.max(1, Number(event.target.value)),
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-[#a16b45]">
                    Total estimado:{' '}
                    <strong>
                      {totalPreview.toLocaleString('pt-PT', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </strong>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-notes">Observações</Label>
                  <Input
                    id="manual-notes"
                    value={form.notes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Ex: Sem cebola, entregar na portaria..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-address">Endereço completo</Label>
                <Textarea
                  id="manual-address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                  placeholder="Rua, número, complemento, bairro, cidade..."
                  rows={3}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-[#FF6B00] hover:bg-[#ff7f1f]"
                  disabled={isSubmitting || products.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando pedido...
                    </>
                  ) : (
                    'Criar pedido manual'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}



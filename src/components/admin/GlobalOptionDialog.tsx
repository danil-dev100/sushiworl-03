'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Choice {
  id?: string;
  name: string;
  price: number;
  isDefault: boolean;
  sortOrder: number;
}

interface GlobalOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option?: any;
  onSuccess: () => void;
}

export function GlobalOptionDialog({
  open,
  onOpenChange,
  option,
  onSuccess,
}: GlobalOptionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'REQUIRED' | 'OPTIONAL'>('OPTIONAL');
  const [displayAt, setDisplayAt] = useState<'SITE' | 'CART'>('SITE');
  const [isPaid, setIsPaid] = useState(false);
  const [basePrice, setBasePrice] = useState('0');
  const [choices, setChoices] = useState<Choice[]>([
    { name: '', price: 0, isDefault: true, sortOrder: 0 },
  ]);

  const isEditing = !!option;

  useEffect(() => {
    if (option) {
      setName(option.name || '');
      setDescription(option.description || '');
      setType(option.type || 'OPTIONAL');
      setDisplayAt(option.displayAt || 'SITE');
      setIsPaid(option.isPaid || false);
      setBasePrice(option.basePrice?.toString() || '0');
      setChoices(
        option.choices?.length > 0
          ? option.choices.map((c: any, i: number) => ({
              id: c.id,
              name: c.name,
              price: c.price,
              isDefault: c.isDefault,
              sortOrder: c.sortOrder || i,
            }))
          : [{ name: '', price: 0, isDefault: true, sortOrder: 0 }]
      );
    } else {
      resetForm();
    }
  }, [option, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('OPTIONAL');
    setDisplayAt('SITE');
    setIsPaid(false);
    setBasePrice('0');
    setChoices([{ name: '', price: 0, isDefault: true, sortOrder: 0 }]);
  };

  const addChoice = () => {
    setChoices([
      ...choices,
      {
        name: '',
        price: 0,
        isDefault: false,
        sortOrder: choices.length,
      },
    ]);
  };

  const removeChoice = (index: number) => {
    if (choices.length === 1) {
      toast.error('Deve haver pelo menos uma escolha');
      return;
    }
    setChoices(choices.filter((_, i) => i !== index));
  };

  const updateChoice = (index: number, field: keyof Choice, value: any) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };

    // Se marcar como padrão, desmarcar outros
    if (field === 'isDefault' && value === true) {
      newChoices.forEach((c, i) => {
        if (i !== index) c.isDefault = false;
      });
    }

    setChoices(newChoices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (choices.length === 0 || choices.every((c) => !c.name.trim())) {
      toast.error('Adicione pelo menos uma escolha válida');
      return;
    }

    const validChoices = choices.filter((c) => c.name.trim());
    if (validChoices.length === 0) {
      toast.error('Adicione pelo menos uma escolha válida');
      return;
    }

    // Garantir que existe um padrão
    if (!validChoices.some((c) => c.isDefault)) {
      validChoices[0].isDefault = true;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        type,
        displayAt,
        isPaid,
        basePrice: isPaid ? parseFloat(basePrice) || 0 : 0,
        choices: validChoices.map((c, i) => ({
          name: c.name.trim(),
          price: parseFloat(c.price.toString()) || 0,
          isDefault: c.isDefault,
          sortOrder: i,
        })),
      };

      const url = isEditing
        ? `/api/global-options/${option.id}`
        : '/api/global-options';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          isEditing
            ? 'Opção atualizada com sucesso!'
            : 'Opção criada com sucesso!'
        );
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(data.error || 'Erro ao salvar opção');
      }
    } catch (error) {
      console.error('Erro ao salvar opção:', error);
      toast.error('Erro ao salvar opção');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Opção Global' : 'Criar Nova Opção Global'}
          </DialogTitle>
          <DialogDescription>
            Configure uma opção reutilizável que pode ser aplicada em produtos,
            categorias ou em todo o site.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Opção *</Label>
              <Input
                id="name"
                placeholder="Ex: Braseado, Wasabi, Shoyu..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição opcional para ajudar na identificação"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPTIONAL">Opcional</SelectItem>
                    <SelectItem value="REQUIRED">Obrigatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayAt">Exibir em</Label>
                <Select
                  value={displayAt}
                  onValueChange={(v: any) => setDisplayAt(v)}
                >
                  <SelectTrigger id="displayAt">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SITE">Site (Popup)</SelectItem>
                    <SelectItem value="CART">Carrinho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preço Base */}
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="isPaid" className="text-base">
                  Opção paga
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cobra um valor base pela opção (além do preço das escolhas)
                </p>
              </div>
              <Switch
                id="isPaid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
            </div>

            {isPaid && (
              <div className="grid gap-2">
                <Label htmlFor="basePrice">Preço Base (€)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Escolhas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Escolhas *</Label>
                <p className="text-sm text-muted-foreground">
                  Configure as opções que o cliente pode selecionar
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChoice}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {choices.map((choice, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />

                  <div className="flex-1 grid grid-cols-12 gap-3">
                    <div className="col-span-6">
                      <Input
                        placeholder="Nome da escolha"
                        value={choice.name}
                        onChange={(e) =>
                          updateChoice(index, 'name', e.target.value)
                        }
                      />
                    </div>

                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Preço (€)"
                        value={choice.price}
                        onChange={(e) =>
                          updateChoice(index, 'price', e.target.value)
                        }
                      />
                    </div>

                    <div className="col-span-3 flex items-center gap-2">
                      <Switch
                        checked={choice.isDefault}
                        onCheckedChange={(checked) =>
                          updateChoice(index, 'isDefault', checked)
                        }
                      />
                      <Label className="text-xs">Padrão</Label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChoice(index)}
                    disabled={choices.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Salvando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Criar Opção'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

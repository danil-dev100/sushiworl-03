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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Choice {
  name: string;
  price: number;
  isDefault: boolean;
  sortOrder: number;
}

interface GlobalOptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option?: any;
  onSuccess: () => void;
}

export function GlobalOptionFormDialog({
  open,
  onOpenChange,
  option,
  onSuccess,
}: GlobalOptionFormDialogProps) {
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
        option.choices?.map((c: any, i: number) => ({
          name: c.name,
          price: c.price,
          isDefault: c.isDefault,
          sortOrder: i,
        })) || [{ name: '', price: 0, isDefault: true, sortOrder: 0 }]
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
    const updated = [...choices];
    updated[index] = { ...updated[index], [field]: value };

    // Se marcar como default, desmarcar outros
    if (field === 'isDefault' && value === true) {
      updated.forEach((c, i) => {
        if (i !== index) c.isDefault = false;
      });
    }

    setChoices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const validChoices = choices.filter((c) => c.name.trim());
    if (validChoices.length === 0) {
      toast.error('Adicione pelo menos uma escolha válida');
      return;
    }

    // Garantir que há um default
    const hasDefault = validChoices.some((c) => c.isDefault);
    if (!hasDefault) {
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

      const url = isEditing ? `/api/global-options/${option.id}` : '/api/global-options';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(isEditing ? 'Opção atualizada!' : 'Opção criada!');
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(data.error || 'Erro ao salvar opção');
      }
    } catch (error) {
      toast.error('Erro ao salvar opção');
    } finally {
      setLoading(false);
    }
  };

  const TooltipLabel = ({ text, tooltip }: { text: string; tooltip: string }) => (
    <div className="flex items-center gap-2">
      <Label>{text}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Criar'} Opção Global</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados da opção global'
              : 'Crie uma nova opção global reutilizável'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <TooltipLabel
              text="Nome da Opção"
              tooltip="Nome que será exibido ao cliente. Ex: Braseado, Molho Extra, Temperatura"
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Braseado"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <TooltipLabel
              text="Descrição (opcional)"
              tooltip="Texto explicativo que aparece abaixo do nome da opção"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Quer brasear o sushi/gunkan? (aquecido)"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <TooltipLabel
                text="Tipo"
                tooltip="Opcional: cliente pode escolher ou não | Obrigatório: cliente DEVE escolher"
              />
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPTIONAL">Opcional</SelectItem>
                  <SelectItem value="REQUIRED">Obrigatório</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exibir em */}
            <div className="space-y-2">
              <TooltipLabel
                text="Exibir em"
                tooltip="Site: aparece ao adicionar produto ao carrinho | Carrinho: aparece apenas na descrição do item no carrinho"
              />
              <Select value={displayAt} onValueChange={(v: any) => setDisplayAt(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SITE">Site (Popup)</SelectItem>
                  <SelectItem value="CART">Carrinho (Descrição)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opção Paga */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <TooltipLabel
                text="Opção Paga"
                tooltip="Se ativado, cobra um valor adicional pela opção em si (além do preço das escolhas)"
              />
            </div>
            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
          </div>

          {/* Preço Base */}
          {isPaid && (
            <div className="space-y-2">
              <TooltipLabel
                text="Preço Base"
                tooltip="Valor adicional cobrado pela opção (aplicado independente da escolha)"
              />
              <Input
                type="number"
                min={0}
                step={0.01}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Escolhas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TooltipLabel
                text="Escolhas"
                tooltip="Opções que o cliente poderá selecionar. Ex: Sim/Não, Quente/Frio, Shoyu/Teriyaki"
              />
              <Button type="button" onClick={addChoice} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {choices.map((choice, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-muted-foreground mt-2" />
                    <div className="flex-1 grid grid-cols-12 gap-3">
                      <div className="col-span-6">
                        <Input
                          value={choice.name}
                          onChange={(e) => updateChoice(index, 'name', e.target.value)}
                          placeholder="Nome da escolha"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={choice.price}
                          onChange={(e) =>
                            updateChoice(index, 'price', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Preço"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Switch
                          checked={choice.isDefault}
                          onCheckedChange={(v) => updateChoice(index, 'isDefault', v)}
                        />
                        <Label className="text-xs">Padrão</Label>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChoice(index)}
                          disabled={choices.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

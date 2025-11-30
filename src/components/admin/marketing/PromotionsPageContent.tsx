'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart2,
  Droplet,
  ClipboardCopy,
  Eye,
  EyeOff,
  Gift,
  Info,
  Loader2,
  Palette,
  Percent,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/admin/ImageUpload';
import { TooltipHelper } from '@/components/shared/TooltipHelper';

type PromotionType = 'COUPON' | 'FIRST_PURCHASE' | 'ORDER_BUMP' | 'UP_SELL' | 'DOWN_SELL';
type DiscountType = 'FIXED' | 'PERCENTAGE';
type TriggerType = 'PRODUCT' | 'CATEGORY' | 'CART' | 'CART_VALUE';

type ProductSummary = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
};

type PromotionItem = {
  id: string;
  product: ProductSummary;
};

export type PromotionWithRelations = {
  id: string;
  name: string;
  code: string | null;
  type: PromotionType;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number | null;
  usageLimit: number | null;
  usageCount: number;
  triggerType: TriggerType | null;
  triggerValue: string | null;
  suggestedProductId: string | null;
  displayMessage: string | null;
  isActive: boolean;
  isFirstPurchaseOnly: boolean;
  validFrom: Date | string | null;
  validUntil: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  promotionItems: PromotionItem[];
};

type CurrentUser = {
  id: string;
  role: string;
  managerLevel: string | null;
};

type HomeHeroSettings = {
  imageUrl: string | null;
  overlayColor: string;
  overlayOpacity: number;
  headline: string;
  headlineColor: string;
  headlineSize: number;
  bannerHeight: number;
};

type PromotionsPageContentProps = {
  initialPromotions: PromotionWithRelations[];
  products: ProductSummary[];
  currentUser: CurrentUser;
  homeHero: HomeHeroSettings;
};

const EMPTY_SELECT_VALUE = '__none__';

const promotionTypeConfig: Record<
  PromotionType,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    accent: string;
  }
> = {
  COUPON: {
    label: 'Promoção Tradicional',
    description: 'Cupons, frete grátis ou descontos diretos.',
    icon: Gift,
    accent: 'bg-[#FF6B00]/10 text-[#FF6B00]',
  },
  FIRST_PURCHASE: {
    label: 'Primeira Compra',
    description: 'Descontos especiais para novos clientes.',
    icon: Percent,
    accent: 'bg-emerald-100 text-emerald-700',
  },
  ORDER_BUMP: {
    label: 'Order Bump',
    description: 'Ofereça um extra durante o checkout.',
    icon: Settings2,
    accent: 'bg-sky-100 text-sky-700',
  },
  UP_SELL: {
    label: 'Up-sell',
    description: 'Sugira upgrades com maior valor.',
    icon: ArrowUpRight,
    accent: 'bg-purple-100 text-purple-700',
  },
  DOWN_SELL: {
    label: 'Down-sell',
    description: 'Apresente opções mais acessíveis.',
    icon: ArrowDownLeft,
    accent: 'bg-rose-100 text-rose-700',
  },
};

const discountTypeLabel: Record<DiscountType, string> = {
  FIXED: 'Valor Fixo (€)',
  PERCENTAGE: 'Percentual (%)',
};

const triggerTypeLabel: Record<TriggerType, string> = {
  PRODUCT: 'Produto específico',
  CATEGORY: 'Categoria',
  CART: 'Carrinho (itens)',
  CART_VALUE: 'Valor do carrinho',
};

const DEFAULT_HOME_HERO: HomeHeroSettings = {
  imageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBNzMX6lMna6nX8TjJy5jY_Kv-JczpymR3HD2gGTMwfjEinIlR9ziFO_zQV8AKcSbYx7BEsgrBWBOob-nNOaeEvjrEm8TeNmtAA6oPavzl-eLCGbkwcG_4lWfdccNsy0jWWql6Dj1lU-q9Jxwc2RN0B4GkYX93CFfR-YK7uWhLBAASkyFwY5K3FR_0bx5w_AcA95n3eywQvECREh3WvaQEj1-KUh7BC_f8z0zde_LUz5k83DP9ryssaU6GFpGrZLUcnYnhKfENfyDc',
  overlayColor: '#000000',
  overlayOpacity: 0.4,
  headline: 'SushiWorld: O Sabor do Japão na Sua Casa',
  headlineColor: '#FFFFFF',
  headlineSize: 4.5,
  bannerHeight: 60,
};

const promotionFormSchema = z.object({
  name: z.string().min(3, 'Informe um nome com pelo menos 3 caracteres'),
  type: z.enum(['COUPON', 'FIRST_PURCHASE', 'ORDER_BUMP', 'UP_SELL', 'DOWN_SELL']),
  discountType: z.enum(['FIXED', 'PERCENTAGE']),
  discountValue: z
    .string()
    .min(1, 'Informe o valor do desconto')
    .regex(/^\d+([,.]\d{1,2})?$/, 'Use números válidos')
    .refine((value) => {
      const num = Number(value.replace(',', '.'));
      return !Number.isNaN(num) && num > 0;
    }, 'O valor deve ser maior que 0'),
  code: z
    .string()
    .trim()
    .min(4, 'Código deve ter no mínimo 4 caracteres')
    .max(16, 'Código deve ter no máximo 16 caracteres')
    .optional()
    .or(z.literal('')),
  minOrderValue: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === '') return true;
        const num = Number(value.replace(',', '.'));
        return !Number.isNaN(num) && num >= 0;
      },
      'Informe um valor válido'
    ),
  usageLimit: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === '') return true;
        const num = Number(value);
        return Number.isInteger(num) && num > 0;
      },
      'Limite deve ser um número inteiro positivo'
    ),
  isActive: z.boolean().default(true),
  isFirstPurchaseOnly: z.boolean().default(false),
  triggerType: z
    .enum(['PRODUCT', 'CATEGORY', 'CART', 'CART_VALUE'])
    .optional()
    .or(z.literal('')),
  triggerValue: z.string().optional(),
  suggestedProductId: z.string().optional().or(z.literal('')),
  displayMessage: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  promotionItems: z.array(z.string()).optional(),
});

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

export function PromotionsPageContent({
  initialPromotions,
  products,
  currentUser,
  homeHero,
}: PromotionsPageContentProps) {
  const [promotions, setPromotions] = useState(
    initialPromotions.map((promo) => normalizePromotion(promo))
  );
  const [homeHeroBaseline, setHomeHeroBaseline] = useState<HomeHeroSettings>(homeHero);
  const [homeHeroState, setHomeHeroState] = useState<HomeHeroSettings>(homeHero);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [presetType, setPresetType] = useState<PromotionType>('COUPON');
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionWithRelations | null>(null);
  const [promotionBeingEdited, setPromotionBeingEdited] =
    useState<PromotionWithRelations | null>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<PromotionWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    setHomeHeroBaseline(homeHero);
    setHomeHeroState(homeHero);
  }, [homeHero]);

  const filteredPromotions = useMemo(() => {
    if (!searchTerm) return promotions;

    const normalized = searchTerm.toLowerCase();
    return promotions.filter((promotion) => {
      const typeConfig = promotionTypeConfig[promotion.type];
      const matchesName = promotion.name.toLowerCase().includes(normalized);
      const matchesCode =
        (promotion.code ?? '').toLowerCase().includes(normalized) ||
        promotion.id.toLowerCase().includes(normalized);
      const matchesType =
        typeConfig.label.toLowerCase().includes(normalized) ||
        typeConfig.description.toLowerCase().includes(normalized);
      const matchesTriggered =
        (promotion.triggerValue ?? '').toLowerCase().includes(normalized) ||
        (promotion.triggerType ? triggerTypeLabel[promotion.triggerType]?.toLowerCase() : '').includes(
          normalized
        );
      return matchesName || matchesCode || matchesType || matchesTriggered;
    });
  }, [searchTerm, promotions]);

  const stats = useMemo(() => {
    const total = promotions.length;
    const active = promotions.filter((promotion) => promotion.isActive).length;
    const totalUses = promotions.reduce((sum, promotion) => sum + promotion.usageCount, 0);
    const firstPurchase = promotions.filter((promotion) => promotion.isFirstPurchaseOnly).length;
    return { total, active, totalUses, firstPurchase };
  }, [promotions]);

  const productMap = useMemo(() => {
    return products.reduce<Record<string, ProductSummary>>((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }, [products]);

  const heroHasChanges = useMemo(
    () => JSON.stringify(homeHeroState) !== JSON.stringify(homeHeroBaseline),
    [homeHeroState, homeHeroBaseline]
  );

  const updateHomeHeroState = (partial: Partial<HomeHeroSettings>) => {
    setHomeHeroState((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const resetHomeHero = () => {
    setHomeHeroState(DEFAULT_HOME_HERO);
  };

  const handleSaveHomeHero = async () => {
    setIsSavingHero(true);
    try {
      const response = await fetch('/api/admin/settings/home-banner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(homeHeroState),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao atualizar banner');
      }

      const heroPayload: HomeHeroSettings = {
        imageUrl: data.hero.imageUrl ?? null,
        overlayColor: data.hero.overlayColor,
        overlayOpacity: data.hero.overlayOpacity,
        headline: data.hero.headline,
        headlineColor: data.hero.headlineColor,
        headlineSize: data.hero.headlineSize,
        bannerHeight: data.hero.bannerHeight,
      };

      setHomeHeroBaseline(heroPayload);
      setHomeHeroState(heroPayload);
      toast.success('Banner da página inicial atualizado!');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar o banner da página inicial'
      );
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleOpenCreate = (type: PromotionType) => {
    setFormMode('create');
    setPresetType(type);
    setPromotionBeingEdited(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (promotion: PromotionWithRelations) => {
    setFormMode('edit');
    setPresetType(promotion.type);
    setPromotionBeingEdited(promotion);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (promotion: PromotionWithRelations, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setPromotions((prev) => [promotion, ...prev]);
      toast.success('Promoção criada com sucesso!');
    } else {
      setPromotions((prev) =>
        prev.map((item) => (item.id === promotion.id ? promotion : item))
      );
      toast.success('Promoção atualizada com sucesso!');
    }
  };

  const togglePromotion = async (promotion: PromotionWithRelations) => {
    setProcessingIds((prev) => [...prev, promotion.id]);
    try {
      const response = await fetch(`/api/admin/marketing/promotions/${promotion.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !promotion.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao atualizar promoção');
      }

      const updatedPromotion = normalizePromotion(data.promotion);
      setPromotions((prev) =>
        prev.map((item) => (item.id === updatedPromotion.id ? updatedPromotion : item))
      );

      toast.success(
        updatedPromotion.isActive
          ? 'Promoção ativada com sucesso!'
          : 'Promoção pausada com sucesso!'
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar status da promoção'
      );
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== promotion.id));
    }
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/marketing/promotions/${promotionToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao remover promoção');
      }

      setPromotions((prev) => prev.filter((item) => item.id !== promotionToDelete.id));
      toast.success('Promoção removida com sucesso!');
      setPromotionToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao remover promoção'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCoupon = async (promotion: PromotionWithRelations) => {
    if (!promotion.code) {
      toast.warning('Esta promoção não possui código de cupom.');
      return;
    }

    await navigator.clipboard.writeText(promotion.code);
    toast.success('Código copiado para a área de transferência!');
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-[#FF6B00]">Promoções</h1>
          <p className="text-sm text-[#a16b45]">
            Crie campanhas inteligentes para o site e monitore o desempenho por aqui.
          </p>
        </div>
        <Button
          onClick={() => handleOpenCreate('COUPON')}
          className="flex items-center gap-2 bg-[#FF6B00] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#FF6B00]/90"
        >
          <Plus className="h-4 w-4" />
          Nova Promoção
        </Button>
      </header>

      <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#ead9cd] pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#333333]">Visão geral das promoções</h2>
            <InfoHint text="Resumo rápido das campanhas ativas, usos de cupons e permissões do usuário logado. Deslize o cursor sobre cada cartão para ver detalhes." />
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-[#a16b45]">
            Dados atualizados em tempo real
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Promoções ativas"
            value={stats.active}
            subtitle={`${stats.total} cadastradas`}
            icon={BarChart2}
            accent="bg-[#FF6B00]/10 text-[#FF6B00]"
          />
          <StatCard
            title="Cupons usados"
            value={stats.totalUses}
            subtitle="Total de utilizações"
            icon={Percent}
            accent="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Primeira compra"
            value={stats.firstPurchase}
            subtitle="Promoções exclusivas"
            icon={Gift}
            accent="bg-purple-100 text-purple-700"
          />
          <StatCard
            title="Gerenciador"
            value={
              currentUser.role === 'ADMIN'
                ? 'Administrador'
                : currentUser.managerLevel === 'FULL'
                ? 'Gerente (Total)'
                : 'Gerente'
            }
            subtitle="Acesso baseado em permissões"
            icon={Settings2}
            accent="bg-sky-100 text-sky-700"
          />
        </div>
      </section>

      <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#ead9cd] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#333333]">Criar nova oferta</h2>
              <InfoHint text="Escolha um tipo de promoção para iniciar o assistente. Cada card sugere estratégias diferentes: cupons, up-sell e down-sell." />
            </div>
            <p className="mt-1 text-sm text-[#a16b45]">
              Selecione o tipo de promoção para abrir o assistente de configuração.
            </p>
          </div>
          <div className="relative w-full max-w-sm md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a16b45]" />
            <Input
              type="search"
              placeholder="Busca rápida..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-white pl-10 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PromotionTemplateCard
            type="COUPON"
            title="Promoção Tradicional"
            description="Crie cupons de desconto, ofertas de frete grátis ou 'compre e ganhe'."
            icon={Gift}
            accent="bg-[#FF6B00]/10 text-[#FF6B00]"
            tooltip="Ideal para campanhas sazonais, recompensas ou impulsionar pedidos em dias específicos."
            onClick={() => handleOpenCreate('COUPON')}
          />
          <PromotionTemplateCard
            type="UP_SELL"
            title="Up-sell"
            description="Ofereça uma versão premium ou maior do produto durante o funil."
            icon={ArrowUpRight}
            accent="bg-purple-100 text-purple-700"
            tooltip="Sugira um upgrade com maior ticket médio quando o cliente escolhe itens estratégicos."
            onClick={() => handleOpenCreate('UP_SELL')}
          />
          <PromotionTemplateCard
            type="DOWN_SELL"
            title="Down-sell"
            description="Sugira uma alternativa com menor preço quando o cliente hesitar."
            icon={ArrowDownLeft}
            accent="bg-rose-100 text-rose-700"
            tooltip="Recupere vendas oferecendo itens mais acessíveis ao detectar desistências no funil."
            onClick={() => handleOpenCreate('DOWN_SELL')}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#ead9cd] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#333333]">Banner da página inicial</h2>
              <InfoHint text="Atualize a experiência visual da Home com uma nova imagem, headline e máscara. Ideal para alinhar campanhas sazonais e promoções especiais." />
            </div>
            <p className="mt-1 text-sm text-[#a16b45]">
              Escolha uma imagem, ajuste a cor/claridade da máscara e personalize a mensagem principal exibida no topo do site.
            </p>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-[#a16b45]">
            Salve para refletir imediatamente no site
          </span>
        </div>

        <HomeBannerConfigurator
          hero={homeHeroState}
          onChange={updateHomeHeroState}
          onReset={resetHomeHero}
          onSave={handleSaveHomeHero}
          isSaving={isSavingHero}
          hasChanges={heroHasChanges}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#ead9cd] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#ead9cd] p-6 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#333333]">Promoções cadastradas</h2>
            <InfoHint text="Visualize todas as ofertas, altere rapidamente o status, copie cupons ou remova campanhas que não fazem mais sentido." />
          </div>
          <p className="text-sm text-[#a16b45]">
            Passe o mouse sobre os botões para entender cada ação disponível.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f5f1e9]">
              <TableRow className="border-[#ead9cd]">
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#FF6B00]">
                  Promoção
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#a16b45]">
                  Cupom
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#a16b45]">
                  Status
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#a16b45] text-center">
                  Usos
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#a16b45]">
                  Vigência
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#a16b45] text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-[#a16b45]">
                    Nenhuma promoção encontrada. Crie uma nova oferta para começar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromotions.map((promotion) => {
                  const typeConfig = promotionTypeConfig[promotion.type];
                  const isProcessing = processingIds.includes(promotion.id);
                  return (
                    <TableRow key={promotion.id} className="border-[#ead9cd]">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full',
                                typeConfig.accent
                              )}
                            >
                              <typeConfig.icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[#333333]">
                                {promotion.name}
                              </p>
                              <p className="text-xs text-[#a16b45]">
                                {typeConfig.label}
                              </p>
                            </div>
                          </div>
                          {promotion.isFirstPurchaseOnly && (
                            <Badge className="w-fit bg-emerald-100 text-emerald-700">
                              Primeira compra
                            </Badge>
                          )}
                          {promotion.minOrderValue !== null && (
                            <span className="text-xs text-[#a16b45]">
                              Pedido mínimo: €{promotion.minOrderValue.toFixed(2)}
                            </span>
                          )}
                          {promotion.triggerType && (
                            <span className="text-xs text-[#a16b45]">
                              Gatilho: {triggerTypeLabel[promotion.triggerType]}{' '}
                              {promotion.triggerValue ? `• ${promotion.triggerValue}` : ''}
                            </span>
                          )}
                          {promotion.promotionItems.length > 0 && (
                            <span className="text-xs text-[#a16b45]">
                              Aplica-se a {promotion.promotionItems.length} produto(s)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 align-middle">
                        {promotion.code ? (
                          <Badge className="bg-[#FF6B00]/10 font-mono text-[#FF6B00]">
                            {promotion.code}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#a16b45]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={promotion.isActive}
                            onCheckedChange={() => togglePromotion(promotion)}
                            disabled={isProcessing}
                          />
                          <span className="text-sm font-medium text-[#333333]">
                            {promotion.isActive ? 'Ativa' : 'Pausada'}
                          </span>
                          {isProcessing && (
                            <Loader2 className="h-4 w-4 animate-spin text-[#FF6B00]" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center text-sm font-semibold text-[#333333]">
                        {promotion.usageCount}
                        {promotion.usageLimit ? (
                          <span className="text-xs text-[#a16b45]">
                            {' '}
                            / {promotion.usageLimit}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-[#a16b45]">
                        {formatValidity(promotion.validFrom, promotion.validUntil)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyCoupon(promotion)}
                                className="text-[#a16b45] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]"
                              >
                                <ClipboardCopy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              Copiar código do cupom
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedPromotion(promotion)}
                                className="text-[#a16b45] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              Visualizar detalhes completos
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(promotion)}
                                className="text-[#a16b45] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]"
                              >
                                <Percent className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              Editar regras da promoção
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPromotionToDelete(promotion)}
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              Remover promoção
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <PromotionFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setPromotionBeingEdited(null);
          }
        }}
        mode={formMode}
        presetType={presetType}
        products={products}
        promotion={promotionBeingEdited}
        onSuccess={handleFormSuccess}
      />

      <PromotionDetailsDialog
        promotion={selectedPromotion}
        productMap={productMap}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPromotion(null);
          }
        }}
      />

      <AlertDialog
        open={Boolean(promotionToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPromotionToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover promoção?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação removerá <strong>{promotionToDelete?.name}</strong> e não poderá ser
              desfeita. Os clientes deixarão de visualizar essa oferta imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </span>
              ) : (
                'Remover Promoção'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  accent: string;
};

function StatCard({ title, value, subtitle, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#ead9cd] bg-white p-4 shadow-sm">
      <div className={cn('w-fit rounded-full p-2', accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold text-[#333333]">{value}</div>
      <div className="text-sm font-semibold text-[#a16b45]">{title}</div>
      <p className="text-xs text-[#a16b45]">{subtitle}</p>
    </div>
  );
}

type HomeBannerConfiguratorProps = {
  hero: HomeHeroSettings;
  onChange: (partial: Partial<HomeHeroSettings>) => void;
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasChanges: boolean;
};

function HomeBannerConfigurator({
  hero,
  onChange,
  onReset,
  onSave,
  isSaving,
  hasChanges,
}: HomeBannerConfiguratorProps) {
  const overlayOpacity =
    typeof hero.overlayOpacity === 'number' ? hero.overlayOpacity : 0.4;
  const overlayPercent = Math.round(overlayOpacity * 100);
  const headlineSize =
    typeof hero.headlineSize === 'number' ? hero.headlineSize : 4.5;
  const headlineColor = hero.headlineColor || '#FFFFFF';
  const headlineText = hero.headline ?? '';
  const previewBackground = {
    backgroundImage: hero.imageUrl ? `url(${hero.imageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } as React.CSSProperties;

  const maskStyle: React.CSSProperties = {
    background: hexToRgba(hero.overlayColor, overlayOpacity),
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.75fr,1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
              <Sparkles className="h-4 w-4 text-[#FF6B00]" />
              Imagem de destaque
            </div>
            <span className="text-xs text-[#a16b45]">Arraste ou clique para enviar</span>
          </div>
          <ImageUpload
            value={hero.imageUrl ?? undefined}
            onChange={(url) => onChange({ imageUrl: url })}
            bucket="banners"
            recommendedSize="1920 x 1080 px"
            helperText="Imagens horizontais em alta resolução garantem melhor corte em telas grandes."
          />
          <div className="relative h-48 overflow-hidden rounded-lg border border-[#ead9cd] bg-[#f5f1e9]" style={previewBackground}>
            {hero.imageUrl ? (
              <>
                <div className="absolute inset-0 transition-colors" style={maskStyle} />
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <p
                    className="font-bold transition-all"
                    style={{
                      color: headlineColor,
                      fontSize: `${headlineSize / 2.5}rem`,
                      lineHeight: 1.2,
                      textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }}
                  >
                    {headlineText || 'Sua headline aparecerá aqui'}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#a16b45]">
                <Sparkles className="h-6 w-6" />
                <p className="text-sm font-medium">Adicione uma imagem para visualizar o banner</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
              <Type className="h-4 w-4 text-[#FF6B00]" />
              Headline exibida
            </label>
            <Input
              value={headlineText}
              onChange={(event) => onChange({ headline: event.target.value })}
              placeholder="SushiWorld: O Sabor do Japão na Sua Casa"
            />
            <p className="text-xs text-[#a16b45]">
              Use uma mensagem curta e impactante para reforçar a proposta da promoção atual.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
                <Palette className="h-4 w-4 text-[#FF6B00]" />
                Cor do Texto
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={headlineColor}
                  onChange={(event) => onChange({ headlineColor: event.target.value })}
                  className="h-10 w-12 cursor-pointer border border-[#ead9cd] bg-white p-1"
                />
                <Input
                  value={headlineColor}
                  onChange={(event) => onChange({ headlineColor: event.target.value })}
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
                <Type className="h-4 w-4 text-[#FF6B00]" />
                Tamanho
                <span className="text-xs font-medium text-[#a16b45]">
                  {headlineSize.toFixed(1)}rem
                </span>
              </label>
              <Slider
                value={[headlineSize]}
                min={2.5}
                max={6}
                step={0.1}
                onValueChange={(value) =>
                  onChange({
                    headlineSize: value?.[0] ?? 4.5,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
              <Palette className="h-4 w-4 text-[#FF6B00]" />
              Cor da máscara
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={hero.overlayColor}
                onChange={(event) => onChange({ overlayColor: event.target.value })}
                className="h-12 w-16 cursor-pointer border border-[#ead9cd] bg-white p-1"
              />
              <Input
                value={hero.overlayColor}
                onChange={(event) => onChange({ overlayColor: event.target.value })}
                maxLength={7}
              />
            </div>
            <p className="text-xs text-[#a16b45]">
              Informe um código hexadecimal. Combine com a intensidade para equilibrar imagem e texto.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
              <Droplet className="h-4 w-4 text-[#FF6B00]" />
              Intensidade da máscara&nbsp;
              <span className="text-xs font-medium text-[#a16b45]">{overlayPercent}%</span>
            </label>
            <Slider
              value={[overlayPercent]}
              min={0}
              max={90}
              step={5}
              onValueChange={(value) =>
                onChange({
                  overlayOpacity: ((value?.[0] ?? overlayPercent) / 100) || 0,
                })
              }
            />
            <p className="text-xs text-[#a16b45]">
              Máscaras mais fortes destacam o texto; valores baixos deixam a foto em evidência.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
              <Settings2 className="h-4 w-4 text-[#FF6B00]" />
              Tamanho do banner&nbsp;
              <span className="text-xs font-medium text-[#a16b45]">{hero.bannerHeight ?? 60}vh</span>
            </label>
            <Slider
              value={[hero.bannerHeight ?? 60]}
              min={30}
              max={100}
              step={5}
              onValueChange={(value) =>
                onChange({
                  bannerHeight: value?.[0] ?? 60,
                })
              }
            />
            <p className="text-xs text-[#a16b45]">
              Controle a altura do banner. Valores menores criam banners mais compactos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isSaving}
            >
              Restaurar padrão
            </Button>
            <Button
              type="button"
              onClick={onSave}
              className="bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90"
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                'Salvar alterações'
              )}
            </Button>
            {!hasChanges && (
              <span className="text-xs text-[#a16b45]">
                Sem alterações pendentes.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type PromotionTemplateCardProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  onClick: () => void;
  type: PromotionType;
  tooltip?: string;
};

function PromotionTemplateCard({
  title,
  description,
  icon: Icon,
  accent,
  onClick,
  tooltip,
}: PromotionTemplateCardProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-[#ead9cd] p-5 transition-all hover:shadow-md">
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', accent)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <h3 className="text-lg font-semibold text-[#333333]">{title}</h3>
        {tooltip && <InfoHint text={tooltip} />}
      </div>
      <p className="mt-2 flex-1 text-sm text-[#a16b45]">{description}</p>
      <Button
        onClick={onClick}
        className="mt-6 w-full bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90"
      >
        Configurar
      </Button>
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-[#a16b45] transition-colors hover:text-[#FF6B00]"
          aria-label="Saiba mais"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left text-xs leading-relaxed text-[#333333]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type PromotionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetType: PromotionType;
  promotion: PromotionWithRelations | null;
  products: ProductSummary[];
  mode: 'create' | 'edit';
  onSuccess: (promotion: PromotionWithRelations, mode: 'create' | 'edit') => void;
};

function PromotionFormDialog({
  open,
  onOpenChange,
  presetType,
  promotion,
  products,
  mode,
  onSuccess,
}: PromotionFormDialogProps) {
  const isEditing = mode === 'edit' && promotion !== null;
  const [showCode, setShowCode] = useState(false);

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: getDefaultFormValues(presetType, promotion),
  });

  const watchType = form.watch('type');
  const watchDiscountType = form.watch('discountType');
  const watchPromotionItems = form.watch('promotionItems') ?? [];

  const handleSubmit = async (values: PromotionFormValues) => {
    const payload = transformFormPayload(values, isEditing ? promotion?.id : undefined);

    try {
      const response = await fetch(
        isEditing
          ? `/api/admin/marketing/promotions/${promotion?.id}`
          : '/api/admin/marketing/promotions',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao salvar promoção');
      }

      onSuccess(normalizePromotion(data.promotion), mode);
      onOpenChange(false);
      form.reset(getDefaultFormValues(presetType, null));
      setShowCode(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar promoção');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(dialogOpen) => {
        onOpenChange(dialogOpen);
        if (!dialogOpen) {
          form.reset(getDefaultFormValues(presetType, promotion));
          setShowCode(false);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar promoção' : 'Criar nova promoção'}
          </DialogTitle>
          <DialogDescription>
            Personalize os detalhes da promoção conforme as regras do restaurante.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <FormLabel>Nome da promoção</FormLabel>
                      <TooltipHelper text="Nome descritivo da promoção que aparecerá no sistema administrativo. Deve ser claro e identificável para facilitar a gestão." />
                    </div>
                    <FormControl>
                      <Input placeholder="Ex: 10% OFF Primeira Compra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Tipo da promoção</FormLabel>
                      <TooltipHelper text="Define a estratégia da promoção. Cada tipo tem uma abordagem diferente: Tradicional (cupons/descontos diretos), Primeira Compra (novos clientes), Order Bump (upsell no checkout), Up-sell (upgrade de produtos), Down-sell (alternativas mais acessíveis)." />
                    </div>
                    <Select
                      value={field.value}
                      onValueChange={(value: PromotionType) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(promotionTypeConfig) as PromotionType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <span>{promotionTypeConfig[type].label}</span>
                              <TooltipHelper text={promotionTypeConfig[type].description} />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Tipo de desconto</FormLabel>
                      <TooltipHelper text="Percentual: desconto baseado em porcentagem (ex: 10% OFF). Valor Fixo: desconto em euros (ex: 5€ OFF). O tipo afeta como o desconto é calculado sobre o valor dos produtos." />
                    </div>
                    <Select
                      value={field.value}
                      onValueChange={(value: DiscountType) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                        <SelectItem value="FIXED">Valor Fixo (€)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>
                        Valor do desconto{' '}
                        <span className="text-xs font-medium text-[#a16b45]">
                          {discountTypeLabel[watchDiscountType]}
                        </span>
                      </FormLabel>
                      <TooltipHelper text={watchDiscountType === 'PERCENTAGE' ? 'Valor percentual do desconto (ex: 10 para 10% OFF)' : 'Valor fixo em euros a ser descontado (ex: 5 para 5€ OFF)'} />
                    </div>
                    <FormControl>
                      <Input placeholder="Ex: 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Código do cupom</FormLabel>
                      <TooltipHelper text="Código único que os clientes usarão para aplicar o desconto. Se não informado, a promoção será automática (sem necessidade de código)." />
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Ex: BEMVINDO10"
                          type={showCode ? 'text' : 'password'}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-3 flex items-center text-[#a16b45] transition hover:text-[#FF6B00]"
                          onClick={() => setShowCode((prev) => !prev)}
                        >
                          {showCode ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Opcional. Use letras maiúsculas e números para facilitar a leitura.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Valor mínimo do pedido (€)</FormLabel>
                      <TooltipHelper text="Valor mínimo que o pedido deve ter para que a promoção seja aplicável. Deixe em branco para não ter restrição de valor mínimo." />
                    </div>
                    <FormControl>
                      <Input placeholder="Ex: 20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Limite de uso</FormLabel>
                      <TooltipHelper text="Número máximo de vezes que a promoção pode ser utilizada. Deixe em branco para uso ilimitado. Útil para controlar orçamento de marketing." />
                    </div>
                    <FormControl>
                      <Input placeholder="Ex: 100 (deixe vazio para ilimitado)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4 md:col-span-2 md:flex-row">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <div className="flex items-center gap-2">
                        <FormLabel>Início da vigência</FormLabel>
                        <TooltipHelper text="Data e hora em que a promoção começará a funcionar. Se não informado, a promoção começará imediatamente após ser ativada." />
                      </div>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <div className="flex items-center gap-2">
                        <FormLabel>Fim da vigência</FormLabel>
                        <TooltipHelper text="Data e hora em que a promoção será automaticamente desativada. Se não informado, a promoção ficará ativa até ser manualmente desativada." />
                      </div>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-4 md:col-span-2 md:flex-row">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex w-full items-center justify-between rounded-lg border border-[#ead9cd] p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FormLabel>Ativar promoção imediatamente</FormLabel>
                          <TooltipHelper text="Controla se a promoção está ativa e disponível para os clientes. Promoções inativas não aparecem no site mas podem ser reativadas a qualquer momento." />
                        </div>
                        <FormDescription>
                          Caso desmarque, a promoção permanecerá pausada até ser ativada.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFirstPurchaseOnly"
                  render={({ field }) => (
                    <FormItem className="flex w-full items-center justify-between rounded-lg border border-[#ead9cd] p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FormLabel>Restrita à primeira compra</FormLabel>
                          <TooltipHelper text="Quando ativado, a promoção só será aplicável para clientes que nunca fizeram compras antes. Ideal para captar novos clientes e aumentar a base de usuários." />
                        </div>
                        <FormDescription>
                          Aplique automaticamente apenas para clientes novos.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="triggerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gatilho de exibição (opcional)</FormLabel>
                    <Select
                      value={field.value ?? EMPTY_SELECT_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === EMPTY_SELECT_VALUE ? undefined : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um gatilho" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Sem gatilho específico</SelectItem>
                        <SelectItem value="PRODUCT">Produto específico</SelectItem>
                        <SelectItem value="CATEGORY">Categoria</SelectItem>
                        <SelectItem value="CART">Itens no carrinho</SelectItem>
                        <SelectItem value="CART_VALUE">Valor do carrinho</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha quando a promoção deve ser exibida automaticamente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="triggerValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor/Gatilho (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: SKU do produto, nome da categoria, valor mínimo..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suggestedProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto sugerido (Up-sell / Down-sell)</FormLabel>
                    <Select
                      value={field.value ?? EMPTY_SELECT_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === EMPTY_SELECT_VALUE ? undefined : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Nenhum produto sugerido</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} • {product.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayMessage"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Mensagem exibida ao cliente</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Aproveite 10% OFF na sua primeira compra! Use o cupom BEMVINDO10."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border border-[#ead9cd] p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#333333]">
                    Aplicar promoção a produtos específicos
                  </h3>
                  <TooltipHelper text="Selecione produtos específicos para aplicar a promoção. Se nenhum produto for selecionado, a promoção poderá ser aplicada a todos os produtos ou baseada em regras específicas (categoria, valor mínimo, etc)." />
                </div>
                <p className="text-xs text-[#a16b45]">
                  Selecione os produtos que receberão esta oferta. Caso nenhum seja escolhido, ela
                  poderá ser aplicada globalmente via regras.
                </p>
              </div>
              <div className="mt-4 grid max-h-60 grid-cols-1 gap-3 overflow-y-auto pr-2 md:grid-cols-2">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#ead9cd] p-3 hover:border-[#FF6B00]"
                  >
                    <Checkbox
                      checked={watchPromotionItems.includes(product.id)}
                      onCheckedChange={(checked) => {
                        const current = new Set(watchPromotionItems);
                        if (checked) {
                          current.add(product.id);
                        } else {
                          current.delete(product.id);
                        }
                        form.setValue('promotionItems', Array.from(current), {
                          shouldDirty: true,
                        });
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#333333]">
                        {product.name}
                      </span>
                      <span className="text-xs text-[#a16b45]">
                        {product.sku} • {product.category}
                      </span>
                      <span className="text-xs text-[#a16b45]">
                        €{product.price.toFixed(2)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90"
              >
                {isEditing ? 'Salvar alterações' : 'Criar promoção'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type PromotionDetailsDialogProps = {
  promotion: PromotionWithRelations | null;
  productMap: Record<string, ProductSummary>;
  onOpenChange: (open: boolean) => void;
};

function PromotionDetailsDialog({
  promotion,
  productMap,
  onOpenChange,
}: PromotionDetailsDialogProps) {
  const open = promotion !== null;

  if (!promotion) {
    return null;
  }

  const typeConfig = promotionTypeConfig[promotion.type];
  const suggestedProduct =
    promotion.suggestedProductId ? productMap[promotion.suggestedProductId] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da promoção</DialogTitle>
          <DialogDescription>
            Visualize todas as regras e itens vinculados a <strong>{promotion.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg border border-[#ead9cd] bg-[#fefaf3] p-4">
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                typeConfig.accent
              )}
            >
              <typeConfig.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[#333333]">{promotion.name}</h3>
              <p className="text-sm text-[#a16b45]">{typeConfig.description}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-4 border border-[#ead9cd] px-4 py-6 md:grid-cols-2">
            <InfoRow label="Código do cupom">
              {promotion.code ? (
                <Badge className="bg-[#FF6B00]/10 font-mono text-[#FF6B00]">{promotion.code}</Badge>
              ) : (
                <span className="text-sm text-[#a16b45]">—</span>
              )}
            </InfoRow>
            <InfoRow label="Status">
              <Badge className={promotion.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}>
                {promotion.isActive ? 'Ativa' : 'Pausada'}
              </Badge>
            </InfoRow>
            <InfoRow label="Desconto">
              {promotion.discountType === 'PERCENTAGE'
                ? `${promotion.discountValue}%`
                : `€${promotion.discountValue.toFixed(2)}`}
            </InfoRow>
            <InfoRow label="Pedido mínimo">
              {promotion.minOrderValue !== null
                ? `€${promotion.minOrderValue.toFixed(2)}`
                : '—'}
            </InfoRow>
            <InfoRow label="Limite de uso">
              {promotion.usageLimit ?? 'Ilimitado'}
            </InfoRow>
            <InfoRow label="Usos realizados">
              {promotion.usageCount}
            </InfoRow>
            <InfoRow label="Restrita à primeira compra">
              {promotion.isFirstPurchaseOnly ? 'Sim' : 'Não'}
            </InfoRow>
            <InfoRow label="Vigência">
              {formatValidity(promotion.validFrom, promotion.validUntil)}
            </InfoRow>
          </dl>

          <div className="rounded-lg border border-[#ead9cd] p-4">
            <h4 className="text-sm font-semibold text-[#333333]">Gatilhos e mensagens</h4>
            <dl className="mt-3 space-y-2 text-sm text-[#a16b45]">
              <InfoRow label="Gatilho">
                {promotion.triggerType
                  ? triggerTypeLabel[promotion.triggerType]
                  : 'Nenhum gatilho específico'}
              </InfoRow>
              <InfoRow label="Valor/Gatilho">
                {promotion.triggerValue ?? '—'}
              </InfoRow>
              <InfoRow label="Mensagem exibida">
                {promotion.displayMessage ?? '—'}
              </InfoRow>
              <InfoRow label="Produto sugerido">
                {suggestedProduct
                  ? `${suggestedProduct.name} • ${suggestedProduct.sku}`
                  : '—'}
              </InfoRow>
            </dl>
          </div>

          <div className="rounded-lg border border-[#ead9cd] p-4">
            <h4 className="text-sm font-semibold text-[#333333]">Aplicação por produto</h4>
            {promotion.promotionItems.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-[#a16b45]">
                {promotion.promotionItems.map((item) => (
                  <li key={item.id}>
                    <span className="font-semibold text-[#333333]">{item.product.name}</span>{' '}
                    — {item.product.sku} ({item.product.category})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#a16b45]">
                Nenhum produto específico vinculado. A promoção pode ser aplicada globalmente.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-[#ead9cd] p-4">
            <h4 className="text-sm font-semibold text-[#333333]">Acesso rápido ao site</h4>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href="/"
                target="_blank"
                className="rounded-full bg-[#FF6B00]/10 px-4 py-1 font-semibold text-[#FF6B00] hover:bg-[#FF6B00]/20"
              >
                Página inicial
              </Link>
              <Link
                href="/cardapio"
                target="_blank"
                className="rounded-full bg-[#FF6B00]/10 px-4 py-1 font-semibold text-[#FF6B00] hover:bg-[#FF6B00]/20"
              >
                Cardápio
              </Link>
              <Link
                href="/checkout"
                target="_blank"
                className="rounded-full bg-[#FF6B00]/10 px-4 py-1 font-semibold text-[#FF6B00] hover:bg-[#FF6B00]/20"
              >
                Checkout
              </Link>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type InfoRowProps = {
  label: string;
  children: React.ReactNode;
};

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#a16b45]">
        {label}
      </dt>
      <dd className="text-sm text-[#333333]">{children}</dd>
    </div>
  );
}

function normalizePromotion(promotion: PromotionWithRelations): PromotionWithRelations {
  return {
    ...promotion,
    validFrom: promotion.validFrom ? new Date(promotion.validFrom) : null,
    validUntil: promotion.validUntil ? new Date(promotion.validUntil) : null,
    createdAt: new Date(promotion.createdAt),
    updatedAt: new Date(promotion.updatedAt),
  };
}

function formatValidity(validFrom: Date | string | null, validUntil: Date | string | null) {
  if (!validFrom && !validUntil) {
    return 'Sem vigência definida';
  }

  const formatDate = (date: Date | string) =>
    format(date instanceof Date ? date : new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  if (validFrom && validUntil) {
    return `${formatDate(validFrom)} — ${formatDate(validUntil)}`;
  }

  if (validFrom) {
    return `A partir de ${formatDate(validFrom)}`;
  }

  return `Até ${formatDate(validUntil as Date | string)}`;
}

function getDefaultFormValues(
  presetType: PromotionType,
  promotion: PromotionWithRelations | null
): PromotionFormValues {
  if (promotion) {
    return {
      name: promotion.name,
      type: promotion.type,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue.toString().replace('.', ','),
      code: promotion.code ?? '',
      minOrderValue: promotion.minOrderValue !== null ? promotion.minOrderValue.toString() : '',
      usageLimit: promotion.usageLimit !== null ? promotion.usageLimit.toString() : '',
      isActive: promotion.isActive,
      isFirstPurchaseOnly: promotion.isFirstPurchaseOnly,
      triggerType: promotion.triggerType ?? undefined,
      triggerValue: promotion.triggerValue ?? '',
      suggestedProductId: promotion.suggestedProductId ?? undefined,
      displayMessage: promotion.displayMessage ?? '',
      validFrom: promotion.validFrom
        ? format(promotion.validFrom instanceof Date ? promotion.validFrom : new Date(promotion.validFrom), "yyyy-MM-dd'T'HH:mm")
        : '',
      validUntil: promotion.validUntil
        ? format(promotion.validUntil instanceof Date ? promotion.validUntil : new Date(promotion.validUntil), "yyyy-MM-dd'T'HH:mm")
        : '',
      promotionItems: promotion.promotionItems.map((item) => item.product.id),
    };
  }

  return {
    name: '',
    type: presetType,
    discountType: 'PERCENTAGE',
    discountValue: '10',
    code: '',
    minOrderValue: '',
    usageLimit: '',
    isActive: true,
    isFirstPurchaseOnly: presetType === 'FIRST_PURCHASE',
    triggerType: presetType === 'UP_SELL' || presetType === 'DOWN_SELL' ? 'PRODUCT' : undefined,
    triggerValue: '',
    suggestedProductId: undefined,
    displayMessage: '',
    validFrom: '',
    validUntil: '',
    promotionItems: [],
  };
}

function transformFormPayload(values: PromotionFormValues, promotionId?: string) {
  return {
    ...(promotionId ? {} : { name: values.name }),
    name: values.name,
    type: values.type,
    code: values.code?.trim() || null,
    discountType: values.discountType,
    discountValue: Number(values.discountValue.replace(',', '.')),
    minOrderValue: values.minOrderValue && values.minOrderValue.trim() !== ''
      ? Number(values.minOrderValue.replace(',', '.'))
      : null,
    usageLimit: values.usageLimit && values.usageLimit.trim() !== ''
      ? Number(values.usageLimit)
      : null,
    isActive: values.isActive,
    isFirstPurchaseOnly: values.isFirstPurchaseOnly,
    triggerType: values.triggerType || null,
    triggerValue: values.triggerValue ? values.triggerValue.trim() : null,
    suggestedProductId: values.suggestedProductId || null,
    displayMessage: values.displayMessage ? values.displayMessage.trim() : null,
    validFrom: values.validFrom ?? null,
    validUntil: values.validUntil ?? null,
    promotionItems: values.promotionItems ?? [],
  };
}


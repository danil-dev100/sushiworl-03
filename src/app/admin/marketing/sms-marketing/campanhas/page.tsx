'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Tag,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Send,
  Smartphone,
  ArrowLeft,
  Users,
  Gift,
  Percent,
  Calendar,
  Target,
  Ticket,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SmsCampaign {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduledFor?: string;
  sentCount: number;
  failedCount: number;
  targetAudience?: {
    type: string;
    contactListId?: string;
    filters?: Record<string, any>;
  };
  contactListId?: string;
  promotionId?: string;
  promotion?: {
    id: string;
    name: string;
    code?: string;
    discountType: string;
    discountValue: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Promotion {
  id: string;
  name: string;
  code: string | null;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  isActive: boolean;
}

interface ContactList {
  id: string;
  name: string;
  description?: string;
  totalContacts: number;
  validContacts: number;
  contactCount: number;
}

interface AudienceStats {
  total: number;
  withPhone: number;
}

export default function SmsCampanhasPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [smsConfigured, setSmsConfigured] = useState(false);

  // Modal state
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SmsCampaign | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    promotionId: '',
    contactListId: '', // ID da lista de contatos importada
    audienceType: 'all', // 'all', 'active', 'inactive', 'new', 'list'
    scheduleType: 'now', // 'now', 'scheduled'
    scheduledFor: '',
    includePromoCode: true,
  });

  const [audienceStats, setAudienceStats] = useState<AudienceStats>({ total: 0, withPhone: 0 });
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    loadCampaigns();
    loadPromotions();
    loadContactLists();
    checkSmsConfig();
  }, []);

  const updatePreview = useCallback(() => {
    let preview = formData.message;

    if (formData.promotionId && formData.includePromoCode) {
      const promo = promotions.find(p => p.id === formData.promotionId);
      if (promo?.code) {
        if (!preview.includes('{CUPOM}')) {
          preview += `\n\nUse o cupom: ${promo.code}`;
        } else {
          preview = preview.replace('{CUPOM}', promo.code);
        }
      }
      if (promo) {
        const discountText = promo.discountType === 'PERCENTAGE'
          ? `${promo.discountValue}% OFF`
          : `R$ ${promo.discountValue.toFixed(2)} OFF`;
        preview = preview.replace('{DESCONTO}', discountText);
      }
    }

    preview = preview.replace('{NOME}', 'Cliente');
    setPreviewMessage(preview);
  }, [formData.message, formData.promotionId, formData.includePromoCode, promotions]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  useEffect(() => {
    if (formData.audienceType) {
      loadAudienceStats(formData.audienceType);
    }
  }, [formData.audienceType]);

  const checkSmsConfig = async () => {
    try {
      const response = await fetch('/api/sms/settings');
      if (response.ok) {
        const data = await response.json();
        setSmsConfigured(data.settings?.isActive || false);
      }
    } catch (error) {
      console.error('Erro ao verificar configuração SMS:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/sms/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const loadPromotions = async () => {
    try {
      const response = await fetch('/api/admin/marketing/promotions');
      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas promoções ativas com código de cupom
        const activePromos = (data.promotions || data || []).filter(
          (p: any) => p.isActive && p.code
        );
        setPromotions(activePromos);
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
    }
  };

  const loadContactLists = async () => {
    try {
      const response = await fetch('/api/sms/contact-lists');
      if (response.ok) {
        const data = await response.json();
        setContactLists(data.lists || []);
      }
    } catch (error) {
      console.error('Erro ao carregar listas de contatos:', error);
    }
  };

  const loadAudienceStats = async (audienceType: string) => {
    try {
      const response = await fetch(`/api/sms/campaigns/audience-stats?type=${audienceType}`);
      if (response.ok) {
        const data = await response.json();
        setAudienceStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      message: '',
      promotionId: '',
      contactListId: '',
      audienceType: 'all',
      scheduleType: 'now',
      scheduledFor: '',
      includePromoCode: true,
    });
    setEditingCampaign(null);
  };

  const handleOpenNewCampaign = () => {
    resetForm();
    setShowNewCampaignModal(true);
  };

  const handleEditCampaign = (campaign: SmsCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      message: campaign.message,
      promotionId: campaign.promotionId || '',
      contactListId: campaign.targetAudience?.contactListId || '',
      audienceType: campaign.targetAudience?.type || 'all',
      scheduleType: campaign.scheduledFor ? 'scheduled' : 'now',
      scheduledFor: campaign.scheduledFor ? format(new Date(campaign.scheduledFor), "yyyy-MM-dd'T'HH:mm") : '',
      includePromoCode: true,
    });
    setShowNewCampaignModal(true);
  };

  const handleSaveCampaign = async (sendNow: boolean = false) => {
    if (!formData.name.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Mensagem é obrigatória');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        message: previewMessage, // Usar mensagem com cupom já inserido
        promotionId: formData.promotionId || null,
        contactListId: formData.audienceType === 'list' ? formData.contactListId : null,
        targetAudience: {
          type: formData.audienceType,
          contactListId: formData.audienceType === 'list' ? formData.contactListId : undefined,
        },
        scheduledFor: formData.scheduleType === 'scheduled' ? formData.scheduledFor : null,
        status: sendNow ? 'sending' : (formData.scheduleType === 'scheduled' ? 'scheduled' : 'draft'),
      };

      const url = editingCampaign
        ? `/api/sms/campaigns/${editingCampaign.id}`
        : '/api/sms/campaigns';

      const response = await fetch(url, {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          sendNow
            ? 'Campanha enviada com sucesso!'
            : (editingCampaign ? 'Campanha atualizada!' : 'Campanha criada!')
        );
        setShowNewCampaignModal(false);
        resetForm();
        loadCampaigns();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar campanha');
      }
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      toast.error('Erro ao salvar campanha');
    } finally {
      setSaving(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja enviar esta campanha agora?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sms/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Campanha iniciada! Os SMS estão sendo enviados.');
        loadCampaigns();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar campanha');
      }
    } catch (error) {
      console.error('Erro ao enviar campanha:', error);
      toast.error('Erro ao enviar campanha');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sms/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Campanha excluída com sucesso!');
        loadCampaigns();
      } else {
        toast.error('Erro ao excluir campanha');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const handleDuplicateCampaign = async (campaign: SmsCampaign) => {
    setFormData({
      name: `${campaign.name} (Cópia)`,
      message: campaign.message,
      promotionId: campaign.promotionId || '',
      contactListId: campaign.targetAudience?.contactListId || '',
      audienceType: campaign.targetAudience?.type || 'all',
      scheduleType: 'now',
      scheduledFor: '',
      includePromoCode: true,
    });
    setEditingCampaign(null);
    setShowNewCampaignModal(true);
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      message: prev.message + variable
    }));
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = campaign.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      scheduled: { label: 'Agendada', variant: 'outline' },
      sending: { label: 'Enviando', variant: 'default' },
      completed: { label: 'Concluída', variant: 'default' },
      cancelled: { label: 'Cancelada', variant: 'destructive' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAudienceLabel = (type: string, listName?: string) => {
    const labels: Record<string, string> = {
      all: 'Todos os Clientes',
      active: 'Clientes Ativos (compraram nos últimos 30 dias)',
      inactive: 'Clientes Inativos (não compram há 60+ dias)',
      new: 'Novos Clientes (últimos 7 dias)',
      list: listName ? `Lista: ${listName}` : 'Lista de Contatos',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/marketing/sms-marketing')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Gift className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#FF6B00]">Campanhas Promocionais</h1>
            <p className="text-gray-600 mt-1">
              Envie SMS com cupons e promoções para seus clientes
            </p>
          </div>
        </div>
        <Button
          onClick={handleOpenNewCampaign}
          className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
          disabled={!smsConfigured}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Warning if SMS not configured */}
      {!smsConfigured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">SMS não configurado</p>
                <p className="text-sm text-yellow-800">
                  Configure o provedor de SMS nas configurações para criar campanhas.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => router.push('/admin/marketing/sms-marketing/settings')}
              >
                Configurar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Campanhas</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">SMS Enviados</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((acc, c) => acc + c.sentCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Ticket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Com Cupom</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.promotionId).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="sending">Enviando</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar seus filtros de busca'
                  : 'Crie sua primeira campanha promocional'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && smsConfigured && (
                <Button
                  onClick={handleOpenNewCampaign}
                  className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Campanha
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      campaign.promotionId
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {campaign.promotionId ? (
                        <Ticket className="h-6 w-6" />
                      ) : (
                        <MessageSquare className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{campaign.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {campaign.promotion && (
                          <Badge variant="outline" className="text-xs bg-purple-50">
                            <Tag className="h-3 w-3 mr-1" />
                            {campaign.promotion.code || campaign.promotion.name}
                            {' - '}
                            {campaign.promotion.discountType === 'PERCENTAGE'
                              ? `${campaign.promotion.discountValue}%`
                              : `R$ ${campaign.promotion.discountValue.toFixed(2)}`}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {getAudienceLabel(campaign.targetAudience?.type || 'all')}
                        </span>
                        {campaign.scheduledFor && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(campaign.scheduledFor), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Métricas */}
                    {(campaign.status === 'completed' || campaign.status === 'sending') && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">{campaign.sentCount}</span>
                          <span className="text-gray-500">enviados</span>
                        </div>
                        {campaign.failedCount > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">{campaign.failedCount}</span>
                            <span className="text-gray-500">falhas</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    {getStatusBadge(campaign.status)}

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendCampaign(campaign.id)}
                            title="Enviar agora"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCampaign(campaign)}
                            title="Editar campanha"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateCampaign(campaign)}
                        title="Duplicar campanha"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir campanha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nova Campanha */}
      <Dialog open={showNewCampaignModal} onOpenChange={setShowNewCampaignModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha Promocional'}
            </DialogTitle>
            <DialogDescription>
              Crie uma campanha de SMS com cupom ou código de desconto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Nome da Campanha */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input
                id="name"
                placeholder="Ex: Black Friday 2025"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Promoção/Cupom */}
            <div className="space-y-2">
              <Label>Promoção / Cupom de Desconto</Label>
              <Select
                value={formData.promotionId || 'none'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, promotionId: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma promoção (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem promoção</SelectItem>
                  {promotions.map((promo) => (
                    <SelectItem key={promo.id} value={promo.id}>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        <span>{promo.name}</span>
                        {promo.code && (
                          <Badge variant="outline" className="text-xs">
                            {promo.code}
                          </Badge>
                        )}
                        <span className="text-gray-500">
                          {promo.discountType === 'PERCENTAGE'
                            ? `${promo.discountValue}% OFF`
                            : `R$ ${promo.discountValue.toFixed(2)} OFF`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.promotionId && (
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    id="includeCode"
                    checked={formData.includePromoCode}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includePromoCode: checked }))}
                  />
                  <Label htmlFor="includeCode" className="text-sm">
                    Incluir código do cupom na mensagem automaticamente
                  </Label>
                </div>
              )}
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem SMS *</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem promocional..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                maxLength={160}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex gap-2">
                  <span>Variáveis:</span>
                  <button
                    type="button"
                    onClick={() => insertVariable('{NOME}')}
                    className="text-blue-600 hover:underline"
                  >
                    {'{NOME}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{CUPOM}')}
                    className="text-blue-600 hover:underline"
                  >
                    {'{CUPOM}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{DESCONTO}')}
                    className="text-blue-600 hover:underline"
                  >
                    {'{DESCONTO}'}
                  </button>
                </div>
                <span>{formData.message.length}/160 caracteres</span>
              </div>
            </div>

            {/* Preview */}
            {previewMessage && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview da Mensagem
                </Label>
                <div className="p-4 bg-gray-100 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-gray-400 mt-1" />
                    <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Público-alvo */}
            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <Select
                value={formData.audienceType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, audienceType: value, contactListId: value === 'list' ? prev.contactListId : '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Todos os Clientes
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      Clientes Ativos (compraram nos últimos 30 dias)
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-orange-600" />
                      Clientes Inativos (não compram há 60+ dias)
                    </div>
                  </SelectItem>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-purple-600" />
                      Novos Clientes (últimos 7 dias)
                    </div>
                  </SelectItem>
                  {contactLists.length > 0 && (
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Lista de Contatos Importada
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Seleção de Lista de Contatos */}
              {formData.audienceType === 'list' && (
                <div className="mt-2">
                  <Label className="text-sm">Selecionar Lista</Label>
                  <Select
                    value={formData.contactListId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contactListId: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Escolha uma lista de contatos" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          <div className="flex items-center gap-2">
                            <span>{list.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {list.validContacts} contatos válidos
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.contactListId && (
                    <p className="text-xs text-gray-500 mt-1">
                      {contactLists.find(l => l.id === formData.contactListId)?.validContacts || 0} contatos válidos serão incluídos
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs text-blue-600"
                    onClick={() => router.push('/admin/marketing/sms-marketing/listas')}
                  >
                    Gerenciar listas de contatos
                  </Button>
                </div>
              )}

              {formData.audienceType !== 'list' && (
                <p className="text-xs text-gray-500">
                  Estimativa: {audienceStats.withPhone} clientes com telefone cadastrado (de {audienceStats.total} total)
                </p>
              )}
            </div>

            {/* Agendamento */}
            <div className="space-y-2">
              <Label>Quando enviar?</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Salvar como rascunho</SelectItem>
                  <SelectItem value="scheduled">Agendar para data específica</SelectItem>
                </SelectContent>
              </Select>
              {formData.scheduleType === 'scheduled' && (
                <Input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewCampaignModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSaveCampaign(false)}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button
              onClick={() => handleSaveCampaign(true)}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              disabled={saving || audienceStats.withPhone === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              {saving ? 'Enviando...' : 'Enviar Agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

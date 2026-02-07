'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TooltipHelper } from '@/components/shared/TooltipHelper';
import {
  Loader2, Plus, Trash2, TestTube, Settings, CheckCircle, XCircle,
  Facebook, Chrome, Eye, ExternalLink, RefreshCw, Share2, Image as ImageIcon
} from 'lucide-react';

type CurrentUser = {
  id: string;
  role: string;
  managerLevel: string | null;
};

type Integration = {
  id: string;
  name: string | null;
  platform: string;
  type: string;
  apiKey: string | null;
  apiSecret: string | null;
  pixelId: string | null;
  measurementId: string | null;
  accessToken: string | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TrackingEvent = {
  id: string;
  eventType: string;
  pageUrl: string | null;
  referrer: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  platform: string | null;
  status: string;
  statusCode: number | null;
  errorMessage: string | null;
  createdAt: Date;
};

type SocialShareConfig = {
  id: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string;
  twitterCard: string;
  twitterSite: string | null;
  twitterCreator: string | null;
  siteName: string | null;
  locale: string;
  isActive: boolean;
};

interface PixelsAdsPageContentProps {
  currentUser: CurrentUser;
  integrations: Integration[];
}

const TRACKING_EVENTS = [
  { id: 'page_view', name: 'Visualização de Página', platforms: ['ga4', 'pixel', 'tiktok', 'pinterest', 'taboola'] },
  { id: 'sign_up', name: 'Cadastro', platforms: ['ga4', 'pixel', 'capi', 'tiktok', 'pinterest', 'taboola'] },
  { id: 'add_to_cart', name: 'Adicionar ao Carrinho', platforms: ['ga4', 'pixel', 'capi', 'ads', 'tiktok', 'pinterest', 'taboola'] },
  { id: 'view_cart', name: 'Visualizar Carrinho', platforms: ['ga4', 'ads', 'tiktok', 'pinterest'] },
  { id: 'begin_checkout', name: 'Iniciar Checkout', platforms: ['ga4', 'pixel', 'capi', 'ads', 'tiktok', 'pinterest', 'taboola'] },
  { id: 'purchase', name: 'Compra', platforms: ['ga4', 'pixel', 'capi', 'ads', 'tiktok', 'pinterest', 'taboola'] },
  { id: 'cart_abandonment', name: 'Abandono de Carrinho', platforms: ['pixel', 'capi', 'tiktok'] },
];

const PLATFORM_OPTIONS = [
  { value: 'FACEBOOK', label: 'Meta (Facebook/Instagram)', icon: Facebook, color: 'text-blue-600' },
  { value: 'GOOGLE_ANALYTICS', label: 'Google Analytics 4', icon: Chrome, color: 'text-green-600' },
  { value: 'GOOGLE_ADS', label: 'Google Ads', icon: Chrome, color: 'text-yellow-600' },
  { value: 'GOOGLE_TAG_MANAGER', label: 'Google Tag Manager', icon: Chrome, color: 'text-blue-500' },
  { value: 'TIKTOK', label: 'TikTok Ads', icon: Chrome, color: 'text-pink-500' },
  { value: 'TABOOLA', label: 'Taboola', icon: Chrome, color: 'text-orange-500' },
  { value: 'PINTEREST', label: 'Pinterest', icon: Chrome, color: 'text-red-600' },
];

export function PixelsAdsPageContent({
  currentUser,
  integrations: initialIntegrations,
}: PixelsAdsPageContentProps) {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [eventLogs, setEventLogs] = useState<TrackingEvent[]>([]);
  const [socialConfig, setSocialConfig] = useState<SocialShareConfig | null>(null);
  const [activeTab, setActiveTab] = useState('pixels');
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  const [formData, setFormData] = useState({
    platform: 'FACEBOOK',
    type: 'pixel',
    name: '',
    pixelId: '',
    measurementId: '',
    apiKey: '',
    accessToken: '',
    isActive: true,
  });

  const [socialFormData, setSocialFormData] = useState({
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: '',
    siteName: '',
    locale: 'pt_BR',
    isActive: true,
    platforms: ['meta', 'google', 'whatsapp', 'twitter'] as string[],
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Carregar logs de eventos
  useEffect(() => {
    fetchEventLogs();
    fetchSocialConfig();
  }, []);

  const fetchEventLogs = async (showFeedback = false) => {
    setLogsLoading(true);
    try {
      const response = await fetch('/api/admin/marketing/pixels/events');
      if (response.ok) {
        const data = await response.json();
        setEventLogs(data.events || []);
        if (showFeedback) {
          toast({ title: 'Atualizado', description: `${(data.events || []).length} evento(s) carregado(s)` });
        }
      } else {
        if (showFeedback) {
          toast({ title: 'Erro', description: 'Erro ao buscar logs de eventos', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      if (showFeedback) {
        toast({ title: 'Erro', description: 'Erro ao buscar logs de eventos', variant: 'destructive' });
      }
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchSocialConfig = async () => {
    try {
      const response = await fetch('/api/admin/marketing/pixels/social-config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setSocialConfig(data.config);
          const configExtra = data.config.config || {};
          setSocialFormData({
            ogTitle: data.config.ogTitle || '',
            ogDescription: data.config.ogDescription || '',
            ogImage: data.config.ogImage || '',
            ogType: data.config.ogType || 'website',
            twitterCard: data.config.twitterCard || 'summary_large_image',
            twitterSite: data.config.twitterSite || '',
            siteName: data.config.siteName || '',
            locale: data.config.locale || 'pt_BR',
            isActive: data.config.isActive ?? true,
            platforms: configExtra.platforms || ['meta', 'google', 'whatsapp', 'twitter'],
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar config social:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      platform: 'FACEBOOK',
      type: 'pixel',
      name: '',
      pixelId: '',
      measurementId: '',
      apiKey: '',
      accessToken: '',
      isActive: true
    });
    setEditingIntegration(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'products');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setSocialFormData(prev => ({ ...prev, ogImage: result.url }));
        toast({ title: 'Sucesso', description: 'Imagem enviada com sucesso' });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar imagem');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar imagem',
        variant: 'destructive',
      });
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const togglePlatform = (platform: string) => {
    setSocialFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      platform: integration.platform,
      type: integration.type,
      name: integration.name || '',
      pixelId: integration.pixelId || '',
      measurementId: integration.measurementId || '',
      apiKey: integration.apiKey || '',
      accessToken: integration.accessToken || '',
      isActive: integration.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const action = editingIntegration ? 'update_integration' : 'create_integration';
      const response = await fetch('/api/admin/marketing/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: {
            ...(editingIntegration && { id: editingIntegration.id }),
            platform: formData.platform,
            type: formData.type,
            name: formData.name || null,
            pixelId: formData.pixelId || null,
            measurementId: formData.measurementId || null,
            apiKey: formData.apiKey || null,
            accessToken: formData.accessToken || null,
            isActive: formData.isActive,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (editingIntegration) {
          setIntegrations(prev => prev.map(i => i.id === result.id ? result : i));
        } else {
          setIntegrations(prev => [...prev, result]);
        }
        toast({ title: 'Sucesso', description: editingIntegration ? 'Pixel atualizado' : 'Pixel adicionado' });
        setShowDialog(false);
        resetForm();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar pixel',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSocialConfig = async () => {
    setIsLoading(true);
    try {
      const { platforms, ...restFormData } = socialFormData;
      const response = await fetch('/api/admin/marketing/pixels/social-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: socialConfig ? 'update' : 'create',
          data: {
            ...(socialConfig && { id: socialConfig.id }),
            ...restFormData,
            config: { platforms },
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSocialConfig(result);
        toast({ title: 'Sucesso', description: 'Configuração de compartilhamento salva' });
        setShowSocialDialog(false);
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar configuração', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este pixel?')) return;
    try {
      const response = await fetch('/api/admin/marketing/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_integration', data: { id } }),
      });
      if (response.ok) {
        setIntegrations(prev => prev.filter(i => i.id !== id));
        toast({ title: 'Sucesso', description: 'Pixel removido' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (integration: Integration) => {
    try {
      const response = await fetch('/api/admin/marketing/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_integration',
          data: {
            id: integration.id,
            platform: integration.platform,
            type: integration.type,
            isActive: !integration.isActive
          },
        }),
      });
      if (response.ok) {
        setIntegrations(prev => prev.map(i =>
          i.id === integration.id ? { ...i, isActive: !i.isActive } : i
        ));
        toast({ title: 'Sucesso', description: `Pixel ${!integration.isActive ? 'ativado' : 'desativado'}` });
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao alterar status', variant: 'destructive' });
    }
  };

  const handleTestEvent = async (eventId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/marketing/pixels/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: eventId,
          testData: {
            value: 100,
            currency: 'EUR',
            pageUrl: window.location.href,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Evento de teste enviado',
          description: `Evento "${eventId}" disparado para ${result.platformsSent || 0} plataforma(s)`
        });
        // Atualizar logs
        fetchEventLogs();
      } else {
        throw new Error('Erro ao enviar evento');
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao enviar evento de teste', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformConfig = PLATFORM_OPTIONS.find(p => p.value === platform);
    return platformConfig || PLATFORM_OPTIONS[0];
  };

  const PixelCard = ({ integration }: { integration: Integration }) => {
    const platformConfig = getPlatformIcon(integration.platform);
    const Icon = platformConfig.icon;

    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${platformConfig.color}`} />
              <div>
                <p className="font-medium">
                  {integration.name || integration.pixelId || integration.measurementId}
                </p>
                <p className="text-xs text-gray-500">
                  {platformConfig.label} - {integration.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                {integration.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={integration.isActive}
                onCheckedChange={() => handleToggleActive(integration)}
              />
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(integration)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => handleDelete(integration.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-4xl font-black text-[#FF6B00]">Pixels e Anúncios</h1>
            <p className="mt-1 text-sm text-[#a16b45]">
              Configure pixels de rastreamento e conversões para suas campanhas
            </p>
          </div>
          <TooltipHelper text="Gerencie pixels de rastreamento do Facebook, Google Analytics e outras plataformas para acompanhar conversões e otimizar campanhas publicitárias" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowSocialDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartilhamento Social
          </Button>
          <TooltipHelper text="Configure botões de compartilhamento social para suas páginas e produtos" />
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">Gerenciamento de Rastreamento</span>
          <TooltipHelper text="Organize pixels, eventos de conversão, logs de rastreamento e ferramentas de teste" />
        </div>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pixels" className="flex items-center gap-2">
            Pixels
            <TooltipHelper text="Configure e gerencie pixels de rastreamento de diferentes plataformas (Facebook, Google, etc.)" />
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            Eventos
            <TooltipHelper text="Configure eventos de conversão para acompanhar ações dos usuários no site" />
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            Logs
            <TooltipHelper text="Visualize o histórico de eventos rastreados e status dos pixels" />
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            Teste
            <TooltipHelper text="Ferramentas para testar e validar o funcionamento dos pixels configurados" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pixels" className="space-y-6">
          <div className="flex justify-end items-center gap-2">
            <Button
              onClick={openAddDialog}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Pixel
            </Button>
            <TooltipHelper text="Configure um novo pixel de rastreamento conectando-se a plataformas como Facebook Pixel, Google Analytics, etc." />
          </div>

          {integrations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Nenhum pixel configurado. Clique em &quot;Adicionar Pixel&quot; para começar.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {integrations.map(integration => (
                <PixelCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">Configuração de Conversões</span>
            <TooltipHelper text="Configure quais eventos de conversão serão rastreados e enviados para cada plataforma de anúncios" />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Configuração de Eventos</CardTitle>
                <TooltipHelper text="Ative ou desative eventos específicos para cada plataforma de rastreamento conectada" />
              </div>
              <CardDescription>
                Defina quais eventos serão enviados para cada plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead className="text-center">GA4</TableHead>
                      <TableHead className="text-center">Pixel</TableHead>
                      <TableHead className="text-center">CAPI</TableHead>
                      <TableHead className="text-center">Ads</TableHead>
                      <TableHead className="text-center">TikTok</TableHead>
                      <TableHead className="text-center">Pinterest</TableHead>
                      <TableHead className="text-center">Taboola</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TRACKING_EVENTS.map(event => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        {['ga4', 'pixel', 'capi', 'ads', 'tiktok', 'pinterest', 'taboola'].map(platform => (
                          <TableCell key={platform} className="text-center">
                            {event.platforms.includes(platform) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">Monitoramento de Rastreamento</span>
            <TooltipHelper text="Acompanhe todos os eventos de rastreamento disparados e seu status de entrega" />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Log de Eventos Disparados</CardTitle>
                  <TooltipHelper text="Histórico completo de todos os eventos enviados para plataformas de rastreamento com detalhes técnicos" />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchEventLogs(true)} disabled={logsLoading}>
                    {logsLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar
                  </Button>
                  <TooltipHelper text="Atualize os logs mais recentes dos eventos de rastreamento" />
                </div>
              </div>
              <CardDescription>
                Histórico de eventos enviados para as plataformas com detalhes de origem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum evento registrado ainda
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Página</TableHead>
                        <TableHead>GCLID</TableHead>
                        <TableHead>FBCLID</TableHead>
                        <TableHead>Referrer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.eventType}</Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {log.platform?.toLowerCase() || '-'}
                          </TableCell>
                          <TableCell>
                            {log.status === 'sent' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enviado
                              </Badge>
                            ) : log.status === 'failed' ? (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Falhou
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {log.pageUrl ? (
                              <a
                                href={log.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {new URL(log.pageUrl).pathname}
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.gclid ? (
                              <span title={log.gclid}>
                                {log.gclid.substring(0, 10)}...
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.fbclid ? (
                              <span title={log.fbclid}>
                                {log.fbclid.substring(0, 10)}...
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs">
                            {log.referrer || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold text-[#333333] dark:text-[#f5f1e9]">Ferramentas de Validação</span>
            <TooltipHelper text="Teste e valide o funcionamento dos pixels e eventos de rastreamento configurados" />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Teste de Eventos</CardTitle>
                <TooltipHelper text="Dispare eventos de teste manualmente para verificar se os pixels estão funcionando corretamente" />
              </div>
              <CardDescription>
                Dispare eventos de teste para verificar se as integrações estão funcionando
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TRACKING_EVENTS.map(event => (
                  <Button
                    key={event.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleTestEvent(event.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    {event.name}
                  </Button>
                ))}
              </div>
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Dica:</strong> Use as ferramentas de desenvolvedor do Facebook (Events Manager)
                  e Google (Tag Assistant) para verificar se os eventos estão sendo recebidos corretamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar/editar pixel */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'Editar Pixel' : 'Adicionar Pixel'}
            </DialogTitle>
            <DialogDescription>
              Configure as credenciais do pixel/tag de rastreamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={formData.platform}
                onValueChange={value => setFormData(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Pixel Principal, GA4 Produção"
              />
            </div>

            {formData.platform === 'FACEBOOK' && (
              <>
                <div>
                  <Label htmlFor="pixelId">Pixel ID</Label>
                  <Input
                    id="pixelId"
                    value={formData.pixelId}
                    onChange={e => setFormData(prev => ({ ...prev, pixelId: e.target.value }))}
                    placeholder="Ex: 123456789012345"
                  />
                </div>
                <div>
                  <Label htmlFor="accessToken">Access Token (para CAPI)</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={formData.accessToken}
                    onChange={e => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                    placeholder="Opcional - necessário para Conversions API"
                  />
                </div>
              </>
            )}

            {(formData.platform === 'GOOGLE_ANALYTICS' || formData.platform === 'GOOGLE_TAG_MANAGER') && (
              <div>
                <Label htmlFor="measurementId">
                  {formData.platform === 'GOOGLE_TAG_MANAGER' ? 'Container ID' : 'Measurement ID'}
                </Label>
                <Input
                  id="measurementId"
                  value={formData.measurementId}
                  onChange={e => setFormData(prev => ({ ...prev, measurementId: e.target.value }))}
                  placeholder={
                    formData.platform === 'GOOGLE_TAG_MANAGER'
                      ? 'Ex: GTM-XXXXXXX'
                      : 'Ex: G-XXXXXXXXXX'
                  }
                />
              </div>
            )}

            {formData.platform === 'GOOGLE_ADS' && (
              <>
                <div>
                  <Label htmlFor="measurementId">Conversion ID</Label>
                  <Input
                    id="measurementId"
                    value={formData.measurementId}
                    onChange={e => setFormData(prev => ({ ...prev, measurementId: e.target.value }))}
                    placeholder="Ex: AW-123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">Conversion Label</Label>
                  <Input
                    id="apiKey"
                    value={formData.apiKey}
                    onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Ex: AbCdEfGhIjKlMnOp"
                  />
                </div>
              </>
            )}

            {(formData.platform === 'TIKTOK' || formData.platform === 'PINTEREST') && (
              <div>
                <Label htmlFor="pixelId">Pixel ID</Label>
                <Input
                  id="pixelId"
                  value={formData.pixelId}
                  onChange={e => setFormData(prev => ({ ...prev, pixelId: e.target.value }))}
                  placeholder={`Ex: ${formData.platform === 'TIKTOK' ? 'CXXXXXXXXXXXXXXX' : '2612345678901'}`}
                />
              </div>
            )}

            {formData.platform === 'TABOOLA' && (
              <div>
                <Label htmlFor="pixelId">Account ID</Label>
                <Input
                  id="pixelId"
                  value={formData.pixelId}
                  onChange={e => setFormData(prev => ({ ...prev, pixelId: e.target.value }))}
                  placeholder="Ex: 1234567"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para configuração de compartilhamento social */}
      <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhamento Social (Open Graph)
            </DialogTitle>
            <DialogDescription>
              Configure como seu site aparece quando compartilhado em redes sociais
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Plataformas */}
            <div>
              <Label className="mb-2 block">Plataformas Ativas</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'meta', label: 'Meta (Facebook / Instagram)', desc: 'og:title, og:description, og:image' },
                  { id: 'google', label: 'Google', desc: 'Structured data, og:title, og:description' },
                  { id: 'whatsapp', label: 'WhatsApp', desc: 'og:title, og:description, og:image' },
                  { id: 'twitter', label: 'Twitter / X', desc: 'twitter:card, twitter:title, twitter:image' },
                ].map(platform => (
                  <div
                    key={platform.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      socialFormData.platforms.includes(platform.id)
                        ? 'border-[#FF6B00] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        socialFormData.platforms.includes(platform.id)
                          ? 'bg-[#FF6B00] border-[#FF6B00]'
                          : 'border-gray-300'
                      }`}>
                        {socialFormData.platforms.includes(platform.id) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{platform.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-6">{platform.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="ogTitle">Título (og:title)</Label>
              <Input
                id="ogTitle"
                value={socialFormData.ogTitle}
                onChange={e => setSocialFormData(prev => ({ ...prev, ogTitle: e.target.value }))}
                placeholder="SushiWorld - Sushi de Qualidade"
              />
            </div>

            <div>
              <Label htmlFor="ogDescription">Descrição (og:description)</Label>
              <Textarea
                id="ogDescription"
                value={socialFormData.ogDescription}
                onChange={e => setSocialFormData(prev => ({ ...prev, ogDescription: e.target.value }))}
                placeholder="O melhor sushi da cidade, entregue na sua porta..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="ogImage">Imagem (og:image)</Label>
              <div className="flex gap-2">
                <Input
                  id="ogImage"
                  value={socialFormData.ogImage}
                  onChange={e => setSocialFormData(prev => ({ ...prev, ogImage: e.target.value }))}
                  placeholder="https://seusite.com/imagem-share.jpg"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recomendado: 1200x630 pixels. Cole a URL ou clique no ícone para fazer upload.
              </p>
              {socialFormData.ogImage && (
                <div className="mt-2 relative">
                  <img
                    src={socialFormData.ogImage}
                    alt="Preview OG"
                    className="w-full h-32 object-cover rounded border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="siteName">Nome do Site</Label>
              <Input
                id="siteName"
                value={socialFormData.siteName}
                onChange={e => setSocialFormData(prev => ({ ...prev, siteName: e.target.value }))}
                placeholder="SushiWorld"
              />
            </div>

            {/* Twitter/X - só mostrar se plataforma ativa */}
            {socialFormData.platforms.includes('twitter') && (
              <div>
                <Label htmlFor="twitterSite">Twitter/X @username</Label>
                <Input
                  id="twitterSite"
                  value={socialFormData.twitterSite}
                  onChange={e => setSocialFormData(prev => ({ ...prev, twitterSite: e.target.value }))}
                  placeholder="@sushiworld"
                />
              </div>
            )}

            <div>
              <Label htmlFor="locale">Idioma</Label>
              <Select
                value={socialFormData.locale}
                onValueChange={value => setSocialFormData(prev => ({ ...prev, locale: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt_BR">Português (Brasil)</SelectItem>
                  <SelectItem value="pt_PT">Português (Portugal)</SelectItem>
                  <SelectItem value="en_US">English (US)</SelectItem>
                  <SelectItem value="es_ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="socialActive"
                checked={socialFormData.isActive}
                onCheckedChange={checked => setSocialFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="socialActive">Ativo</Label>
            </div>

            {/* Preview */}
            {(socialFormData.ogTitle || socialFormData.ogDescription || socialFormData.ogImage) && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">Preview (como aparece nas redes sociais):</p>
                {socialFormData.ogImage && (
                  <img
                    src={socialFormData.ogImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <p className="font-semibold text-sm">{socialFormData.ogTitle || 'Título'}</p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {socialFormData.ogDescription || 'Descrição do site...'}
                </p>
                <p className="text-xs text-gray-400 mt-1">{socialFormData.siteName || 'seusite.com'}</p>
                <div className="flex gap-1 mt-2">
                  {socialFormData.platforms.map(p => (
                    <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSocialDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSocialConfig} disabled={isLoading} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

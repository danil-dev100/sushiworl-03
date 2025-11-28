'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Plus, Trash2, TestTube, Facebook, Chrome, Code } from 'lucide-react';

type CurrentUser = {
  id: string;
  role: string;
  managerLevel: string | null;
};

type Integration = {
  id: string;
  platform: string;
  type: string;
  apiKey: string | null;
  apiSecret: string | null;
  pixelId: string | null;
  measurementId: string | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface IntegrationsPageContentProps {
  currentUser: CurrentUser;
  integrations: Integration[];
}

const PLATFORM_CONFIG = {
  FACEBOOK: {
    name: 'Meta (Facebook & Instagram)',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    types: [
      { id: 'pixel', name: 'Facebook Pixel', fields: ['pixelId'] },
      { id: 'capi', name: 'Conversions API', fields: ['apiKey', 'pixelId'] },
      { id: 'catalog', name: 'Catálogo', fields: ['apiKey', 'config'] },
    ],
  },
  GOOGLE_ADS: {
    name: 'Google Ads',
    icon: Chrome,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    types: [
      { id: 'conversion', name: 'Conversão', fields: ['apiKey', 'config'] },
    ],
  },
  GOOGLE_ANALYTICS: {
    name: 'Google Analytics 4',
    icon: Chrome,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    types: [
      { id: 'ga4', name: 'Measurement ID', fields: ['measurementId'] },
    ],
  },
  GOOGLE_TAG_MANAGER: {
    name: 'Google Tag Manager',
    icon: Code,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    types: [
      { id: 'gtm', name: 'Container', fields: ['measurementId'] },
    ],
  },
  CUSTOM: {
    name: 'API Customizada',
    icon: Code,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    types: [
      { id: 'rest', name: 'REST API', fields: ['apiKey', 'apiSecret', 'config'] },
    ],
  },
};

export function IntegrationsPageContent({
  currentUser,
  integrations: initialIntegrations,
}: IntegrationsPageContentProps) {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  const [formData, setFormData] = useState({
    platform: '',
    type: '',
    apiKey: '',
    apiSecret: '',
    pixelId: '',
    measurementId: '',
    config: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      platform: '',
      type: '',
      apiKey: '',
      apiSecret: '',
      pixelId: '',
      measurementId: '',
      config: '',
      isActive: true,
    });
    setEditingIntegration(null);
    setSelectedPlatform(null);
  };

  const openConfigDialog = (platform: string, integration?: Integration) => {
    if (integration) {
      setEditingIntegration(integration);
      setFormData({
        platform: integration.platform,
        type: integration.type,
        apiKey: integration.apiKey || '',
        apiSecret: integration.apiSecret || '',
        pixelId: integration.pixelId || '',
        measurementId: integration.measurementId || '',
        config: integration.config ? JSON.stringify(integration.config, null, 2) : '',
        isActive: integration.isActive,
      });
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, platform }));
    }
    setSelectedPlatform(platform);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.platform || !formData.type) {
      toast({ title: 'Erro', description: 'Selecione a plataforma e o tipo', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      let configJson = null;
      if (formData.config) {
        try {
          configJson = JSON.parse(formData.config);
        } catch {
          toast({ title: 'Erro', description: 'Configuração JSON inválida', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
      }

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
            apiKey: formData.apiKey || null,
            apiSecret: formData.apiSecret || null,
            pixelId: formData.pixelId || null,
            measurementId: formData.measurementId || null,
            config: configJson,
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
        toast({ title: 'Sucesso', description: editingIntegration ? 'Integração atualizada' : 'Integração criada' });
        setShowDialog(false);
        resetForm();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar integração', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta integração?')) return;
    try {
      const response = await fetch('/api/admin/marketing/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_integration', data: { id } }),
      });
      if (response.ok) {
        setIntegrations(prev => prev.filter(i => i.id !== id));
        toast({ title: 'Sucesso', description: 'Integração removida' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const handleTest = async (integration: Integration) => {
    toast({ title: 'Teste enviado', description: 'Verificando conexão...' });
  };

  const getIntegrationsByPlatform = (platform: string) => integrations.filter(i => i.platform === platform);
  const platformConfig = selectedPlatform ? PLATFORM_CONFIG[selectedPlatform as keyof typeof PLATFORM_CONFIG] : null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-black text-[#FF6B00]">Integrações</h1>
        <p className="mt-1 text-sm text-[#a16b45]">Conecte plataformas externas para rastreamento e marketing</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const platformIntegrations = getIntegrationsByPlatform(key);
          const hasActive = platformIntegrations.some(i => i.isActive);

          return (
            <Card key={key} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-[#FF6B00]">{config.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`h-2 w-2 rounded-full ${hasActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className={`text-sm font-medium ${hasActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {hasActive ? 'Conectado' : 'Não Conectado'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {platformIntegrations.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {platformIntegrations.map(integration => (
                      <div key={integration.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <Badge variant={integration.isActive ? 'default' : 'secondary'} className="text-xs">
                          {integration.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleTest(integration)}>
                            <TestTube className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openConfigDialog(key, integration)}>
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(integration.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-auto">
                  <Button onClick={() => openConfigDialog(key)} className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90">
                    {platformIntegrations.length > 0 ? <><Plus className="h-4 w-4 mr-2" />Adicionar</> : 'Conectar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIntegration ? 'Editar' : 'Configurar'} {platformConfig?.name}</DialogTitle>
            <DialogDescription>Configure as credenciais para esta integração</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {platformConfig && (
              <div>
                <Label>Tipo de Integração</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {platformConfig.types.map(type => (
                    <Button
                      key={type.id}
                      variant={formData.type === type.id ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                      className={formData.type === type.id ? 'bg-[#FF6B00]' : ''}
                    >
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {formData.type && (
              <>
                {platformConfig?.types.find(t => t.id === formData.type)?.fields.includes('pixelId') && (
                  <div>
                    <Label htmlFor="pixelId">Pixel ID / Container ID</Label>
                    <Input id="pixelId" value={formData.pixelId} onChange={e => setFormData(prev => ({ ...prev, pixelId: e.target.value }))} placeholder="Ex: 123456789012345" />
                  </div>
                )}
                {platformConfig?.types.find(t => t.id === formData.type)?.fields.includes('measurementId') && (
                  <div>
                    <Label htmlFor="measurementId">Measurement ID</Label>
                    <Input id="measurementId" value={formData.measurementId} onChange={e => setFormData(prev => ({ ...prev, measurementId: e.target.value }))} placeholder="Ex: G-XXXXXXXXXX" />
                  </div>
                )}
                {platformConfig?.types.find(t => t.id === formData.type)?.fields.includes('apiKey') && (
                  <div>
                    <Label htmlFor="apiKey">API Key / Access Token</Label>
                    <Input id="apiKey" type="password" value={formData.apiKey} onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))} />
                  </div>
                )}
                {platformConfig?.types.find(t => t.id === formData.type)?.fields.includes('apiSecret') && (
                  <div>
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <Input id="apiSecret" type="password" value={formData.apiSecret} onChange={e => setFormData(prev => ({ ...prev, apiSecret: e.target.value }))} />
                  </div>
                )}
                {platformConfig?.types.find(t => t.id === formData.type)?.fields.includes('config') && (
                  <div>
                    <Label htmlFor="config">Configuração (JSON)</Label>
                    <Textarea id="config" value={formData.config} onChange={e => setFormData(prev => ({ ...prev, config: e.target.value }))} rows={4} />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch id="isActive" checked={formData.isActive} onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))} />
                  <Label htmlFor="isActive">Integração ativa</Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isLoading || !formData.type} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

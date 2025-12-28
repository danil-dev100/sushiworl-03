'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  QrCode,
  Copy,
  Check,
  BarChart3,
  Apple,
  Smartphone,
  ExternalLink,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppStats {
  summary: {
    totalClicks: number;
    totalInstalls: number;
    conversionRate: string;
  };
  byDevice: Array<{ device: string; count: number }>;
  byUTMSource: Array<{ source: string; count: number }>;
}

export function AppDownloadPage() {
  const [androidLink, setAndroidLink] = useState('');
  const [iosLink, setIOSLink] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [campaignName, setCampaignName] = useState('');

  const baseURL = typeof window !== 'undefined' ? window.location.origin : '';

  // Gerar link Android
  const generateAndroidLink = () => {
    const campaign = campaignName || 'default';
    const params = new URLSearchParams({
      utm_source: 'qr',
      utm_medium: 'android_app',
      utm_campaign: campaign,
    });

    const link = `${baseURL}/?${params.toString()}`;
    setAndroidLink(link);

    // Gerar QR Code
    generateQRCode(link, 'qr-android');
  };

  // Gerar link iOS
  const generateIOSLink = () => {
    const campaign = campaignName || 'default';
    const params = new URLSearchParams({
      utm_source: 'qr',
      utm_medium: 'ios_app',
      utm_campaign: campaign,
    });

    const link = `${baseURL}/?${params.toString()}`;
    setIOSLink(link);

    // Gerar QR Code
    generateQRCode(link, 'qr-ios');
  };

  // Gerar QR Code
  const generateQRCode = async (url: string, elementId: string) => {
    // Importar QRCodeStyling dinamicamente apenas no cliente
    const QRCodeStyling = (await import('qr-code-styling')).default;

    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      data: url,
      dotsOptions: {
        color: '#FF6B00',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 5,
      },
      cornersSquareOptions: {
        color: '#333333',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#FF6B00',
      },
    });

    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = '';
      qrCode.append(container);
    }
  };

  // Copiar link
  const copyLink = (link: string, type: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(type);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Baixar QR Code
  const downloadQRCode = (type: 'android' | 'ios') => {
    const elementId = type === 'android' ? 'qr-android' : 'qr-ios';
    const canvas = document.querySelector(`#${elementId} canvas`);

    if (canvas instanceof HTMLCanvasElement) {
      const link = document.createElement('a');
      link.download = `qr-code-${type}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('QR Code baixado!');
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pwa/track-install');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Download de Apps
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gere links de instalação com UTM tracking e QR codes personalizados
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Gerar Links</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tab: Gerar Links */}
        <TabsContent value="generate" className="space-y-6">
          {/* Configuração de Campanha */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Campanha</CardTitle>
              <CardDescription>
                Defina um nome para rastrear esta campanha nas métricas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="campaign">Nome da Campanha (opcional)</Label>
                <Input
                  id="campaign"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="ex: promo_natal, qr_loja, banner_instagram"
                />
              </div>
            </CardContent>
          </Card>

          {/* Android */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Android App</CardTitle>
                  <CardDescription>Link para instalação em dispositivos Android</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateAndroidLink}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Gerar Link para Android
              </Button>

              {androidLink && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={androidLink} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyLink(androidLink, 'android')}
                    >
                      {copiedLink === 'android' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <div id="qr-android" className="mb-4"></div>
                    <Button variant="outline" onClick={() => downloadQRCode('android')}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar QR Code
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Como usar no Android:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Acesse o link ou escaneie o QR code</li>
                          <li>Toque no menu (⋮) e selecione "Adicionar à tela inicial"</li>
                          <li>Confirme a instalação</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* iOS */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Apple className="h-5 w-5 text-gray-900" />
                </div>
                <div>
                  <CardTitle>iOS App</CardTitle>
                  <CardDescription>Link para instalação em iPhone/iPad</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateIOSLink}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Gerar Link para iOS
              </Button>

              {iosLink && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={iosLink} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyLink(iosLink, 'ios')}
                    >
                      {copiedLink === 'ios' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <div id="qr-ios" className="mb-4"></div>
                    <Button variant="outline" onClick={() => downloadQRCode('ios')}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar QR Code
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Como usar no iOS:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Abra o link no Safari (não funciona no Chrome)</li>
                          <li>Toque no botão "Compartilhar" (ícone de seta)</li>
                          <li>Selecione "Adicionar à Tela de Início"</li>
                          <li>Confirme tocando em "Adicionar"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Link PWABuilder */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">PWABuilder (Opcional)</CardTitle>
              <CardDescription>
                Para gerar APK nativo do Android via PWABuilder oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir PWABuilder
                </a>
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Cole a URL do site ({baseURL}) para gerar APK assinado digitalmente
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
                </div>
              </CardContent>
            </Card>
          ) : stats ? (
            <>
              {/* Resumo */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Total de Cliques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.summary.totalClicks}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Instalações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.summary.totalInstalls}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Taxa de Conversão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="text-2xl font-bold">{stats.summary.conversionRate}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Por Dispositivo */}
              <Card>
                <CardHeader>
                  <CardTitle>Por Dispositivo</CardTitle>
                  <CardDescription>Distribuição de cliques por tipo de dispositivo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.byDevice.map((device) => (
                      <div key={device.device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{device.device}</Badge>
                        </div>
                        <span className="font-semibold">{device.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Por UTM Source */}
              {stats.byUTMSource.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Por Origem (UTM Source)</CardTitle>
                    <CardDescription>Cliques por origem de campanha</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.byUTMSource.map((source) => (
                        <div key={source.source} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{source.source}</Badge>
                          </div>
                          <span className="font-semibold">{source.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={loadStats} variant="outline" className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                Atualizar Estatísticas
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Nenhum dado disponível ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

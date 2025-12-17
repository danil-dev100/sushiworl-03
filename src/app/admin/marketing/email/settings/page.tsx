'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  TestTube,
  Save,
  Mail,
  Shield,
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SMTPSettings {
  smtpServer: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  useTls: boolean;
  defaultFromName: string;
  defaultFromEmail: string;
  minDelaySeconds: string;
  maxDelaySeconds: string;
  maxEmailsPerHour: string;
  emailRetentionDays: string;
}

interface RetentionSettings {
  value: string;
  unit: 'days' | 'months' | 'years';
}

export default function EmailMarketingSettingsPage() {
  const [settings, setSettings] = useState<SMTPSettings>({
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    useTls: true,
    defaultFromName: 'SushiWorld',
    defaultFromEmail: 'pedidos@sushiworld.com',
    minDelaySeconds: '60',
    maxDelaySeconds: '300',
    maxEmailsPerHour: '100',
    emailRetentionDays: '30',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [retention, setRetention] = useState<RetentionSettings>({
    value: '30',
    unit: 'days'
  });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/email-marketing/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          ...settings,
          ...data.settings,
        });
      } else {
        console.error('Erro ao carregar configurações');
        // Mantém valores padrão
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validações
    if (!settings.smtpServer.trim()) {
      toast.error('Servidor SMTP é obrigatório');
      return;
    }

    if (!settings.smtpPort.trim()) {
      toast.error('Porta SMTP é obrigatória');
      return;
    }

    if (!settings.smtpUser.trim()) {
      toast.error('Usuário SMTP é obrigatório');
      return;
    }

    if (!settings.smtpPassword.trim()) {
      toast.error('Senha SMTP é obrigatória');
      return;
    }

    if (!settings.defaultFromName.trim()) {
      toast.error('Nome do remetente é obrigatório');
      return;
    }

    if (!settings.defaultFromEmail.trim()) {
      toast.error('Email do remetente é obrigatório');
      return;
    }

    if (!settings.defaultFromEmail.includes('@')) {
      toast.error('Email do remetente deve ser válido');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/email-marketing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Converter dias para a unidade selecionada ao carregar
  const convertDaysToUnit = (days: string, unit: 'days' | 'months' | 'years'): string => {
    const numDays = parseInt(days);
    switch (unit) {
      case 'months':
        return String(Math.round(numDays / 30));
      case 'years':
        return String(Math.round(numDays / 365));
      default:
        return days;
    }
  };

  // Converter a unidade selecionada para dias
  const convertUnitToDays = (value: string, unit: 'days' | 'months' | 'years'): string => {
    const numValue = parseInt(value);
    switch (unit) {
      case 'months':
        return String(numValue * 30);
      case 'years':
        return String(numValue * 365);
      default:
        return value;
    }
  };

  // Função para baixar lista de contatos
  const handleDownloadContacts = async () => {
    try {
      setDownloading(true);
      const response = await fetch('/api/email-marketing/export-contacts');

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contatos-sushiworld-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Lista de contatos baixada com sucesso!');
      } else {
        toast.error('Erro ao baixar lista de contatos');
      }
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar lista de contatos');
    } finally {
      setDownloading(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!settings.smtpServer.trim() || !settings.smtpUser.trim() || !settings.smtpPassword.trim()) {
      toast.error('Preencha todos os campos SMTP antes de testar');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/email-marketing/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpServer: settings.smtpServer,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPassword: settings.smtpPassword,
          useTls: settings.useTls,
          to: settings.defaultFromEmail, // Envia para si mesmo como teste
          subject: 'Teste de Configuração SMTP - SushiWorld',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #FF6B00;">✅ Teste de SMTP - SushiWorld</h2>
              <p>Se você recebeu este email, suas configurações SMTP estão funcionando corretamente!</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Configurações testadas:</strong><br>
                Servidor: ${settings.smtpServer}<br>
                Porta: ${settings.smtpPort}<br>
                TLS: ${settings.useTls ? 'Sim' : 'Não'}<br>
                Usuário: ${settings.smtpUser}<br>
                Remetente: ${settings.defaultFromName} &lt;${settings.defaultFromEmail}&gt;
              </div>
              <p style="color: #666; font-size: 12px;">
                Este é um email de teste automático enviado pelo sistema de Email Marketing do SushiWorld.
              </p>
            </div>
          `,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: '✅ Conexão SMTP estabelecida com sucesso! Email de teste enviado.',
        });
        toast.success('Email de teste enviado com sucesso!');
      } else {
        setTestResult({
          success: false,
          message: result.message || '❌ Erro na conexão SMTP. Verifique suas configurações.',
        });
        toast.error('Erro no teste SMTP');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      setTestResult({
        success: false,
        message: '❌ Erro ao conectar com o servidor SMTP.',
      });
      toast.error('Erro ao testar conexão SMTP');
    } finally {
      setTesting(false);
    }
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
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#FF6B00]">Configurações de Email</h1>
          <p className="text-gray-600 mt-1">
            Configure o servidor SMTP e parâmetros de envio
          </p>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Anti-spam
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Limites
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Retenção
          </TabsTrigger>
        </TabsList>

        {/* Tab SMTP */}
        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações do Servidor SMTP
              </CardTitle>
              <CardDescription>
                Configure as credenciais do seu provedor de email (Gmail, Outlook, Hostinger, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">Servidor SMTP *</Label>
                  <Input
                    id="smtpServer"
                    value={settings.smtpServer}
                    onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                  <p className="text-xs text-gray-500">
                    Endereço do servidor SMTP do seu provedor
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta *</Label>
                  <Select
                    value={settings.smtpPort}
                    onValueChange={(value) => setSettings({ ...settings, smtpPort: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a porta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="587">587 (TLS - Recomendado)</SelectItem>
                      <SelectItem value="465">465 (SSL)</SelectItem>
                      <SelectItem value="25">25 (Não seguro)</SelectItem>
                      <SelectItem value="2525">2525 (Alternativo)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Porta recomendada: 587 para TLS
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Usuário *</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    placeholder="seu-email@gmail.com"
                  />
                  <p className="text-xs text-gray-500">
                    Geralmente o mesmo que seu email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Senha *</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                    placeholder="Sua senha ou App Password"
                  />
                  <p className="text-xs text-gray-500">
                    Para Gmail, use uma App Password
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="useTls"
                  checked={settings.useTls}
                  onCheckedChange={(checked) => setSettings({ ...settings, useTls: checked })}
                />
                <Label htmlFor="useTls" className="flex items-center gap-2">
                  Usar TLS/STARTTLS
                  <span className="text-xs text-gray-500">(Recomendado para segurança)</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Remetente</CardTitle>
              <CardDescription>
                Como seus emails aparecerão na caixa de entrada do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nome do Remetente *</Label>
                  <Input
                    id="fromName"
                    value={settings.defaultFromName}
                    onChange={(e) => setSettings({ ...settings, defaultFromName: e.target.value })}
                    placeholder="SushiWorld"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email do Remetente *</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.defaultFromEmail}
                    onChange={(e) => setSettings({ ...settings, defaultFromEmail: e.target.value })}
                    placeholder="pedidos@sushiworld.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teste de Conexão */}
          <Card>
            <CardHeader>
              <CardTitle>Teste de Conexão</CardTitle>
              <CardDescription>
                Verifique se suas configurações SMTP estão funcionando corretamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleTestSMTP}
                  disabled={testing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Conexão SMTP
                    </>
                  )}
                </Button>

                {testResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    testResult.success
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="text-sm">{testResult.message}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Dicas de Configuração:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>Gmail:</strong> Use smtp.gmail.com:587, ative App Password</li>
                  <li><strong>Outlook:</strong> Use smtp-mail.outlook.com:587</li>
                  <li><strong>Hostinger:</strong> Use smtp.hostinger.com:587</li>
                  <li><strong>Para segurança:</strong> Sempre use TLS e App Passwords quando disponível</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Anti-spam */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Headers Anti-spam
              </CardTitle>
              <CardDescription>
                Configurações para evitar que seus emails caiam no spam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">DKIM</h4>
                    <p className="text-sm text-gray-600">
                      Assinatura digital para verificar autenticidade
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ativo
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">SPF</h4>
                    <p className="text-sm text-gray-600">
                      Framework de política do remetente
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ativo
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">DMARC</h4>
                    <p className="text-sm text-gray-600">
                      Política de autenticação de mensagens
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ativo
                  </Badge>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Importante:</h4>
                <p className="text-sm text-yellow-800">
                  Certifique-se de que seu domínio tem registros DKIM, SPF e DMARC configurados.
                  Isso é crucial para evitar que seus emails caiam no spam.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Limites */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Controle de Envio
              </CardTitle>
              <CardDescription>
                Configure limites e intervalos para evitar bloqueios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minDelay">Delay Mínimo (segundos)</Label>
                  <Input
                    id="minDelay"
                    type="number"
                    value={settings.minDelaySeconds}
                    onChange={(e) => setSettings({ ...settings, minDelaySeconds: e.target.value })}
                    min="0"
                    max="3600"
                  />
                  <p className="text-xs text-gray-500">
                    Tempo mínimo entre envios
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDelay">Delay Máximo (segundos)</Label>
                  <Input
                    id="maxDelay"
                    type="number"
                    value={settings.maxDelaySeconds}
                    onChange={(e) => setSettings({ ...settings, maxDelaySeconds: e.target.value })}
                    min="0"
                    max="3600"
                  />
                  <p className="text-xs text-gray-500">
                    Tempo máximo entre envios
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPerHour">Limite por Hora</Label>
                  <Input
                    id="maxPerHour"
                    type="number"
                    value={settings.maxEmailsPerHour}
                    onChange={(e) => setSettings({ ...settings, maxEmailsPerHour: e.target.value })}
                    min="1"
                    max="1000"
                  />
                  <p className="text-xs text-gray-500">
                    Máximo de emails por hora
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Recomendações:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Delay mínimo: 60 segundos (respeita limites de provedores)</li>
                  <li>• Delay máximo: 300 segundos (evita picos de envio)</li>
                  <li>• Limite por hora: 100 (seguro para começar)</li>
                  <li>• Aumente gradualmente conforme sua reputação cresce</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Retenção */}
        <TabsContent value="retention" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Retenção de Dados
              </CardTitle>
              <CardDescription>
                Configure quanto tempo manter dados de emails no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="retention">Período de Retenção</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="retention"
                    type="number"
                    value={retention.value}
                    onChange={(e) => {
                      const newRetention = { ...retention, value: e.target.value };
                      setRetention(newRetention);
                      setSettings({
                        ...settings,
                        emailRetentionDays: convertUnitToDays(e.target.value, retention.unit)
                      });
                    }}
                    min="1"
                    max={retention.unit === 'years' ? '10' : retention.unit === 'months' ? '120' : '3650'}
                  />
                  <Select
                    value={retention.unit}
                    onValueChange={(value: 'days' | 'months' | 'years') => {
                      const newRetention = {
                        value: convertDaysToUnit(settings.emailRetentionDays, value),
                        unit: value
                      };
                      setRetention(newRetention);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Dias</SelectItem>
                      <SelectItem value="months">Meses</SelectItem>
                      <SelectItem value="years">Anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500">
                  Emails serão automaticamente deletados após este período ({settings.emailRetentionDays} dias)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Logs de Envio</h4>
                    <p className="text-sm text-gray-600">
                      Histórico de emails enviados
                    </p>
                  </div>
                  <Badge variant="outline">Mantidos</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Relatórios</h4>
                    <p className="text-sm text-gray-600">
                      Estatísticas e métricas
                    </p>
                  </div>
                  <Badge variant="outline">Mantidos</Badge>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium mb-2">💾 O que é mantido:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Logs de envio (quem, quando, status)</li>
                  <li>• Estatísticas de abertura e cliques</li>
                  <li>• Relatórios de campanhas</li>
                  <li>• Configurações de fluxos (não os emails em si)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Exportar Contatos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Exportar Base de Contatos
              </CardTitle>
              <CardDescription>
                Baixe a lista completa de emails, nomes e telefones dos seus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📊 O que será exportado:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Nome completo do cliente</li>
                  <li>• Email</li>
                  <li>• Telefone</li>
                  <li>• Data do primeiro pedido</li>
                  <li>• Total de pedidos realizados</li>
                  <li>• Valor total gasto</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Formato do arquivo</h4>
                  <p className="text-sm text-gray-600">
                    CSV compatível com Excel, Google Sheets e ferramentas de email marketing
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  CSV/Excel
                </Badge>
              </div>

              <Button
                onClick={handleDownloadContacts}
                disabled={downloading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando arquivo...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Baixar Lista de Contatos
                  </>
                )}
              </Button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ LGPD - Uso Responsável:</h4>
                <p className="text-sm text-yellow-800">
                  Os dados dos clientes são confidenciais. Use apenas para fins legítimos de marketing,
                  como campanhas de email, SMS ou análise de dados. Nunca compartilhe ou venda esta lista.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

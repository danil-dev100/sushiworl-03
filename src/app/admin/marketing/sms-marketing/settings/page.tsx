'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings,
  TestTube,
  Save,
  MessageSquare,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface SMSSettings {
  provider: 'twilio' | 'd7';
  twilioAccountSid: string;
  twilioAuthToken: string;
  d7ApiKey: string;
  fromNumber: string;
  maxSmsPerHour: string;
  isActive: boolean;
}

export default function SMSMarketingSettingsPage() {
  const [settings, setSettings] = useState<SMSSettings>({
    provider: 'twilio',
    twilioAccountSid: '',
    twilioAuthToken: '',
    d7ApiKey: '',
    fromNumber: '',
    maxSmsPerHour: '100',
    isActive: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [testNumber, setTestNumber] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/sms/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            provider: data.settings.provider || 'twilio',
            twilioAccountSid: data.settings.twilioAccountSid || '',
            twilioAuthToken: data.settings.twilioAuthToken || '',
            d7ApiKey: data.settings.d7ApiKey || '',
            fromNumber: data.settings.fromNumber || '',
            maxSmsPerHour: String(data.settings.maxSmsPerHour || 100),
            isActive: data.settings.isActive || false,
          });
        }
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
    if (settings.provider === 'twilio') {
      if (!settings.twilioAccountSid.trim()) {
        toast.error('Account SID do Twilio é obrigatório');
        return;
      }
      if (!settings.twilioAuthToken.trim()) {
        toast.error('Auth Token do Twilio é obrigatório');
        return;
      }
    } else {
      if (!settings.d7ApiKey.trim()) {
        toast.error('API Key do D7 é obrigatória');
        return;
      }
    }

    if (!settings.fromNumber.trim()) {
      toast.error('Número de origem é obrigatório');
      return;
    }

    // Validar formato do número
    if (!settings.fromNumber.startsWith('+')) {
      toast.error('Número de origem deve começar com + (ex: +351912345678)');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/sms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Configurações de SMS salvas com sucesso! O nó "Enviar SMS" agora está ativo no construtor de fluxos.');
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

  const handleTestSMS = async () => {
    if (!testNumber.trim()) {
      toast.error('Digite um número de telefone para teste');
      return;
    }

    if (!testNumber.startsWith('+')) {
      toast.error('Número deve começar com + (ex: +351912345678)');
      return;
    }

    // Validar configurações antes de testar
    if (settings.provider === 'twilio') {
      if (!settings.twilioAccountSid.trim() || !settings.twilioAuthToken.trim()) {
        toast.error('Configure o Twilio antes de testar');
        return;
      }
    } else {
      if (!settings.d7ApiKey.trim()) {
        toast.error('Configure o D7 antes de testar');
        return;
      }
    }

    if (!settings.fromNumber.trim()) {
      toast.error('Configure o número de origem antes de testar');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testNumber,
          message: '✅ Teste de SMS - SushiWorld. Se você recebeu esta mensagem, suas configurações estão funcionando!',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: '✅ SMS de teste enviado com sucesso! Verifique seu telefone.',
        });
        toast.success('SMS de teste enviado!');
      } else {
        setTestResult({
          success: false,
          message: result.error || '❌ Erro ao enviar SMS. Verifique suas configurações.',
        });
        toast.error('Erro no teste de SMS');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      setTestResult({
        success: false,
        message: '❌ Erro ao conectar com o provedor de SMS.',
      });
      toast.error('Erro ao testar envio de SMS');
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
        <div className="p-2 bg-green-100 rounded-lg">
          <Smartphone className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#FF6B00]">Configurações de SMS</h1>
          <p className="text-gray-600 mt-1">
            Configure o provedor de SMS (Twilio ou D7 Networks)
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={settings.isActive ? "default" : "secondary"} className={settings.isActive ? "bg-green-600" : ""}>
          {settings.isActive ? '✅ SMS Ativo' : '❌ SMS Inativo'}
        </Badge>
        {settings.isActive && (
          <span className="text-sm text-gray-600">
            O nó "Enviar SMS" está disponível no construtor de fluxos
          </span>
        )}
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Provedor de SMS
          </CardTitle>
          <CardDescription>
            Escolha entre Twilio ou D7 Networks para envio de SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Selecione o Provedor</Label>
            <Select
              value={settings.provider}
              onValueChange={(value: 'twilio' | 'd7') => setSettings({ ...settings, provider: value })}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Twilio</span>
                    <Badge variant="outline" className="text-xs">Popular</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="d7">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">D7 Networks</span>
                    <Badge variant="outline" className="text-xs">Econômico</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Twilio Config */}
          {settings.provider === 'twilio' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium flex items-center gap-2">
                <img src="https://www.twilio.com/favicon.ico" alt="Twilio" className="w-4 h-4" />
                Configurações do Twilio
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twilioSid">Account SID *</Label>
                  <Input
                    id="twilioSid"
                    value={settings.twilioAccountSid}
                    onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-gray-500">
                    Encontre em console.twilio.com → Account Info
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioToken">Auth Token *</Label>
                  <Input
                    id="twilioToken"
                    type="password"
                    value={settings.twilioAuthToken}
                    onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                    placeholder="Seu Auth Token"
                  />
                  <p className="text-xs text-gray-500">
                    Token de autenticação da sua conta
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* D7 Config */}
          {settings.provider === 'd7' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Configurações do D7 Networks</h4>
              <div className="space-y-2">
                <Label htmlFor="d7Key">API Key *</Label>
                <Input
                  id="d7Key"
                  type="password"
                  value={settings.d7ApiKey}
                  onChange={(e) => setSettings({ ...settings, d7ApiKey: e.target.value })}
                  placeholder="Sua API Key do D7"
                />
                <p className="text-xs text-gray-500">
                  Encontre em d7networks.com → API Keys
                </p>
              </div>
            </div>
          )}

          {/* From Number */}
          <div className="space-y-2">
            <Label htmlFor="fromNumber">Número de Origem (From) *</Label>
            <Input
              id="fromNumber"
              value={settings.fromNumber}
              onChange={(e) => setSettings({ ...settings, fromNumber: e.target.value })}
              placeholder="+351912345678"
            />
            <p className="text-xs text-gray-500">
              Número virtual do seu provedor (formato internacional com +)
            </p>
          </div>

          {/* Ativar/Desativar */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Ativar SMS Marketing</h4>
              <p className="text-sm text-gray-600">
                Habilita o envio de SMS e o nó "Enviar SMS" no construtor
              </p>
            </div>
            <Switch
              checked={settings.isActive}
              onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Limites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Limites de Envio
          </CardTitle>
          <CardDescription>
            Configure limites para evitar bloqueios e custos excessivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxSms">Limite de SMS por Hora</Label>
            <Input
              id="maxSms"
              type="number"
              value={settings.maxSmsPerHour}
              onChange={(e) => setSettings({ ...settings, maxSmsPerHour: e.target.value })}
              min="1"
              max="1000"
              className="w-full md:w-[200px]"
            />
            <p className="text-xs text-gray-500">
              Máximo de SMS enviados por hora (recomendado: 100)
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Atenção aos Custos:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• SMS tem custo por mensagem enviada</li>
              <li>• Verifique os preços do seu provedor por país</li>
              <li>• Comece com limites baixos e aumente gradualmente</li>
              <li>• Monitore gastos no painel do provedor</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Envio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Envio
          </CardTitle>
          <CardDescription>
            Envie um SMS de teste para verificar se as configurações estão corretas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="testNumber">Número para Teste</Label>
              <Input
                id="testNumber"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+351912345678"
              />
            </div>
            <Button
              onClick={handleTestSMS}
              disabled={testing}
              className="bg-green-600 hover:bg-green-700"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Enviar SMS de Teste
                </>
              )}
            </Button>
          </div>

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Dicas:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Twilio:</strong> Use um número verificado ou compre um número virtual</li>
              <li><strong>D7:</strong> Suporta Sender ID personalizado em alguns países</li>
              <li><strong>Formato:</strong> Sempre use formato internacional (+351...)</li>
              <li><strong>Teste:</strong> Use seu próprio número primeiro</li>
            </ul>
          </div>
        </CardContent>
      </Card>

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

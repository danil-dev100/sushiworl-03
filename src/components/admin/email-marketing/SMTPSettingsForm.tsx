'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type EmailMarketingConfig = {
  id: string;
  smtpServer: string;
  smtpPort: number;
  smtpUser: string | null;
  smtpPassword: string | null;
  useTls: boolean;
  defaultFromName: string;
  defaultFromEmail: string;
};

interface SMTPSettingsFormProps {
  initialConfig: EmailMarketingConfig | null;
}

export default function SMTPSettingsForm({ initialConfig }: SMTPSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [config, setConfig] = useState({
    smtpServer: initialConfig?.smtpServer || 'smtp.hostinger.com',
    smtpPort: initialConfig?.smtpPort || 587,
    smtpUser: initialConfig?.smtpUser || '',
    smtpPassword: initialConfig?.smtpPassword || '',
    useTls: initialConfig?.useTls ?? true,
    defaultFromName: initialConfig?.defaultFromName || 'SushiWorld',
    defaultFromEmail: initialConfig?.defaultFromEmail || 'pedidosushiworld@gmail.com',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/marketing/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      toast.success('Configurações SMTP salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações SMTP');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/marketing/email/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: 'Conexão bem-sucedida! Email de teste enviado.' });
        toast.success('Teste SMTP bem-sucedido!');
      } else {
        setTestResult({ success: false, message: data.error || 'Falha na conexão' });
        toast.error('Teste SMTP falhou');
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      setTestResult({ success: false, message: 'Erro ao testar conexão' });
      toast.error('Erro ao testar SMTP');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servidor SMTP</CardTitle>
        <CardDescription>
          Configure as credenciais do servidor de email para envio automático
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Host e Porta */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtpServer">Host SMTP *</Label>
            <Input
              id="smtpServer"
              value={config.smtpServer}
              onChange={(e) => setConfig({ ...config, smtpServer: e.target.value })}
              placeholder="smtp.hostinger.com"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ex: smtp.gmail.com, smtp.hostinger.com
            </p>
          </div>

          <div>
            <Label htmlFor="smtpPort">Porta *</Label>
            <Input
              id="smtpPort"
              type="number"
              value={config.smtpPort}
              onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
              placeholder="587"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              587 (TLS) ou 465 (SSL)
            </p>
          </div>
        </div>

        {/* Credenciais */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtpUser">Usuário (Email) *</Label>
            <Input
              id="smtpUser"
              type="email"
              value={config.smtpUser}
              onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
              placeholder="seu@email.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="smtpPassword">Senha / App Password *</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={config.smtpPassword}
              onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
              placeholder="••••••••"
              className="mt-1"
            />
          </div>
        </div>

        {/* TLS */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <Label htmlFor="useTls" className="text-base">Usar TLS/STARTTLS</Label>
            <p className="text-sm text-gray-500 mt-1">
              Recomendado para segurança (porta 587)
            </p>
          </div>
          <Switch
            id="useTls"
            checked={config.useTls}
            onCheckedChange={(checked) => setConfig({ ...config, useTls: checked })}
          />
        </div>

        {/* Remetente Padrão */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fromName">Nome do Remetente *</Label>
            <Input
              id="fromName"
              value={config.defaultFromName}
              onChange={(e) => setConfig({ ...config, defaultFromName: e.target.value })}
              placeholder="SushiWorld"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="fromEmail">Email do Remetente *</Label>
            <Input
              id="fromEmail"
              type="email"
              value={config.defaultFromEmail}
              onChange={(e) => setConfig({ ...config, defaultFromEmail: e.target.value })}
              placeholder="pedidos@sushiworld.com"
              className="mt-1"
            />
          </div>
        </div>

        {/* Teste de Conexão */}
        {testResult && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}
              >
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !config.smtpServer || !config.smtpUser}
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isTesting ? 'Testando...' : 'Testar Conexão'}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || !config.smtpServer || !config.smtpUser}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>

        {/* Avisos */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Dicas importantes:</strong>
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
            <li>Configure SPF, DKIM e DMARC no seu provedor de email para evitar spam</li>
            <li>Use senhas de aplicativo (App Passwords) para Gmail e outros provedores</li>
            <li>Teste sempre antes de ativar automações em produção</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

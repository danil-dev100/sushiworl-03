'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HelpCircle,
  Zap,
  Clock,
  Mail,
  GitBranch,
  Play,
  Pause,
  Trash2,
  Copy,
  Eye,
  Plus,
  GripVertical,
  ArrowDown,
  Settings,
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Save,
  TestTube,
  BarChart3,
  Users,
  MousePointerClick,
  ShoppingCart,
  CheckCircle,
} from 'lucide-react';

// Tipos
type CurrentUser = {
  id: string;
  role: string;
  managerLevel: string | null;
};

type EmailAutomation = {
  id: string;
  name: string;
  description?: string | null;
  flow?: unknown;
  isActive: boolean;
  isDraft: boolean;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  logs?: Array<{
    id: string;
    status: string;
    executedAt: Date;
  }>;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  buttonColor?: string | null;
  isActive: boolean;
};

// Tipos para o editor de fluxo
type NodeType = 'trigger' | 'delay' | 'email' | 'condition' | 'action';

type FlowNode = {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
};

type FlowConnection = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

type SimpleFlowStep = {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, unknown>;
};

interface EmailMarketingPageContentProps {
  currentUser: CurrentUser;
  automations: EmailAutomation[];
  templates: EmailTemplate[];
  dbError?: boolean;
}

// Componente de Tooltip Helper
function TooltipHelper({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-gray-400 hover:text-[#FF6B00] cursor-help ml-1 inline" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


export function EmailMarketingPageContent({
  currentUser,
  automations,
  templates,
  dbError = false,
}: EmailMarketingPageContentProps) {
  const [activeTab, setActiveTab] = useState('automations');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(
    templates[0] || null
  );
  const [showAutomationEditor, setShowAutomationEditor] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<EmailAutomation | null>(null);

  // Dados de exemplo para quando não há conexão com banco
  const mockTemplates: EmailTemplate[] = [
    {
      id: 'mock-1',
      name: 'Bem-vindo ao SushiWorld',
      subject: 'Bem-vindo! Seu primeiro pedido está a caminho',
      htmlContent: '<h1>Olá!</h1><p>Obrigado por escolher o SushiWorld...</p>',
      fromName: 'SushiWorld',
      fromEmail: 'pedidos@sushiworld.com',
      buttonText: 'Ver Pedido',
      buttonUrl: '#',
      buttonColor: '#FF6B00',
      isActive: true,
    },
    {
      id: 'mock-2',
      name: 'Confirmação de Pedido',
      subject: 'Seu pedido #[Número Pedido] foi confirmado!',
      htmlContent: '<h1>Pedido Confirmado!</h1><p>Seu pedido está sendo preparado...</p>',
      fromName: 'SushiWorld',
      fromEmail: 'pedidos@sushiworld.com',
      buttonText: 'Acompanhar Pedido',
      buttonUrl: '#',
      buttonColor: '#FF6B00',
      isActive: true,
    },
  ];

  // Usar dados mock quando não há templates reais
  const displayTemplates = templates.length > 0 ? templates : (dbError ? mockTemplates : []);

  // Estado do editor de fluxo com drag and drop
  const [flowSteps, setFlowSteps] = useState<SimpleFlowStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<SimpleFlowStep | null>(null);
  const [automationName, setAutomationName] = useState('Nova Automação');
  const [automationDescription, setAutomationDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedStep, setDraggedStep] = useState<SimpleFlowStep | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Estado das configurações SMTP
  const [smtpSettings, setSmtpSettings] = useState({
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    useTls: true,
    defaultFromName: 'SushiWorld',
    defaultFromEmail: 'pedidosushiworld@gmail.com',
    minDelaySeconds: '60',
    maxDelaySeconds: '300',
    maxEmailsPerHour: '100',
    emailRetentionDays: '30',
  });

  // Estado do template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    buttonText: '',
    buttonUrl: '',
    buttonColor: '#FF6B00',
  });

  // Atualizar form quando template for selecionado
  useEffect(() => {
    if (selectedTemplate) {
      setTemplateForm({
        name: selectedTemplate.name,
        subject: selectedTemplate.subject,
        htmlContent: selectedTemplate.htmlContent,
        buttonText: selectedTemplate.buttonText || '',
        buttonUrl: selectedTemplate.buttonUrl || '',
        buttonColor: selectedTemplate.buttonColor || '#FF6B00',
      });
    }
  }, [selectedTemplate, displayTemplates]);

  // Handlers simplificados
  const handleAddStep = (type: NodeType, label: string) => {
    const newStep: SimpleFlowStep = {
      id: `step-${Date.now()}`,
      type,
      label,
      config: {},
    };
    setFlowSteps((prev) => [...prev, newStep]);
  };

  const handleRemoveStep = (stepId: string) => {
    setFlowSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    setFlowSteps((prev) => {
      const index = prev.findIndex((s) => s.id === stepId);
      if (index === -1) return prev;

      const newSteps = [...prev];
      if (direction === 'up' && index > 0) {
        [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      } else if (direction === 'down' && index < newSteps.length - 1) {
        [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      }

      return newSteps;
    });
  };

  // Handlers de drag and drop
  const handleDragStart = (e: React.DragEvent, step: SimpleFlowStep) => {
    setDraggedStep(step);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedStep(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStepId?: string) => {
    e.preventDefault();

    if (!draggedStep) return;

    const draggedIndex = flowSteps.findIndex(s => s.id === draggedStep.id);
    if (draggedIndex === -1) return;

    const newSteps = [...flowSteps];
    const [removed] = newSteps.splice(draggedIndex, 1);

    let targetIndex = flowSteps.length;
    if (targetStepId) {
      targetIndex = flowSteps.findIndex(s => s.id === targetStepId);
      if (targetIndex === -1) targetIndex = flowSteps.length;
    }

    newSteps.splice(targetIndex, 0, removed);
    setFlowSteps(newSteps);
  };

  const handleSaveAutomation = async () => {
    if (flowSteps.length === 0) {
      alert('Adicione pelo menos um passo à automação');
      return;
    }

    setIsSaving(true);

    const automationData = {
      name: automationName.trim() || 'Nova Automação',
      description: automationDescription.trim(),
      flow: {
        steps: flowSteps,
      },
      isActive: false,
      isDraft: true,
    };

    try {
      const response = await fetch('/api/admin/marketing/email/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationData),
      });

      if (response.ok) {
        alert('Automação salva com sucesso!');
        setShowAutomationEditor(false);
        setFlowSteps([]);
        setSelectedStep(null);
        // Recarregar página para mostrar nova automação
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar automação: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
      alert('Erro ao salvar automação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      alert('O nome do template é obrigatório');
      return;
    }

    if (!templateForm.subject.trim()) {
      alert('O assunto do email é obrigatório');
      return;
    }

    if (!templateForm.htmlContent.trim()) {
      alert('O conteúdo do email é obrigatório');
      return;
    }

    try {
      const url = selectedTemplate
        ? `/api/admin/marketing/email/templates/${selectedTemplate.id}`
        : '/api/admin/marketing/email/templates';

      const response = await fetch(url, {
        method: selectedTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        alert('Template salvo com sucesso!');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar template: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template. Verifique sua conexão e tente novamente.');
    }
  };

  const handleSaveSmtpSettings = async () => {
    try {
      const response = await fetch('/api/admin/marketing/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings),
      });

      if (response.ok) {
        alert('Configurações salvas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const response = await fetch('/api/admin/marketing/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smtpSettings.defaultFromEmail,
          subject: 'Email de Teste - SushiWorld',
          html: '<h1>Teste de Email</h1><p>Se você recebeu este email, suas configurações SMTP estão corretas!</p>',
        }),
      });

      if (response.ok) {
        alert('Email de teste enviado com sucesso!');
      } else {
        alert('Erro ao enviar email de teste. Verifique suas configurações.');
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      alert('Erro ao enviar email de teste.');
    }
  };

  // Nós disponíveis para arrastar
  const availableNodes = [
    {
      type: 'trigger' as NodeType,
      label: 'Novo Pedido',
      description: 'Dispara quando um novo pedido é confirmado',
    },
    {
      type: 'trigger' as NodeType,
      label: 'Carrinho Abandonado',
      description: 'Dispara quando cliente abandona carrinho',
    },
    {
      type: 'trigger' as NodeType,
      label: 'Novo Cadastro',
      description: 'Dispara quando cliente se cadastra',
    },
    {
      type: 'delay' as NodeType,
      label: 'Aguardar',
      description: 'Espera um período de tempo antes de continuar',
    },
    {
      type: 'email' as NodeType,
      label: 'Enviar Email',
      description: 'Envia um email para o cliente',
    },
    {
      type: 'condition' as NodeType,
      label: 'Condição',
      description: 'Verifica se uma condição é verdadeira',
    },
    {
      type: 'action' as NodeType,
      label: 'Ação',
      description: 'Executa uma ação específica',
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-black text-[#FF6B00]">
            Email Marketing
            <TooltipHelper text="Sistema completo de automação de emails para engajar seus clientes e aumentar vendas" />
          </h1>
          <p className="mt-1 text-sm text-[#a16b45]">
            Automatize suas campanhas de email e aumente suas vendas
          </p>
        </header>

        {dbError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-yellow-800">
                ⚠️ Banco de dados indisponível. Você pode criar templates e automações, mas elas serão salvas quando a conexão for restabelecida.
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automações
              <TooltipHelper text="Configure fluxos automáticos de email baseados em ações dos clientes" />
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Modelos de Email
              <TooltipHelper text="Crie e edite modelos de email para usar nas automações" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
              <TooltipHelper text="Configure servidor SMTP e opções de envio" />
            </TabsTrigger>
          </TabsList>

          {/* Tab Automações */}
          <TabsContent value="automations" className="space-y-6">
            {!showAutomationEditor ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Suas Automações</h2>
                    <Badge variant="outline">{automations.length} total</Badge>
                  </div>
                  <Button
                    onClick={() => {
                      setShowAutomationEditor(true);
                      setFlowSteps([]);
                      setSelectedStep(null);
                      setAutomationName('Nova Automação');
                      setAutomationDescription('');
                    }}
                    className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Automação
                    <TooltipHelper text="Crie um novo fluxo de automação adicionando passos sequencialmente" />
                  </Button>
                </div>

                {/* Lista de automações */}
                <div className="grid gap-4">
                  {automations.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Mail className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-center">
                          Você ainda não tem automações.
                          <br />
                          Crie sua primeira automação para começar a engajar seus clientes!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    automations.map((automation) => (
                      <Card key={automation.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-2 rounded-lg ${
                                  automation.isActive
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {automation.isActive ? (
                                  <Play className="h-5 w-5" />
                                ) : (
                                  <Pause className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold">{automation.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {automation.description || 'Sem descrição'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              {/* Métricas */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="h-4 w-4 text-gray-400" />
                                  <span>{automation.totalExecutions}</span>
                                  <TooltipHelper text="Total de execuções" />
                                </div>
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>{automation.successCount}</span>
                                  <TooltipHelper text="Execuções com sucesso" />
                                </div>
                                {automation.failureCount > 0 && (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <span>{automation.failureCount}</span>
                                    <TooltipHelper text="Falhas" />
                                  </div>
                                )}
                              </div>

                              {/* Status */}
                              <Badge
                                variant={
                                  automation.isActive
                                    ? 'default'
                                    : automation.isDraft
                                    ? 'outline'
                                    : 'secondary'
                                }
                              >
                                {automation.isActive
                                  ? 'Ativo'
                                  : automation.isDraft
                                  ? 'Rascunho'
                                  : 'Inativo'}
                              </Badge>

                              {/* Ações */}
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-600">
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
              </>
            ) : (
              /* Editor de Automação Simplificado */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAutomationEditor(false)}
                    >
                      ← Voltar
                    </Button>
                    <div>
                      <Input
                        value={automationName}
                        onChange={(e) => setAutomationName(e.target.value)}
                        className="text-lg font-semibold border-none p-0 h-auto"
                        placeholder="Nome da automação"
                      />
                      <Input
                        value={automationDescription}
                        onChange={(e) => setAutomationDescription(e.target.value)}
                        className="text-sm text-gray-500 border-none p-0 h-auto mt-1"
                        placeholder="Descrição (opcional)"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowAutomationEditor(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveAutomation}
                      disabled={isSaving}
                      className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Automação
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 h-[600px]">
                  {/* Paleta de passos */}
                  <Card className="overflow-y-auto">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Passos Disponíveis
                        <TooltipHelper text="Clique para adicionar passos à sua automação" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {availableNodes.map((node, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-[#FF6B00] hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => handleAddStep(node.type, node.label)}
                        >
                          {node.type === 'trigger' && <Zap className="h-5 w-5 text-[#FF6B00]" />}
                          {node.type === 'delay' && <Clock className="h-5 w-5 text-blue-500" />}
                          {node.type === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                          {node.type === 'condition' && <GitBranch className="h-5 w-5 text-purple-500" />}
                          {node.type === 'action' && <Play className="h-5 w-5 text-yellow-500" />}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{node.label}</p>
                            <p className="text-xs text-gray-500">{node.description}</p>
                          </div>
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Fluxo de passos */}
                  <Card className="overflow-y-auto">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Fluxo da Automação
                        <TooltipHelper text="Arraste os passos para reordenar ou clique para configurar" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e)}
                      className="min-h-[400px]"
                    >
                      {flowSteps.length === 0 ? (
                        <div className="text-center py-12">
                          <ArrowDown className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-gray-500">Adicione passos à esquerda</p>
                          <p className="text-sm text-gray-400">Arraste e solte para reordenar</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {flowSteps.map((step, index) => (
                            <div key={step.id} className="relative">
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, step)}
                                onDragEnd={handleDragEnd}
                                onClick={() => setSelectedStep(step)}
                                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-move transition-all ${
                                  selectedStep?.id === step.id
                                    ? 'border-[#FF6B00] bg-[#FF6B00]/5 shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-[#FF6B00]/50 hover:shadow-md'
                                } ${isDragging && draggedStep?.id === step.id ? 'opacity-50' : ''}`}
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                {step.type === 'trigger' && <Zap className="h-5 w-5 text-[#FF6B00]" />}
                                {step.type === 'delay' && <Clock className="h-5 w-5 text-blue-500" />}
                                {step.type === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                                {step.type === 'condition' && <GitBranch className="h-5 w-5 text-purple-500" />}
                                {step.type === 'action' && <Play className="h-5 w-5 text-yellow-500" />}
                                <span className="font-medium text-sm flex-1">{step.label}</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveStep(step.id, 'up');
                                    }}
                                    disabled={index === 0}
                                  >
                                    ↑
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveStep(step.id, 'down');
                                    }}
                                    disabled={index === flowSteps.length - 1}
                                  >
                                    ↓
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveStep(step.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {index < flowSteps.length - 1 && (
                                <div className="flex justify-center my-2">
                                  <ArrowDown className="h-6 w-6 text-gray-300 animate-pulse" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Configurações do passo selecionado */}
                  <Card className="overflow-y-auto">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Configurações
                        <TooltipHelper text="Configure as propriedades do passo selecionado" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedStep ? (
                        <div className="space-y-4">
                          <div>
                            <Label className="flex items-center gap-1">
                              Tipo
                              <TooltipHelper text="Tipo do passo selecionado" />
                            </Label>
                            <p className="text-sm text-gray-500 capitalize">{selectedStep.type}</p>
                          </div>
                          <div>
                            <Label className="flex items-center gap-1">
                              Nome
                              <TooltipHelper text="Nome identificador do passo" />
                            </Label>
                            <Input value={selectedStep.label} readOnly />
                          </div>

                          {selectedStep.type === 'delay' && (
                            <div>
                              <Label className="flex items-center gap-1">
                                Tempo de Espera
                                <TooltipHelper text="Quanto tempo aguardar antes de continuar" />
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  placeholder="2"
                                  defaultValue={(selectedStep.config as any)?.delay || "2"}
                                  onChange={(e) => {
                                    const newSteps = flowSteps.map(s =>
                                      s.id === selectedStep.id
                                        ? { ...s, config: { ...s.config, delay: e.target.value } }
                                        : s
                                    );
                                    setFlowSteps(newSteps);
                                  }}
                                />
                                <Select
                                  defaultValue={(selectedStep.config as any)?.unit || "days"}
                                  onValueChange={(value) => {
                                    const newSteps = flowSteps.map(s =>
                                      s.id === selectedStep.id
                                        ? { ...s, config: { ...s.config, unit: value } }
                                        : s
                                    );
                                    setFlowSteps(newSteps);
                                  }}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="minutes">Min</SelectItem>
                                    <SelectItem value="hours">Horas</SelectItem>
                                    <SelectItem value="days">Dias</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {selectedStep.type === 'email' && (
                            <div>
                              <Label className="flex items-center gap-1">
                                Template de Email
                                <TooltipHelper text="Selecione qual modelo de email será enviado" />
                              </Label>
                              <Select
                                value={(selectedStep.config as any)?.templateId || ""}
                                onValueChange={(value) => {
                                  const newSteps = flowSteps.map(s =>
                                    s.id === selectedStep.id
                                      ? { ...s, config: { ...s.config, templateId: value } }
                                      : s
                                  );
                                  setFlowSteps(newSteps);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {displayTemplates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {selectedStep.type === 'condition' && (
                            <div className="space-y-3">
                              <div>
                                <Label className="flex items-center gap-1">
                                  Condição
                                  <TooltipHelper text="Defina a condição a ser verificada" />
                                </Label>
                                <Select
                                  value={(selectedStep.config as any)?.condition || ""}
                                  onValueChange={(value) => {
                                    const newSteps = flowSteps.map(s =>
                                      s.id === selectedStep.id
                                        ? { ...s, config: { ...s.config, condition: value } }
                                        : s
                                    );
                                    setFlowSteps(newSteps);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="opened">Abriu o email?</SelectItem>
                                    <SelectItem value="clicked">Clicou no link?</SelectItem>
                                    <SelectItem value="purchased">Fez compra?</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveStep(selectedStep.id)}
                            className="w-full mt-4"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover Passo
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">
                          Selecione um passo para configurá-lo
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab Templates */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Lista de templates */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Modelos Disponíveis
                    <TooltipHelper text="Lista de todos os templates de email disponíveis para usar nas automações" />
                  </CardTitle>
                  <CardDescription>Selecione um modelo para editar</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {displayTemplates.length === 0 ? (
                      <li className="text-sm text-gray-500 text-center py-4">
                        Nenhum template criado
                      </li>
                    ) : (
                      displayTemplates.map((template) => (
                        <li key={template.id}>
                          <button
                            onClick={() => setSelectedTemplate(template)}
                            className={`w-full rounded-lg px-4 py-3 text-left font-medium transition-colors ${
                              selectedTemplate?.id === template.id
                                ? 'bg-[#FF6B00]/10 text-[#FF6B00] font-semibold'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {template.name}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setTemplateForm({
                        name: '',
                        subject: '',
                        htmlContent: '',
                        buttonText: '',
                        buttonUrl: '',
                        buttonColor: '#FF6B00',
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Modelo
                  </Button>
                </CardContent>
              </Card>

              {/* Editor de template */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedTemplate ? `Editar: ${selectedTemplate.name}` : 'Novo Modelo'}
                    <TooltipHelper text="Editor para criar ou modificar o conteúdo do email" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Nome do Modelo
                      <TooltipHelper text="Nome identificador do template" />
                    </Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, name: e.target.value })
                      }
                      placeholder="Ex: Confirmação de Pedido"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Assunto
                      <TooltipHelper text="Linha de assunto que aparecerá na caixa de entrada do cliente. Use [Nome Cliente] e [Número Pedido] como variáveis" />
                    </Label>
                    <Input
                      value={templateForm.subject}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, subject: e.target.value })
                      }
                      placeholder="Olá [Nome Cliente], seu pedido #[Número Pedido] foi confirmado!"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Conteúdo do Email
                      <TooltipHelper text="Corpo do email em HTML. Use variáveis como [Nome Cliente], [Número Pedido], [Total], etc." />
                    </Label>
                    {/* Barra de ferramentas do editor */}
                    <div className="flex items-center gap-1 p-2 border border-b-0 rounded-t-md bg-gray-50">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Underline className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-gray-300 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <List className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-gray-300 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={templateForm.htmlContent}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, htmlContent: e.target.value })
                      }
                      rows={10}
                      className="rounded-t-none"
                      placeholder="Digite o conteúdo do email..."
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Botão Personalizado
                      <TooltipHelper text="Configure um botão de call-to-action no email" />
                    </Label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Input
                        value={templateForm.buttonText}
                        onChange={(e) =>
                          setTemplateForm({ ...templateForm, buttonText: e.target.value })
                        }
                        placeholder="Texto do botão"
                      />
                      <Input
                        value={templateForm.buttonUrl}
                        onChange={(e) =>
                          setTemplateForm({ ...templateForm, buttonUrl: e.target.value })
                        }
                        placeholder="URL do botão"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={templateForm.buttonColor}
                          onChange={(e) =>
                            setTemplateForm({ ...templateForm, buttonColor: e.target.value })
                          }
                          className="w-12 h-10 p-1"
                        />
                        <span className="text-sm text-gray-500">Cor</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveTemplate}
                      className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Modelo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Configurações */}
          <TabsContent value="settings" className="space-y-6">
            {/* Configurações SMTP */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Configurações do Servidor SMTP
                  <TooltipHelper text="Configure o servidor de email para envio das campanhas. Recomendamos usar Gmail ou outro servidor SMTP confiável" />
                </CardTitle>
                <CardDescription>
                  Informações para o envio de emails através do seu próprio servidor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="flex items-center gap-1 mb-2">
                      Servidor SMTP
                      <TooltipHelper text="Endereço do servidor SMTP. Para Gmail use smtp.gmail.com" />
                    </Label>
                    <Input
                      value={smtpSettings.smtpServer}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, smtpServer: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Porta
                      <TooltipHelper text="Porta do servidor SMTP. Comum: 587 (TLS) ou 465 (SSL)" />
                    </Label>
                    <Input
                      value={smtpSettings.smtpPort}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, smtpPort: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Usuário
                      <TooltipHelper text="Email ou usuário para autenticação no servidor SMTP" />
                    </Label>
                    <Input
                      value={smtpSettings.smtpUser}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, smtpUser: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="flex items-center gap-1 mb-2">
                      Senha
                      <TooltipHelper text="Senha ou App Password do servidor SMTP. Para Gmail, use uma App Password" />
                    </Label>
                    <Input
                      type="password"
                      value={smtpSettings.smtpPassword}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, smtpPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useTls"
                      checked={smtpSettings.useTls}
                      onCheckedChange={(checked) =>
                        setSmtpSettings({ ...smtpSettings, useTls: checked })
                      }
                    />
                    <Label htmlFor="useTls" className="flex items-center gap-1">
                      Usar TLS
                      <TooltipHelper text="Habilita criptografia TLS para conexão segura" />
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Remetente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Informações do Remetente
                  <TooltipHelper text="Como seus emails aparecerão na caixa de entrada do cliente" />
                </CardTitle>
                <CardDescription>
                  Como seus emails aparecerão na caixa de entrada do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Nome do Remetente
                      <TooltipHelper text="Nome que aparecerá como remetente do email" />
                    </Label>
                    <Input
                      value={smtpSettings.defaultFromName}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, defaultFromName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Email do Remetente
                      <TooltipHelper text="Endereço de email que aparecerá como remetente" />
                    </Label>
                    <Input
                      type="email"
                      value={smtpSettings.defaultFromEmail}
                      onChange={(e) =>
                        setSmtpSettings({
                          ...smtpSettings,
                          defaultFromEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Anti-spam */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Configurações Anti-spam
                  <TooltipHelper text="Configure intervalos e limites de envio para evitar que seus emails sejam marcados como spam" />
                </CardTitle>
                <CardDescription>
                  Evite bloqueios configurando intervalos de envio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Delay Mínimo (seg)
                      <TooltipHelper text="Tempo mínimo de espera entre envios de email em segundos" />
                    </Label>
                    <Input
                      type="number"
                      value={smtpSettings.minDelaySeconds}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, minDelaySeconds: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Delay Máximo (seg)
                      <TooltipHelper text="Tempo máximo de espera entre envios de email em segundos" />
                    </Label>
                    <Input
                      type="number"
                      value={smtpSettings.maxDelaySeconds}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, maxDelaySeconds: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      Limite por Hora
                      <TooltipHelper text="Número máximo de emails que podem ser enviados por hora" />
                    </Label>
                    <Input
                      type="number"
                      value={smtpSettings.maxEmailsPerHour}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, maxEmailsPerHour: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Retenção de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Retenção de Dados
                  <TooltipHelper text="Configure por quanto tempo manter os emails enviados no sistema" />
                </CardTitle>
                <CardDescription>
                  Configure quanto tempo manter emails no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="flex items-center gap-1 mb-2">
                    Dias de Retenção
                    <TooltipHelper text="Emails serão automaticamente deletados após este período. Relatórios são mantidos indefinidamente" />
                  </Label>
                  <Input
                    type="number"
                    value={smtpSettings.emailRetentionDays}
                    onChange={(e) =>
                      setSmtpSettings({ ...smtpSettings, emailRetentionDays: e.target.value })
                    }
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleSendTestEmail}>
                <TestTube className="h-4 w-4 mr-2" />
                Enviar Email de Teste
                <TooltipHelper text="Envia um email de teste para verificar as configurações" />
              </Button>
              <Button
                onClick={handleSaveSmtpSettings}
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

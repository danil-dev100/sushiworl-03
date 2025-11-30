import { prisma } from './db';
import nodemailer from 'nodemailer';

export interface FlowExecutionContext {
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  orderId?: string;
  orderValue?: number;
  triggerType: 'order_created' | 'cart_abandoned' | 'user_registered' | 'order_delivered';
  metadata?: Record<string, any>;
}

export interface FlowNode {
  id: string;
  type: 'trigger' | 'email' | 'delay' | 'condition' | 'action';
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export class EmailFlowExecutor {
  private smtpConfig: any = null;

  async loadSMTPConfig(userId: string): Promise<boolean> {
    try {
      const config = await prisma.smtpSettings.findFirst();

      if (!config) {
        console.error('Configuração SMTP não encontrada para usuário:', userId);
        return false;
      }

      this.smtpConfig = config;
      return true;
    } catch (error) {
      console.error('Erro ao carregar configuração SMTP:', error);
      return false;
    }
  }

  async executeFlow(flowId: string, context: FlowExecutionContext): Promise<void> {
    try {
      // Buscar o fluxo
      const flow = await prisma.emailAutomation.findUnique({
        where: { id: flowId },
        include: {
          logs: {
            where: {
              customerEmail: context.customerEmail,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
              },
            },
          },
        },
      });

      if (!flow || !flow.isActive) {
        console.log('Fluxo não encontrado ou inativo:', flowId);
        return;
      }

      // Verificar se já executou recentemente para este cliente
      if (flow.logs.length > 0) {
        console.log('Fluxo já executado recentemente para este cliente');
        return;
      }

      // Carregar configuração SMTP
      if (!await this.loadSMTPConfig(flow.createdBy)) {
        throw new Error('Configuração SMTP não encontrada');
      }

      // Executar o fluxo
      await this.executeFlowNodes(flow.flow as any, context, flow.id);

    } catch (error) {
      console.error('Erro ao executar fluxo:', error);

      // Registrar erro
      await this.logExecution(flowId, context, 'failure', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  private async executeFlowNodes(
    flowData: { nodes: FlowNode[]; edges: FlowEdge[] },
    context: FlowExecutionContext,
    automationId: string
  ): Promise<void> {
    const { nodes, edges } = flowData;

    // Encontrar o nó trigger
    const triggerNode = nodes.find(node => node.type === 'trigger');
    if (!triggerNode) {
      throw new Error('Nó trigger não encontrado');
    }

    // Verificar se o trigger corresponde ao contexto
    if (!this.matchesTrigger(triggerNode, context)) {
      console.log('Trigger não corresponde ao contexto');
      return;
    }

    // Executar fluxo a partir do trigger
    await this.executeFromNode(triggerNode.id, nodes, edges, context, automationId);
  }

  private matchesTrigger(triggerNode: FlowNode, context: FlowExecutionContext): boolean {
    const triggerType = triggerNode.data.eventType;
    return triggerType === context.triggerType;
  }

  private async executeFromNode(
    nodeId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    context: FlowExecutionContext,
    automationId: string,
    visitedNodes: Set<string> = new Set()
  ): Promise<void> {
    // Evitar loops infinitos
    if (visitedNodes.has(nodeId)) {
      return;
    }
    visitedNodes.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      return;
    }

    try {
      // Executar o nó baseado no tipo
      const nextNodes = await this.executeNode(node, context, automationId);

      // Encontrar próximos nós conectados
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);

      for (const edge of outgoingEdges) {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode) {
          // Verificar condições específicas para edges (ex: true/false de condições)
          if (this.shouldFollowEdge(edge, nextNodes)) {
            await this.executeFromNode(edge.target, nodes, edges, context, automationId, visitedNodes);
          }
        }
      }

    } catch (error) {
      console.error(`Erro ao executar nó ${nodeId}:`, error);
      await this.logExecution(automationId, context, 'failure', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  private async executeNode(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    switch (node.type) {
      case 'trigger':
        // Trigger já foi validado, apenas prosseguir
        return { success: true };

      case 'email':
        return await this.executeEmailNode(node, context, automationId);

      case 'delay':
        return await this.executeDelayNode(node, context, automationId);

      case 'condition':
        return await this.executeConditionNode(node, context, automationId);

      case 'action':
        return await this.executeActionNode(node, context, automationId);

      default:
        throw new Error(`Tipo de nó não suportado: ${node.type}`);
    }
  }

  private async executeEmailNode(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    const { templateId, subject, customContent } = node.data;

    if (!templateId) {
      throw new Error('Template de email não configurado');
    }

    // Buscar template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      throw new Error('Template não encontrado ou inativo');
    }

    // Processar template com dados do contexto
    const processedContent = this.processTemplate(template.htmlContent, context);
    const processedSubject = this.processTemplate(subject || template.subject, context);

    // Enviar email
    await this.sendEmail({
      to: context.customerEmail,
      subject: processedSubject,
      html: customContent ? customContent + processedContent : processedContent,
      from: `"${template.fromName}" <${template.fromEmail}>`,
    });

    // Registrar sucesso
    await this.logExecution(automationId, context, 'success', 'Email enviado', {
      templateId,
      subject: processedSubject,
    });

    return { success: true, emailSent: true };
  }

  private async executeDelayNode(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    const { delayValue = 1, delayType = 'hours' } = node.data;

    // Converter para milissegundos
    let delayMs: number;
    switch (delayType) {
      case 'minutes':
        delayMs = delayValue * 60 * 1000;
        break;
      case 'hours':
        delayMs = delayValue * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = delayValue * 24 * 60 * 60 * 1000;
        break;
      default:
        delayMs = delayValue * 60 * 60 * 1000; // default para horas
    }

    // Agendar execução futura (em produção, usar um sistema de filas)
    console.log(`Aguardando ${delayValue} ${delayType} antes de continuar...`);

    // Para desenvolvimento, simular delay
    await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 1000))); // Máximo 1s para testes

    return { success: true, delayed: true };
  }

  private async executeConditionNode(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    const { conditionType, operator, value } = node.data;

    const result = this.evaluateCondition(conditionType, operator, value, context);

    await this.logExecution(automationId, context, 'success', 'Condição avaliada', {
      conditionType,
      operator,
      value,
      result,
    });

    return { success: true, conditionResult: result };
  }

  private async executeActionNode(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    const { actionType } = node.data;

    switch (actionType) {
      case 'update_tags':
        return await this.executeUpdateTagsAction(node, context, automationId);

      case 'apply_discount':
        return await this.executeApplyDiscountAction(node, context, automationId);

      case 'end_flow':
        return await this.executeEndFlowAction(node, context, automationId);

      default:
        throw new Error(`Tipo de ação não suportado: ${actionType}`);
    }
  }

  private async executeUpdateTagsAction(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    const { tags = [] } = node.data;

    if (!context.customerId) {
      console.warn('CustomerId não fornecido para atualização de tags');
      return { success: false };
    }

    // Aqui seria implementada a lógica para atualizar tags do cliente
    // Por enquanto, apenas logar
    console.log(`Atualizando tags do cliente ${context.customerId}:`, tags);

    await this.logExecution(automationId, context, 'success', 'Tags atualizadas', {
      tags,
      customerId: context.customerId,
    });

    return { success: true, tagsUpdated: tags };
  }

  private async executeApplyDiscountAction(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    const { discountType, discountValue, expiresIn = 7 } = node.data;

    if (!context.customerId) {
      console.warn('CustomerId não fornecido para aplicação de desconto');
      return { success: false };
    }

    // Aqui seria implementada a lógica para aplicar desconto
    // Por enquanto, apenas logar
    console.log(`Aplicando desconto ${discountValue}${discountType === 'percentage' ? '%' : 'R$'} para cliente ${context.customerId}`);

    await this.logExecution(automationId, context, 'success', 'Desconto aplicado', {
      discountType,
      discountValue,
      expiresIn,
      customerId: context.customerId,
    });

    return { success: true, discountApplied: true };
  }

  private async executeEndFlowAction(
    node: FlowNode,
    context: FlowExecutionContext,
    automationId: string
  ): Promise<any> {
    const { reason = 'completed' } = node.data;

    await this.logExecution(automationId, context, 'success', `Fluxo finalizado: ${reason}`);

    return { success: true, flowEnded: true, reason };
  }

  private shouldFollowEdge(edge: FlowEdge, nodeResult: any): boolean {
    // Para nós de condição, verificar se deve seguir o caminho true ou false
    if (nodeResult.conditionResult !== undefined) {
      if (edge.sourceHandle === 'true') {
        return nodeResult.conditionResult === true;
      }
      if (edge.sourceHandle === 'false') {
        return nodeResult.conditionResult === false;
      }
    }

    // Para outros nós, seguir sempre
    return true;
  }

  private evaluateCondition(
    conditionType: string,
    operator: string,
    value: any,
    context: FlowExecutionContext
  ): boolean {
    let actualValue: any;

    switch (conditionType) {
      case 'order_value':
        actualValue = context.orderValue || 0;
        break;
      case 'order_items':
        // Aqui seria necessário buscar a quantidade de itens do pedido
        actualValue = context.metadata?.orderItems || 0;
        break;
      case 'customer_type':
        // Aqui seria necessário verificar o tipo de cliente
        actualValue = context.metadata?.customerType || 'new';
        break;
      case 'time_since_registration':
        // Aqui seria necessário calcular tempo desde cadastro
        actualValue = context.metadata?.daysSinceRegistration || 0;
        break;
      default:
        return false;
    }

    // Aplicar operador
    switch (operator) {
      case 'equals':
        return actualValue == value;
      case 'not_equals':
        return actualValue != value;
      case 'greater_than':
        return actualValue > value;
      case 'less_than':
        return actualValue < value;
      case 'contains':
        return String(actualValue).toLowerCase().includes(String(value).toLowerCase());
      default:
        return false;
    }
  }

  private processTemplate(template: string, context: FlowExecutionContext): string {
    return template
      .replace(/\[Nome Cliente\]/g, context.customerName || 'Cliente')
      .replace(/\[Email Cliente\]/g, context.customerEmail)
      .replace(/\[Número Pedido\]/g, context.orderId || 'N/A')
      .replace(/\[Total\]/g, context.orderValue ? `R$ ${context.orderValue.toFixed(2)}` : 'N/A');
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    from: string;
  }): Promise<void> {
    if (!this.smtpConfig) {
      throw new Error('Configuração SMTP não carregada');
    }

    const transporter = nodemailer.createTransporter({
      host: this.smtpConfig.smtpServer,
      port: parseInt(this.smtpConfig.smtpPort),
      secure: this.smtpConfig.smtpPort === '465',
      auth: {
        user: this.smtpConfig.smtpUser,
        pass: this.smtpConfig.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      headers: {
        'X-Mailer': 'SushiWorld Email Marketing System',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
  }

  private async logExecution(
    automationId: string,
    context: FlowExecutionContext,
    status: 'success' | 'failure',
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.emailAutomationLog.create({
        data: {
          automationId,
          customerEmail: context.customerEmail,
          customerId: context.customerId,
          status,
          error: status === 'failure' ? message : null,
          metadata: {
            ...metadata,
            triggerType: context.triggerType,
            orderId: context.orderId,
            orderValue: context.orderValue,
          },
        },
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }
}

// Função utilitária para executar fluxos
export async function executeEmailFlow(flowId: string, context: FlowExecutionContext): Promise<void> {
  const executor = new EmailFlowExecutor();
  await executor.executeFlow(flowId, context);
}


import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email-service';

export interface FlowExecutionContext {
  userId?: string;
  email: string;
  orderId?: string;
  cartId?: string;
  eventData?: Record<string, any>;
}

export class FlowExecutionService {
  private static instance: FlowExecutionService;
  private executingFlows: Set<string> = new Set();

  static getInstance(): FlowExecutionService {
    if (!FlowExecutionService.instance) {
      FlowExecutionService.instance = new FlowExecutionService();
    }
    return FlowExecutionService.instance;
  }

  /**
   * Dispara um evento e executa todos os fluxos ativos que correspondem
   */
  async triggerEvent(eventType: string, context: FlowExecutionContext): Promise<void> {
    try {
      console.log(`🔥 Evento disparado: ${eventType}`, context);

      // Buscar fluxos ativos que têm triggers para este evento
      const activeFlows = await prisma.emailAutomation.findMany({
        where: {
          isActive: true,
          isDraft: false,
        },
        include: {
          logs: {
            where: {
              userId: context.userId,
              trigger: eventType,
              executedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
              },
            },
          },
        },
      });

      console.log(`📊 Encontrados ${activeFlows.length} fluxos ativos`);

      for (const flow of activeFlows) {
        // Verificar se usuário já passou por este fluxo recentemente
        const recentExecutions = flow.logs.filter(log =>
          log.userId === context.userId &&
          log.trigger === eventType &&
          log.status === 'SUCCESS'
        );

        if (recentExecutions.length > 0) {
          console.log(`⏭️ Usuário ${context.userId} já executou este fluxo recentemente`);
          continue;
        }

        // Verificar se fluxo já está sendo executado
        if (this.executingFlows.has(`${flow.id}-${context.userId}`)) {
          console.log(`⏳ Fluxo ${flow.id} já está sendo executado para este usuário`);
          continue;
        }

        // Executar fluxo em background
        this.executeFlow(flow, context).catch(error => {
          console.error(`❌ Erro ao executar fluxo ${flow.id}:`, error);
        });
      }

    } catch (error) {
      console.error('❌ Erro ao disparar evento:', error);
    }
  }

  /**
   * Executa um fluxo específico
   */
  private async executeFlow(flow: any, context: FlowExecutionContext): Promise<void> {
    const executionId = `${flow.id}-${context.userId || context.email}`;
    this.executingFlows.add(executionId);

    try {
      console.log(`🚀 Iniciando execução do fluxo ${flow.id} para ${context.email}`);

      const nodes = flow.flow?.nodes || [];
      const edges = flow.flow?.edges || [];

      // Encontrar nó inicial (trigger)
      const triggerNode = nodes.find((node: any) => node.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Fluxo não tem nó de trigger');
      }

      // Verificar se trigger corresponde ao evento
      if (!this.checkTriggerMatch(triggerNode, context)) {
        console.log('⏭️ Trigger não corresponde ao evento');
        return;
      }

      // Executar fluxo começando do trigger
      await this.executeNodePath(flow.id, triggerNode.id, nodes, edges, context);

      console.log(`✅ Fluxo ${flow.id} executado com sucesso`);

    } catch (error) {
      console.error(`❌ Erro na execução do fluxo ${flow.id}:`, error);

      // Registrar erro
      await this.logExecution(flow.id, context, 'failure', null, error instanceof Error ? error.message : 'Erro desconhecido');

    } finally {
      this.executingFlows.delete(executionId);
    }
  }

  /**
   * Verifica se o trigger corresponde ao contexto do evento
   */
  private checkTriggerMatch(triggerNode: any, context: FlowExecutionContext): boolean {
    const eventType = triggerNode.data?.eventType;

    switch (eventType) {
      case 'order_created':
        return !!context.orderId;
      case 'cart_abandoned':
        return !!context.cartId;
      case 'user_registered':
        return !!context.userId;
      case 'order_delivered':
        return !!context.orderId;
      default:
        return false;
    }
  }

  /**
   * Executa o caminho de nós a partir de um nó inicial
   */
  private async executeNodePath(
    flowId: string,
    startNodeId: string,
    nodes: any[],
    edges: any[],
    context: FlowExecutionContext
  ): Promise<void> {
    let currentNodeId: string | null = startNodeId;
    const executedNodes = new Set<string>();

    while (currentNodeId && !executedNodes.has(currentNodeId)) {
      executedNodes.add(currentNodeId);

      const currentNode = nodes.find((node: any) => node.id === currentNodeId);
      if (!currentNode) break;

      console.log(`⚙️ Executando nó ${currentNodeId} (${currentNode.type})`);

      try {
        // Executar nó
        const nextNodeId = await this.executeNode(currentNode, context);

        // Registrar execução bem-sucedida
        await this.logExecution(flowId, context, 'success', currentNodeId);

        // Se é um nó final, parar
        if (currentNode.type === 'action' && currentNode.data?.actionType === 'end_flow') {
          break;
        }

        // Encontrar próximo nó
        currentNodeId = this.findNextNode(currentNodeId, edges, nextNodeId);

      } catch (error) {
        console.error(`❌ Erro ao executar nó ${currentNodeId}:`, error);

        // Registrar erro
        await this.logExecution(flowId, context, 'failure', currentNodeId, error instanceof Error ? error.message : 'Erro desconhecido');

        // Parar execução em caso de erro
        break;
      }
    }
  }

  /**
   * Executa um nó específico
   */
  private async executeNode(node: any, context: FlowExecutionContext): Promise<string | null> {
    switch (node.type) {
      case 'trigger':
        return this.executeTriggerNode(node, context);

      case 'email':
        return this.executeEmailNode(node, context);

      case 'delay':
        return this.executeDelayNode(node, context);

      case 'condition':
        return this.executeConditionNode(node, context);

      case 'action':
        return this.executeActionNode(node, context);

      default:
        throw new Error(`Tipo de nó não suportado: ${node.type}`);
    }
  }

  private async executeTriggerNode(node: any, context: FlowExecutionContext): Promise<string | null> {
    // Trigger nodes apenas iniciam o fluxo, não fazem nada específico
    return null;
  }

  private async executeEmailNode(node: any, context: FlowExecutionContext): Promise<string | null> {
    const templateId = node.data?.templateId;
    const subject = node.data?.subject;
    const customContent = node.data?.customContent;

    if (!templateId && !customContent) {
      throw new Error('Nó de email precisa de template ou conteúdo personalizado');
    }

    let htmlContent = '';

    if (templateId) {
      // Buscar template
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template de email não encontrado');
      }

      htmlContent = template.htmlContent;

      // Substituir variáveis
      htmlContent = this.replaceTemplateVariables(htmlContent, context);
    }

    if (customContent) {
      htmlContent += `\n\n${customContent}`;
    }

    // Enviar email
    const result = await emailService.sendEmail({
      to: context.email,
      subject: subject || 'Mensagem automática - SushiWorld',
      html: htmlContent,
      headers: {
        'X-Flow-Id': node.id,
        'X-Automation-Type': 'email-marketing',
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao enviar email');
    }

    return null;
  }

  private async executeDelayNode(node: any, context: FlowExecutionContext): Promise<string | null> {
    const delayValue = node.data?.delayValue || 60;
    const delayType = node.data?.delayType || 'minutes';

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
        delayMs = delayValue * 60 * 1000;
    }

    // Aguardar delay
    await new Promise(resolve => setTimeout(resolve, delayMs));

    return null;
  }

  private async executeConditionNode(node: any, context: FlowExecutionContext): Promise<string | null> {
    const conditionType = node.data?.conditionType;
    const operator = node.data?.operator;
    const value = node.data?.value;

    let conditionResult = false;

    switch (conditionType) {
      case 'order_value':
        if (context.orderId) {
          const order = await prisma.order.findUnique({
            where: { id: context.orderId }
          });
          conditionResult = this.evaluateCondition(order?.total || 0, operator, parseFloat(value));
        }
        break;

      case 'order_items':
        if (context.orderId) {
          const orderItems = await prisma.orderItem.count({
            where: { orderId: context.orderId }
          });
          conditionResult = this.evaluateCondition(orderItems, operator, parseInt(value));
        }
        break;

      case 'customer_type':
        // Implementar lógica para tipo de cliente
        conditionResult = true; // Placeholder
        break;

      case 'time_since_registration':
        if (context.userId) {
          const user = await prisma.user.findUnique({
            where: { id: context.userId }
          });
          if (user) {
            const daysSinceRegistration = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            conditionResult = this.evaluateCondition(daysSinceRegistration, operator, parseInt(value));
          }
        }
        break;
    }

    // Retornar 'true' ou 'false' baseado na condição
    return conditionResult ? 'true' : 'false';
  }

  private async executeActionNode(node: any, context: FlowExecutionContext): Promise<string | null> {
    const actionType = node.data?.actionType;

    switch (actionType) {
      case 'update_tags':
        await this.executeUpdateTagsAction(node, context);
        break;

      case 'apply_discount':
        await this.executeApplyDiscountAction(node, context);
        break;

      case 'end_flow':
        // Não fazer nada, fluxo termina aqui
        break;

      default:
        throw new Error(`Tipo de ação não suportado: ${actionType}`);
    }

    return null;
  }

  private async executeUpdateTagsAction(node: any, context: FlowExecutionContext): Promise<void> {
    if (!context.userId) return;

    const tags = node.data?.tags || [];

    // Adicionar tags ao usuário
    await prisma.user.update({
      where: { id: context.userId },
      data: {
        // Adicionar lógica para tags se necessário
      }
    });
  }

  private async executeApplyDiscountAction(node: any, context: FlowExecutionContext): Promise<void> {
    const discountType = node.data?.discountType || 'percentage';
    const discountValue = node.data?.discountValue || 0;
    const expiresIn = node.data?.expiresIn || 7;

    // Criar cupom de desconto
    const code = `AUTO_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await prisma.promotion.create({
      data: {
        name: `Desconto Automático - ${context.email}`,
        code,
        type: 'COUPON',
        discountType: discountType.toUpperCase() as any,
        discountValue,
        validUntil: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
        isActive: true,
      }
    });
  }

  private evaluateCondition(actualValue: number, operator: string, expectedValue: number): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'greater_than':
        return actualValue > expectedValue;
      case 'less_than':
        return actualValue < expectedValue;
      default:
        return false;
    }
  }

  private findNextNode(currentNodeId: string, edges: any[], conditionResult?: string | null): string | null {
    const outgoingEdges = edges.filter((edge: any) => edge.source === currentNodeId);

    if (outgoingEdges.length === 0) return null;

    // Se tem resultado de condição, usar edge apropriada
    if (conditionResult !== undefined && conditionResult !== null) {
      const conditionEdge = outgoingEdges.find((edge: any) =>
        edge.sourceHandle === conditionResult || edge.label === conditionResult
      );
      if (conditionEdge) return conditionEdge.target;
    }

    // Caso contrário, usar primeira edge
    return outgoingEdges[0].target;
  }

  private replaceTemplateVariables(content: string, context: FlowExecutionContext): string {
    // Substituir variáveis básicas
    content = content.replace(/\{\{email\}\}/g, context.email);
    content = content.replace(/\{\{user_id\}\}/g, context.userId || '');

    // Adicionar mais variáveis conforme necessário
    return content;
  }

  private async logExecution(
    flowId: string,
    context: FlowExecutionContext,
    status: 'success' | 'failure' | 'pending',
    nodeId: string | null,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.emailAutomationLog.create({
        data: {
          automationId: flowId,
          userId: context.userId,
          email: context.email,
          trigger: 'system', // Será definido pelo trigger real
          nodeId: nodeId || '',
          status: status.toUpperCase() as any,
          errorMessage,
        }
      });

      // Atualizar estatísticas do fluxo
      await this.updateFlowStats(flowId);

    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  private async updateFlowStats(flowId: string): Promise<void> {
    const logs = await prisma.emailAutomationLog.findMany({
      where: { automationId: flowId }
    });

    const totalExecutions = logs.length;
    const successCount = logs.filter(log => log.status === 'SUCCESS').length;
    const failureCount = logs.filter(log => log.status === 'FAILED').length;

    await prisma.emailAutomation.update({
      where: { id: flowId },
      data: {
        totalExecutions,
        successCount,
        failureCount,
      }
    });
  }
}

export const flowExecutionService = FlowExecutionService.getInstance();




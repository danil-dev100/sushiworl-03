import { prisma } from '@/lib/db';
import { smsService, replaceMessageVariables, normalizePhoneNumber } from '@/lib/sms-service';

/**
 * Tipos de nós disponíveis no flow builder
 */
type NodeType = 'trigger' | 'sms' | 'delay' | 'condition';

/**
 * Interface para um nó do fluxo
 */
interface FlowNode {
  id: string;
  type: NodeType;
  data: {
    label?: string;
    message?: string;
    triggerType?: string;
    delayAmount?: number;
    delayUnit?: 'minutes' | 'hours' | 'days';
    conditionType?: string;
    conditionValue?: any;
  };
  position: { x: number; y: number };
}

/**
 * Interface para uma conexão entre nós
 */
interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/**
 * Contexto de execução da automação
 */
interface ExecutionContext {
  userId?: string;
  phone?: string;
  orderId?: string;
  eventData?: Record<string, any>;
}

/**
 * Executor de automações SMS
 * Processa fluxos visuais de SMS marketing
 */
export class SmsAutomationExecutor {
  private static instance: SmsAutomationExecutor;
  private delayedExecutions: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): SmsAutomationExecutor {
    if (!SmsAutomationExecutor.instance) {
      SmsAutomationExecutor.instance = new SmsAutomationExecutor();
    }
    return SmsAutomationExecutor.instance;
  }

  /**
   * Dispara um evento e executa automações correspondentes
   */
  async triggerEvent(
    eventType: string,
    context: ExecutionContext
  ): Promise<void> {
    try {
      console.log(`[SMS Automation] Evento recebido: ${eventType}`, {
        userId: context.userId,
        phone: context.phone,
        orderId: context.orderId,
      });

      // Buscar automações ativas com este trigger
      const automations = await prisma.smsAutomation.findMany({
        where: {
          isActive: true,
          triggerType: eventType,
        },
      });

      console.log(`[SMS Automation] Encontradas ${automations.length} automações para o evento ${eventType}`);

      // Executar cada automação
      for (const automation of automations) {
        try {
          await this.executeAutomation(automation, context);
        } catch (error) {
          console.error(`[SMS Automation] Erro ao executar automação ${automation.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[SMS Automation] Erro ao processar evento:', error);
    }
  }

  /**
   * Executa uma automação específica
   */
  private async executeAutomation(
    automation: any,
    context: ExecutionContext
  ): Promise<void> {
    const nodes = (automation.nodes as FlowNode[]) || [];
    const edges = (automation.edges as FlowEdge[]) || [];

    if (nodes.length === 0) {
      console.log(`[SMS Automation] Automação ${automation.id} sem nós para executar`);
      return;
    }

    // Encontrar o nó trigger
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
      console.log(`[SMS Automation] Automação ${automation.id} sem nó trigger`);
      return;
    }

    // Iniciar execução a partir do nó trigger
    await this.executeFromNode(
      automation.id,
      triggerNode.id,
      nodes,
      edges,
      context
    );
  }

  /**
   * Executa o fluxo a partir de um nó específico
   */
  private async executeFromNode(
    automationId: string,
    nodeId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    context: ExecutionContext
  ): Promise<void> {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    console.log(`[SMS Automation] Executando nó ${node.type} (${nodeId})`);

    // Executar ação baseada no tipo de nó
    switch (node.type) {
      case 'trigger':
        // Trigger é apenas o ponto de entrada, continua para o próximo
        break;

      case 'sms':
        await this.executeSmsNode(automationId, node, context);
        break;

      case 'delay':
        await this.executeDelayNode(automationId, node, nodes, edges, context);
        return; // Delay interrompe a execução síncrona

      case 'condition':
        const branchResult = await this.evaluateCondition(node, context);
        const nextEdges = edges.filter(e => e.source === nodeId);

        // Encontrar a edge correta baseada na condição
        for (const edge of nextEdges) {
          const isYesBranch = edge.sourceHandle === 'yes' || !edge.sourceHandle;
          if ((branchResult && isYesBranch) || (!branchResult && edge.sourceHandle === 'no')) {
            await this.executeFromNode(automationId, edge.target, nodes, edges, context);
            return;
          }
        }
        return;
    }

    // Encontrar próximos nós conectados
    const nextEdges = edges.filter(e => e.source === nodeId);
    for (const edge of nextEdges) {
      await this.executeFromNode(automationId, edge.target, nodes, edges, context);
    }
  }

  /**
   * Executa um nó de SMS
   */
  private async executeSmsNode(
    automationId: string,
    node: FlowNode,
    context: ExecutionContext
  ): Promise<void> {
    const { message } = node.data;

    if (!message) {
      console.log('[SMS Automation] Nó SMS sem mensagem configurada');
      return;
    }

    // Obter número de telefone do contexto
    let phone = context.phone;

    if (!phone && context.userId) {
      const user = await prisma.user.findUnique({
        where: { id: context.userId },
        select: { phone: true },
      });
      phone = user?.phone || undefined;
    }

    if (!phone && context.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: context.orderId },
        select: { customerPhone: true },
      });
      phone = order?.customerPhone || undefined;
    }

    if (!phone) {
      console.log('[SMS Automation] Não foi possível determinar o número de telefone');
      return;
    }

    // Substituir variáveis na mensagem
    const variables: Record<string, string | number | undefined> = {
      NOME: context.eventData?.customerName || 'Cliente',
      customerName: context.eventData?.customerName || 'Cliente',
      orderNumber: context.eventData?.orderNumber,
      orderTotal: context.eventData?.total ? `€${context.eventData.total.toFixed(2)}` : '',
      estimatedTime: context.eventData?.estimatedTime || '30-45 min',
    };

    const personalizedMessage = replaceMessageVariables(message, variables);

    // Enviar SMS
    const result = await smsService.send(phone, personalizedMessage, {
      automationId,
      userId: context.userId,
    });

    console.log(`[SMS Automation] SMS ${result.success ? 'enviado' : 'falhou'} para ${normalizePhoneNumber(phone)}`, {
      messageId: result.messageId,
      error: result.error,
    });
  }

  /**
   * Executa um nó de delay (atraso)
   */
  private async executeDelayNode(
    automationId: string,
    node: FlowNode,
    nodes: FlowNode[],
    edges: FlowEdge[],
    context: ExecutionContext
  ): Promise<void> {
    const { delayAmount = 0, delayUnit = 'minutes' } = node.data;

    // Calcular delay em millisegundos
    let delayMs = delayAmount * 60 * 1000; // minutos
    if (delayUnit === 'hours') {
      delayMs = delayAmount * 60 * 60 * 1000;
    } else if (delayUnit === 'days') {
      delayMs = delayAmount * 24 * 60 * 60 * 1000;
    }

    console.log(`[SMS Automation] Aguardando ${delayAmount} ${delayUnit}...`);

    // Para delays menores que 5 minutos, executar in-memory
    if (delayMs < 5 * 60 * 1000) {
      const timeoutKey = `${automationId}-${node.id}-${Date.now()}`;

      const timeout = setTimeout(async () => {
        this.delayedExecutions.delete(timeoutKey);

        // Continuar execução após o delay
        const nextEdges = edges.filter(e => e.source === node.id);
        for (const edge of nextEdges) {
          await this.executeFromNode(automationId, edge.target, nodes, edges, context);
        }
      }, delayMs);

      this.delayedExecutions.set(timeoutKey, timeout);
    } else {
      // Para delays maiores, salvar na fila para processar via cron
      await this.scheduleDelayedExecution(automationId, node.id, nodes, edges, context, delayMs);
    }
  }

  /**
   * Agenda uma execução atrasada para processamento via cron
   */
  private async scheduleDelayedExecution(
    automationId: string,
    nodeId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    context: ExecutionContext,
    delayMs: number
  ): Promise<void> {
    const executeAt = new Date(Date.now() + delayMs);

    // Salvar na tabela de execuções pendentes (se existir)
    // Por enquanto, vamos apenas logar
    console.log(`[SMS Automation] Execução agendada para ${executeAt.toISOString()}`);

    // Nota: Em produção, você criaria um registro no banco para ser processado por um cron job
  }

  /**
   * Avalia uma condição
   */
  private async evaluateCondition(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<boolean> {
    const { conditionType, conditionValue } = node.data;

    switch (conditionType) {
      case 'has_phone':
        return !!context.phone || !!context.eventData?.customerPhone;

      case 'order_value':
        const orderValue = context.eventData?.total || 0;
        const threshold = parseFloat(conditionValue) || 0;
        return orderValue >= threshold;

      case 'order_count':
        if (!context.userId) return false;
        const orderCount = await prisma.order.count({
          where: { userId: context.userId },
        });
        return orderCount >= (parseInt(conditionValue) || 1);

      case 'is_new_customer':
        if (!context.userId) return true;
        const previousOrders = await prisma.order.count({
          where: { userId: context.userId },
        });
        return previousOrders <= 1;

      default:
        return true;
    }
  }

  /**
   * Cancela todas as execuções pendentes
   */
  cancelAllPending(): void {
    for (const [key, timeout] of this.delayedExecutions.entries()) {
      clearTimeout(timeout);
      this.delayedExecutions.delete(key);
    }
    console.log('[SMS Automation] Todas as execuções pendentes foram canceladas');
  }
}

export const smsAutomationExecutor = SmsAutomationExecutor.getInstance();

import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email-service';

export interface FlowExecutionContext {
  userId?: string;
  email: string;
  orderId?: string;
  cartId?: string;
  eventData?: Record<string, any>;
  triggeredEvent?: string; // Nome do evento que disparou o fluxo
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
      console.log(`🔥 Evento disparado: ${eventType}`, {
        email: context.email,
        orderId: context.orderId,
        userId: context.userId,
      });

      // Buscar fluxos ativos e publicados
      const activeFlows = await prisma.emailAutomation.findMany({
        where: {
          isActive: true,
          isDraft: false,
        },
      });

      console.log(`📊 Encontrados ${activeFlows.length} fluxos ativos`);

      if (activeFlows.length === 0) {
        console.log('⚠️ Nenhum fluxo ativo encontrado. Verifique no admin > Email Marketing.');
        return;
      }

      const identifier = context.email?.toLowerCase().trim();

      // Se o evento é order_scheduled, verificar se existe fluxo dedicado
      // Se não existir, usar fluxos order_created como fallback
      let effectiveEventType = eventType;
      if (eventType === 'order_scheduled') {
        const hasScheduledFlow = activeFlows.some((f: any) => {
          const nodes = f.flow?.nodes || [];
          const triggerNode = nodes.find((n: any) => n.type === 'trigger');
          if (!triggerNode) return false;
          const te = triggerNode.data?.eventType || triggerNode.data?.event || triggerNode.data?.triggerType;
          return te === 'order_scheduled';
        });
        if (hasScheduledFlow) {
          console.log('📅 Fluxo dedicado para order_scheduled encontrado');
        } else {
          // Sem fluxo dedicado, usar order_created como fallback
          console.log('📅 Sem fluxo dedicado para order_scheduled, usando order_created como fallback');
          effectiveEventType = 'order_created';
        }
      }

      for (const flow of activeFlows) {
        // Deduplicação por pedido: evita enviar o mesmo fluxo para o mesmo pedido
        // (permite enviar para o mesmo email em pedidos diferentes)
        if (context.orderId && identifier) {
          const existingLog = await prisma.emailAutomationLog.findFirst({
            where: {
              automationId: flow.id,
              email: identifier,
              trigger: eventType,
              status: 'SUCCESS',
              // Buscar log que contém o orderId no nodeId (usado como referência)
              nodeId: { contains: context.orderId },
            },
          });

          if (existingLog) {
            console.log(`⏭️ Fluxo "${flow.name}" já executado para pedido ${context.orderId}`);
            continue;
          }
        }

        // Verificar se fluxo já está sendo executado
        const executionKey = `${flow.id}-${identifier}-${context.orderId || ''}`;
        if (this.executingFlows.has(executionKey)) {
          console.log(`⏳ Fluxo ${flow.id} já está sendo executado para ${identifier}`);
          continue;
        }

        // Executar fluxo com await para capturar erros
        try {
          await this.executeFlow(flow, { ...context, triggeredEvent: effectiveEventType });
        } catch (error) {
          console.error(`❌ Erro ao executar fluxo "${flow.name}" (${flow.id}):`, error);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao disparar evento:', error);
    }
  }

  /**
   * Executa um fluxo específico
   */
  private async executeFlow(flow: any, context: FlowExecutionContext): Promise<void> {
    const identifier = context.email?.toLowerCase().trim();
    const executionId = `${flow.id}-${identifier}-${context.orderId || ''}`;
    this.executingFlows.add(executionId);

    try {
      console.log(`🚀 Iniciando execução do fluxo ${flow.id} (${flow.name}) para ${context.email}`);

      const nodes = flow.flow?.nodes || [];
      const edges = flow.flow?.edges || [];

      console.log(`📋 Fluxo tem ${nodes.length} nós e ${edges.length} conexões`);

      // Encontrar nó inicial (trigger)
      const triggerNode = nodes.find((node: any) => node.type === 'trigger');
      if (!triggerNode) {
        console.log('❌ Fluxo não tem nó de trigger');
        throw new Error('Fluxo não tem nó de trigger');
      }

      console.log('🎯 Trigger node encontrado:', {
        id: triggerNode.id,
        event: triggerNode.data?.event,
        eventType: triggerNode.data?.eventType,
        triggerType: triggerNode.data?.triggerType,
        allDataKeys: Object.keys(triggerNode.data || {}),
      });

      // Verificar se trigger corresponde ao evento
      if (!(await this.checkTriggerMatch(triggerNode, context))) {
        console.log('⏭️ Trigger não corresponde ao evento');
        return;
      }

      console.log('✅ Trigger corresponde! Executando fluxo...');

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
  private async checkTriggerMatch(triggerNode: any, context: FlowExecutionContext): Promise<boolean> {
    // Suporta tanto 'event' quanto 'eventType' e 'triggerType' para retrocompatibilidade
    const triggerEventType = triggerNode.data?.eventType || triggerNode.data?.event || triggerNode.data?.triggerType;
    // Suporta isFirstOrder diretamente ou dentro de conditions
    const isFirstOrder = triggerNode.data?.isFirstOrder ?? triggerNode.data?.conditions?.isFirstOrder;

    console.log(`🔍 Verificando trigger match: trigger=${triggerEventType}, disparado=${context.triggeredEvent}`);

    // Mapear eventos equivalentes
    // order_completed = order_created; order_scheduled também dispara fluxos order_created
    const orderEvents = ['order_created', 'order_completed', 'order_scheduled'];
    const normalizedTrigger = triggerEventType === 'order_completed' ? 'order_created' : triggerEventType;
    const normalizedEvent = context.triggeredEvent === 'order_completed' ? 'order_created' : context.triggeredEvent;

    // Verificar se o evento disparado corresponde ao evento do trigger
    // Nota: cross-matching entre order_created e order_scheduled é gerido em triggerEvent
    const isMatch = normalizedTrigger === normalizedEvent;

    if (!isMatch) {
      console.log(`❌ Evento não corresponde: ${normalizedTrigger} !== ${normalizedEvent}`);
      return false;
    }

    switch (normalizedTrigger) {
      case 'order_created':
      case 'order_scheduled': // Também validar para pedidos agendados
        if (!context.orderId) return false;

        // Validar email
        if (!context.email) {
          console.log(`[Flow Execution] ❌ Email não fornecido no contexto, ignorando verificação de primeira compra`);
          return true; // Permitir fluxo se não houver email (assume não é primeira compra)
        }

        // Normalizar email para comparação case-insensitive
        const normalizedEmail = context.email.toLowerCase().trim();

        // Contar pedidos do cliente usando query raw para garantir case-insensitive
        const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM "Order"
          WHERE LOWER("customerEmail") = LOWER(${normalizedEmail})
          AND status != 'CANCELLED'
        `;
        const orderCount = Number(countResult[0]?.count || 0);

        const isFirstPurchase = orderCount === 1;
        console.log(`[Flow Execution] 📧 Email: ${normalizedEmail}, Pedidos: ${orderCount}, Primeira compra: ${isFirstPurchase}`);

        // Se o trigger especifica que deve ser primeiro pedido
        if (isFirstOrder === true) {
          console.log(`[Flow Execution] Fluxo requer primeira compra: ${isFirstPurchase ? 'SIM' : 'NÃO'}`);
          return isFirstPurchase;
        }

        // Se o trigger especifica que NÃO deve ser primeiro pedido
        if (isFirstOrder === false) {
          console.log(`[Flow Execution] Fluxo requer NÃO primeira compra: ${!isFirstPurchase ? 'SIM' : 'NÃO'}`);
          return !isFirstPurchase;
        }

        // Se não especifica (undefined), disparar para TODOS os pedidos
        // A deduplicação por email nas últimas 24h já evita execuções duplicadas
        return true;

      case 'cart_abandoned':
        return !!context.cartId;
      case 'user_registered':
        return !!context.userId;
      case 'order_delivered':
        return !!context.orderId;
      case 'scheduled_order_reminder':
        // Lembrete de pedido agendado - apenas valida se tem orderId
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

        // Se o nó sinalizou que deve ser enfileirado (delay longo)
        if (nextNodeId === '__QUEUED__') {
          const resumeNodeId = this.findNextNode(currentNodeId, edges, null);
          if (resumeNodeId) {
            await this.queueDelayedExecution(flowId, resumeNodeId, nodes, edges, context, (context as any).__delayMs || 0);
          }
          await this.logExecution(flowId, context, 'success', currentNodeId);
          console.log('📋 Execução enfileirada para processamento posterior via cron');
          break;
        }

        // Registrar execução bem-sucedida
        await this.logExecution(flowId, context, 'success', currentNodeId);

        // Se é um nó final, parar
        if (currentNode.type === 'action' && currentNode.data?.actionType === 'end_flow') {
          console.log('🏁 Nó final alcançado, encerrando fluxo');
          break;
        }

        // Encontrar próximo nó
        const prevNodeId = currentNodeId;
        currentNodeId = this.findNextNode(currentNodeId, edges, nextNodeId);

        console.log(`🔗 Próximo nó após ${prevNodeId}: ${currentNodeId || 'NENHUM'}`);

        if (!currentNodeId) {
          console.log('⚠️ Nenhum próximo nó encontrado, finalizando execução');
        }

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
      case 'wait': // Support both 'delay' and 'wait' node types
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
    let subject = node.data?.subject || '';
    // Support both 'content' and 'customContent' field names
    const customContent = node.data?.content || node.data?.customContent;

    console.log(`📧 Email node: templateId=${templateId}, hasCustomContent=${!!customContent}, subject="${subject}"`);

    if (!templateId && !customContent) {
      throw new Error('Nó de email precisa de template ou conteúdo personalizado');
    }

    let htmlContent = '';

    // Priorizar customContent sobre templateId para evitar duplicação
    if (customContent) {
      // Use custom content directly (it's already HTML from the builder)
      htmlContent = await this.replaceTemplateVariables(customContent, context);
    } else if (templateId) {
      // Buscar template apenas se não houver customContent
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template de email não encontrado');
      }

      htmlContent = template.htmlContent;

      // Substituir variáveis
      htmlContent = await this.replaceTemplateVariables(htmlContent, context);
    }

    // Substituir variáveis no assunto também
    subject = await this.replaceTemplateVariables(subject, context);

    // Se o conteúdo não é um documento HTML completo, converter \n para <br> e envolver em estrutura básica
    if (htmlContent && !htmlContent.includes('<!DOCTYPE') && !htmlContent.includes('<html')) {
      // Converter \n para <br> em texto fora de tags HTML
      htmlContent = htmlContent.replace(/\n/g, '<br>\n');
      // Envolver em estrutura HTML de email básica
      htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f1e9;">${htmlContent}</body></html>`;
    }

    console.log(`📧 Enviando email para ${context.email} - Assunto: ${subject} - Conteúdo: ${htmlContent.length} chars`);

    // Enviar email via SMTP (configurado no painel admin > Email Marketing > SMTP)
    console.log('📧 Inicializando serviço de email SMTP...');
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

    console.log(`✅ Email enviado com sucesso para ${context.email}`);

    return null;
  }

  private async executeDelayNode(node: any, context: FlowExecutionContext): Promise<string | null> {
    // Support both old (delayValue/delayType) and new (duration/unit) formats
    const delayValue = node.data?.duration || node.data?.delayValue || 60;
    const delayType = node.data?.unit || node.data?.delayType || 'minutes';

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

    console.log(`⏰ Delay configurado: ${delayValue} ${delayType} (${delayMs}ms)`);

    // Delays curtos (≤5s) executam inline; longos são enfileirados para o cron processar
    const MAX_INLINE_DELAY_MS = 5000;
    if (delayMs <= MAX_INLINE_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return null;
    }

    // Sinalizar para executeNodePath enfileirar a continuação
    (context as any).__delayMs = delayMs;
    console.log(`📋 Delay de ${delayValue} ${delayType} será processado via cron`);
    return '__QUEUED__';
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
    console.log(`🔍 [findNextNode] Buscando próximo nó após: ${currentNodeId}`);
    console.log(`🔍 [findNextNode] Total de edges no fluxo: ${edges.length}`);
    console.log(`🔍 [findNextNode] Edges:`, JSON.stringify(edges, null, 2));

    const outgoingEdges = edges.filter((edge: any) => edge.source === currentNodeId);
    console.log(`🔍 [findNextNode] Edges saindo de ${currentNodeId}: ${outgoingEdges.length}`);
    console.log(`🔍 [findNextNode] Outgoing edges:`, JSON.stringify(outgoingEdges, null, 2));

    if (outgoingEdges.length === 0) {
      console.log(`⚠️ [findNextNode] Nenhuma edge encontrada saindo de ${currentNodeId}`);
      return null;
    }

    // Se tem resultado de condição, usar edge apropriada
    if (conditionResult !== undefined && conditionResult !== null) {
      console.log(`🔍 [findNextNode] Usando condição: ${conditionResult}`);
      const conditionEdge = outgoingEdges.find((edge: any) =>
        edge.sourceHandle === conditionResult || edge.label === conditionResult
      );
      if (conditionEdge) {
        console.log(`✅ [findNextNode] Edge condicional encontrada: ${currentNodeId} -> ${conditionEdge.target}`);
        return conditionEdge.target;
      }
    }

    // Caso contrário, usar primeira edge
    const nextNodeId = outgoingEdges[0].target;
    console.log(`✅ [findNextNode] Próximo nó: ${currentNodeId} -> ${nextNodeId}`);
    return nextNodeId;
  }

  private async replaceTemplateVariables(content: string, context: FlowExecutionContext): Promise<string> {
    // Substituir variáveis básicas
    content = content.replace(/\{\{email\}\}/g, context.email);
    content = content.replace(/\{\{user_id\}\}/g, context.userId || '');

    // Se tem dados do pedido no contexto, substituir variáveis do pedido
    if (context.orderId) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: context.orderId },
          include: {
            orderItems: true,
          },
        });

        if (order) {
          // Dados do cliente
          content = content.replace(/\{\{customerName\}\}/g, order.customerName || '');
          content = content.replace(/\{\{nome_cliente\}\}/g, order.customerName || '');

          // Dados do pedido
          content = content.replace(/\{\{orderNumber\}\}/g, order.orderNumber?.toString() || '');
          content = content.replace(/\{\{numero_pedido\}\}/g, order.orderNumber?.toString() || '');
          content = content.replace(/\{\{pedido_id\}\}/g, order.id || '');

          // Valores
          content = content.replace(/\{\{valor_total\}\}/g, `€${order.total.toFixed(2)}`);
          content = content.replace(/\{\{subtotal\}\}/g, `€${order.subtotal.toFixed(2)}`);
          content = content.replace(/\{\{deliveryFee\}\}/g, `€${order.deliveryFee.toFixed(2)}`);

          // Datas
          const dataFormatada = new Date(order.createdAt).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          content = content.replace(/\{\{data_pedido\}\}/g, dataFormatada);

          // Pagamento
          const paymentMethodMap: Record<string, string> = {
            'CASH': 'Dinheiro',
            'CREDIT_CARD': 'Cartão de Crédito',
            'MBWAY': 'MB WAY',
            'MULTIBANCO': 'Multibanco',
          };
          content = content.replace(/\{\{forma_pagamento\}\}/g, paymentMethodMap[order.paymentMethod] || order.paymentMethod);

          // Endereço
          const address = typeof order.deliveryAddress === 'object' && order.deliveryAddress !== null
            ? (order.deliveryAddress as any).fullAddress || JSON.stringify(order.deliveryAddress)
            : String(order.deliveryAddress || '');
          content = content.replace(/\{\{endereco_entrega\}\}/g, address);

          // Lista de produtos - formato HTML para melhor visualização
          const produtosHtml = order.orderItems
            .map(item => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${item.quantity}x ${item.name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">€${item.priceAtTime.toFixed(2)}</td></tr>`)
            .join('');

          let listaProdutosHtml = `<table style="width:100%;border-collapse:collapse;margin:8px 0;"><tbody>${produtosHtml}</tbody></table>`;

          // Adicionar globalOptions ao email
          const globalOpts = order.globalOptions as Array<{ optionId: string; optionName: string; choices: Array<{ choiceId: string; choiceName: string; price: number; quantity?: number }> }> | null;
          if (globalOpts && globalOpts.length > 0) {
            const opcoesHtml = globalOpts.flatMap(opt =>
              opt.choices.map(choice => {
                const qty = choice.quantity ? `${choice.quantity}x ` : '';
                const price = choice.price > 0 ? `€${(choice.price * (choice.quantity || 1)).toFixed(2)}` : 'Grátis';
                return `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${qty}${choice.choiceName}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${price}</td></tr>`;
              })
            ).join('');
            if (opcoesHtml) {
              listaProdutosHtml += `<div style="margin-top:12px;"><strong style="color:#FF6B00;">📦 Opções:</strong><table style="width:100%;border-collapse:collapse;margin:8px 0;"><tbody>${opcoesHtml}</tbody></table></div>`;
            }
          }

          // Adicionar checkoutAdditionalItems ao email
          const additionalItems = order.checkoutAdditionalItems as Array<{ name: string; price: number }> | null;
          if (additionalItems && additionalItems.length > 0) {
            const adicionaisHtml = additionalItems
              .map(item => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">€${item.price.toFixed(2)}</td></tr>`)
              .join('');
            listaProdutosHtml += `<div style="margin-top:12px;"><strong style="color:#FF6B00;">🛍️ Itens Adicionais:</strong><table style="width:100%;border-collapse:collapse;margin:8px 0;"><tbody>${adicionaisHtml}</tbody></table></div>`;
          }

          content = content.replace(/\{\{lista_produtos\}\}/g, listaProdutosHtml);
          content = content.replace(/\{\{orderItems\}\}/g, listaProdutosHtml);

          // Valores adicionais
          content = content.replace(/\{\{orderTotal\}\}/g, order.total.toFixed(2));
          content = content.replace(/\{\{deliveryAddress\}\}/g, address);

          // Data/Hora Agendada (se for pedido agendado)
          if (order.isScheduled && order.scheduledFor) {
            const scheduledDateTime = new Date(order.scheduledFor);
            const scheduledDate = scheduledDateTime.toLocaleDateString('pt-PT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
            const scheduledTime = scheduledDateTime.toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            });
            content = content.replace(/\{\{scheduledDate\}\}/g, scheduledDate);
            content = content.replace(/\{\{scheduledTime\}\}/g, scheduledTime);
          }

          // Tempo estimado (pode ser configurado futuramente)
          content = content.replace(/\{\{tempo_estimado\}\}/g, '30-45 minutos');

          // Nome da loja e telefone (buscar das configurações)
          try {
            const settings = await prisma.settings.findFirst();
            const companyName = settings?.companyName || 'SushiWorld';
            const phone = settings?.phone || 'Entre em contato conosco';
            content = content.replace(/\{\{nome_da_loja\}\}/g, companyName);
            content = content.replace(/\{\{whatsapp_loja\}\}/g, phone);
            content = content.replace(/\{\{telefone_loja\}\}/g, phone);
          } catch (err) {
            content = content.replace(/\{\{nome_da_loja\}\}/g, 'SushiWorld');
            content = content.replace(/\{\{whatsapp_loja\}\}/g, 'Entre em contato conosco');
            content = content.replace(/\{\{telefone_loja\}\}/g, 'Entre em contato conosco');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do pedido para variáveis:', error);
      }
    }

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
      // Incluir orderId no nodeId para deduplicação por pedido
      const nodeRef = context.orderId
        ? `${nodeId || ''}:order:${context.orderId}`
        : nodeId || '';

      await prisma.emailAutomationLog.create({
        data: {
          automationId: flowId,
          userId: context.userId,
          email: context.email,
          trigger: context.triggeredEvent || 'system',
          nodeId: nodeRef,
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

  /**
   * Enfileira a continuação de um fluxo após um delay longo
   * Usa EmailAutomationLog com status PENDING para armazenar o estado
   */
  private async queueDelayedExecution(
    flowId: string,
    resumeNodeId: string,
    nodes: any[],
    edges: any[],
    context: FlowExecutionContext,
    delayMs: number
  ): Promise<void> {
    const executeAfter = new Date(Date.now() + delayMs);

    await prisma.emailAutomationLog.create({
      data: {
        automationId: flowId,
        userId: context.userId,
        email: context.email,
        trigger: context.triggeredEvent || 'delay_queue',
        nodeId: resumeNodeId,
        status: 'PENDING',
        errorMessage: JSON.stringify({
          executeAfter: executeAfter.toISOString(),
          context: {
            userId: context.userId,
            email: context.email,
            orderId: context.orderId,
            cartId: context.cartId,
            triggeredEvent: context.triggeredEvent,
          },
          nodes,
          edges,
        }),
      }
    });

    console.log(`📋 Execução enfileirada: fluxo ${flowId}, retomar nó ${resumeNodeId} após ${executeAfter.toISOString()}`);
  }

  /**
   * Processa execuções pendentes na fila (chamado pelo cron)
   */
  async processQueuedExecutions(): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      const pendingLogs = await prisma.emailAutomationLog.findMany({
        where: { status: 'PENDING' },
      });

      console.log(`[Queue] Encontradas ${pendingLogs.length} execuções pendentes`);

      for (const log of pendingLogs) {
        try {
          const data = JSON.parse(log.errorMessage || '{}');
          const executeAfter = new Date(data.executeAfter);

          // Ainda não é hora de executar
          if (executeAfter > new Date()) {
            continue;
          }

          console.log(`[Queue] Processando execução: fluxo ${log.automationId}, nó ${log.nodeId}`);

          // Marcar como em processamento (atualizar para evitar reprocessamento)
          await prisma.emailAutomationLog.update({
            where: { id: log.id },
            data: { status: 'SUCCESS', errorMessage: null },
          });

          // Reconstruir o contexto
          const context: FlowExecutionContext = {
            userId: data.context?.userId,
            email: data.context?.email || log.email,
            orderId: data.context?.orderId,
            cartId: data.context?.cartId,
            triggeredEvent: data.context?.triggeredEvent || log.trigger,
          };

          // Retomar execução a partir do nó salvo
          await this.executeNodePath(
            log.automationId,
            log.nodeId,
            data.nodes || [],
            data.edges || [],
            context
          );

          processed++;
          console.log(`[Queue] ✅ Execução processada com sucesso`);

        } catch (error) {
          errors++;
          console.error(`[Queue] ❌ Erro ao processar execução ${log.id}:`, error);

          await prisma.emailAutomationLog.update({
            where: { id: log.id },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
            },
          });
        }
      }

    } catch (error) {
      console.error('[Queue] Erro geral ao processar fila:', error);
    }

    return { processed, errors };
  }

  private async updateFlowStats(flowId: string): Promise<void> {
    const logs = await prisma.emailAutomationLog.findMany({
      where: { automationId: flowId, status: { not: 'PENDING' } }
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







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

        // Executar fluxo em background, passando o eventType no contexto
        this.executeFlow(flow, { ...context, triggeredEvent: eventType }).catch(error => {
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

    // Mapear eventos equivalentes (order_completed = order_created)
    const normalizedTrigger = triggerEventType === 'order_completed' ? 'order_created' : triggerEventType;
    const normalizedEvent = context.triggeredEvent === 'order_completed' ? 'order_created' : context.triggeredEvent;

    // Verificar se o evento disparado corresponde ao evento do trigger
    if (normalizedTrigger !== normalizedEvent) {
      console.log(`❌ Evento não corresponde: ${normalizedTrigger} !== ${normalizedEvent}`);
      return false;
    }

    switch (normalizedTrigger) {
      case 'order_created':
      case 'order_scheduled': // Também validar para pedidos agendados
        if (!context.orderId) return false;

        // Normalizar email para comparação case-insensitive
        const normalizedEmail = context.email?.toLowerCase().trim();

        // Contar pedidos do cliente (incluindo o atual) - busca case-insensitive
        const orderCount = await prisma.order.count({
          where: {
            customerEmail: {
              equals: normalizedEmail,
              mode: 'insensitive'
            },
            status: { not: 'CANCELLED' },
          }
        });

        const isFirstPurchase = orderCount === 1;
        console.log(`[Flow Execution] Email ${context.email}: ${orderCount} pedido(s), primeira compra: ${isFirstPurchase}`);

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

        // Se não especifica (undefined), NÃO disparar para primeira compra
        // Isso evita que fluxos genéricos disparem junto com fluxo de primeira compra
        if (isFirstPurchase) {
          console.log(`[Flow Execution] Fluxo sem especificação - ignorando primeira compra para evitar duplicidade`);
          return false;
        }

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
    const subject = node.data?.subject;
    // Support both 'content' and 'customContent' field names
    const customContent = node.data?.content || node.data?.customContent;

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
      htmlContent = await this.replaceTemplateVariables(htmlContent, context);
    }

    if (customContent) {
      // Use custom content directly (it's already HTML from the builder)
      let processedContent = await this.replaceTemplateVariables(customContent, context);
      htmlContent = htmlContent ? htmlContent + '\n\n' + processedContent : processedContent;
    }

    console.log(`📧 Enviando email para ${context.email} - Assunto: ${subject}`);

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

    console.log(`⏰ Aguardando ${delayValue} ${delayType}...`);

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

          // Lista de produtos
          let listaProdutos = order.orderItems
            .map(item => `• ${item.quantity}x ${item.name} - €${item.priceAtTime.toFixed(2)}`)
            .join('\n');

          // Adicionar globalOptions ao email
          const globalOpts = order.globalOptions as Array<{ optionId: string; optionName: string; choices: Array<{ choiceId: string; choiceName: string; price: number; quantity?: number }> }> | null;
          if (globalOpts && globalOpts.length > 0) {
            const opcoesGlobais = globalOpts.flatMap(opt =>
              opt.choices.map(choice => {
                const qty = choice.quantity ? `${choice.quantity}x ` : '';
                const price = choice.price > 0 ? ` - €${(choice.price * (choice.quantity || 1)).toFixed(2)}` : ' (Grátis)';
                return `• ${qty}${opt.optionName}: ${choice.choiceName}${price}`;
              })
            ).join('\n');
            if (opcoesGlobais) {
              listaProdutos += '\n\n📦 Opções:\n' + opcoesGlobais;
            }
          }

          // Adicionar checkoutAdditionalItems ao email
          const additionalItems = order.checkoutAdditionalItems as Array<{ name: string; price: number }> | null;
          if (additionalItems && additionalItems.length > 0) {
            const itensAdicionais = additionalItems
              .map(item => `• ${item.name} - €${item.price.toFixed(2)}`)
              .join('\n');
            listaProdutos += '\n\n🛍️ Itens Adicionais:\n' + itensAdicionais;
          }

          content = content.replace(/\{\{lista_produtos\}\}/g, listaProdutos);
          content = content.replace(/\{\{orderItems\}\}/g, listaProdutos);

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







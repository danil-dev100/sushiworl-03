import { prisma } from '@/lib/db';
import { flowExecutionService } from '@/lib/flow-execution-service';
import { smsAutomationExecutor } from '@/lib/sms-automation-executor';

export class TriggersService {
  private static instance: TriggersService;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): TriggersService {
    if (!TriggersService.instance) {
      TriggersService.instance = new TriggersService();
    }
    return TriggersService.instance;
  }

  /**
   * Inicia o monitoramento de triggers
   */
  startMonitoring(): void {
    if (this.isRunning) return;

    console.log('🚀 Iniciando monitoramento de triggers de Email Marketing');

    this.isRunning = true;

    // Verificar triggers a cada 5 minutos
    this.checkInterval = setInterval(() => {
      this.checkTriggers();
    }, 5 * 60 * 1000);

    // Executar primeira verificação imediatamente
    this.checkTriggers();
  }

  /**
   * Para o monitoramento de triggers
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Monitoramento de triggers parado');
  }

  /**
   * Verifica e executa todos os triggers pendentes
   */
  private async checkTriggers(): Promise<void> {
    try {
      console.log('🔍 Verificando triggers...');

      // 1. Carrinhos abandonados
      await this.checkAbandonedCarts();

      // 2. Novos pedidos (já são tratados no momento da criação)

      // 3. Pedidos agendados que precisam de lembrete
      await this.checkScheduledOrderReminders();

      // 4. Pedidos entregues (será tratado quando o status mudar)

      console.log('✅ Verificação de triggers concluída');

    } catch (error) {
      console.error('❌ Erro ao verificar triggers:', error);
    }
  }

  /**
   * Verifica carrinhos abandonados
   */
  private async checkAbandonedCarts(): Promise<void> {
    try {
      // Buscar carrinhos não convertidos há mais de 30 minutos
      // Nota: Esta é uma simplificação. Em um sistema real, você teria uma tabela de carrinhos

      // Por enquanto, vamos simular alguns carrinhos abandonados para teste
      const abandonedCarts = await this.getAbandonedCarts();

      for (const cart of abandonedCarts) {
        await flowExecutionService.triggerEvent('cart_abandoned', {
          userId: cart.userId,
          email: cart.email,
          cartId: cart.id,
          eventData: {
            cartValue: cart.total,
            itemsCount: cart.itemsCount,
            abandonedAt: cart.abandonedAt,
          }
        });
      }

    } catch (error) {
      console.error('Erro ao verificar carrinhos abandonados:', error);
    }
  }

  /**
   * Busca carrinhos abandonados (simulação)
   */
  private async getAbandonedCarts(): Promise<Array<{
    id: string;
    userId?: string;
    email: string;
    total: number;
    itemsCount: number;
    abandonedAt: Date;
  }>> {
    // Esta é uma simulação. Em um sistema real, você buscaria carrinhos não convertidos
    // que não foram atualizados há mais de 30 minutos

    // Para fins de demonstração, vamos retornar alguns dados fictícios
    return [
      // Dados de exemplo para teste
    ];
  }

  /**
   * Verifica pedidos agendados que precisam de lembrete
   */
  private async checkScheduledOrderReminders(): Promise<void> {
    try {
      const now = new Date();

      // Buscar pedidos agendados que ainda não foram entregues
      // e cujo horário agendado está entre 50 e 70 minutos no futuro
      // (janela de 20 minutos para garantir que pegamos o lembrete)
      const reminderWindowStart = new Date(now.getTime() + 50 * 60 * 1000); // 50 min
      const reminderWindowEnd = new Date(now.getTime() + 70 * 60 * 1000); // 70 min

      const scheduledOrders = await prisma.order.findMany({
        where: {
          isScheduled: true,
          scheduledFor: {
            gte: reminderWindowStart,
            lte: reminderWindowEnd,
          },
          status: {
            notIn: ['CANCELLED', 'DELIVERED']
          },
          // Evitar enviar lembrete múltiplas vezes
          reminderSent: false
        },
        include: {
          user: true,
          orderItems: true,
        }
      });

      console.log(`[Triggers Service] Encontrados ${scheduledOrders.length} pedidos agendados para lembrete`);

      for (const order of scheduledOrders) {
        try {
          console.log(`[Triggers Service] Enviando lembrete para pedido #${order.orderNumber}`);

          // Disparar evento de lembrete
          await flowExecutionService.triggerEvent('scheduled_order_reminder', {
            userId: order.userId || undefined,
            email: order.customerEmail,
            orderId: order.id,
            eventData: {
              orderNumber: order.orderNumber,
              total: order.total,
              itemsCount: order.orderItems.length,
              customerName: order.customerName,
              scheduledFor: order.scheduledFor,
            }
          });

          // Marcar lembrete como enviado
          await prisma.order.update({
            where: { id: order.id },
            data: { reminderSent: true }
          });

          console.log(`[Triggers Service] ✅ Lembrete enviado para pedido #${order.orderNumber}`);

        } catch (error) {
          console.error(`[Triggers Service] Erro ao enviar lembrete para pedido #${order.orderNumber}:`, error);
        }
      }

    } catch (error) {
      console.error('Erro ao verificar lembretes de pedidos agendados:', error);
    }
  }

  /**
   * Dispara trigger quando um novo pedido é criado
   */
  async triggerOrderCreated(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          orderItems: true,
        }
      });

      if (!order) return;

      // Se for pedido agendado, dispara evento específico
      const eventType = order.isScheduled ? 'order_scheduled' : 'order_created';

      console.log(`[Triggers Service] Disparando evento: ${eventType} para pedido #${order.orderNumber}`);

      const eventContext = {
        userId: order.userId || undefined,
        email: order.customerEmail,
        orderId: order.id,
        eventData: {
          orderNumber: order.orderNumber,
          total: order.total,
          itemsCount: order.orderItems.length,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          isScheduled: order.isScheduled,
          scheduledFor: order.scheduledFor,
        }
      };

      // Dispara para Email Marketing
      await flowExecutionService.triggerEvent(eventType, eventContext);

      // Dispara para SMS Marketing
      await smsAutomationExecutor.triggerEvent(eventType, {
        ...eventContext,
        phone: order.customerPhone,
      });

    } catch (error) {
      console.error('Erro ao disparar trigger de novo pedido:', error);
    }
  }

  /**
   * Dispara trigger quando um usuário se registra
   */
  async triggerUserRegistered(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return;

      const eventContext = {
        userId: user.id,
        email: user.email,
        eventData: {
          name: user.name,
          customerName: user.name,
          registrationDate: user.createdAt,
        }
      };

      // Dispara para Email Marketing
      await flowExecutionService.triggerEvent('user_registered', eventContext);

      // Dispara para SMS Marketing
      await smsAutomationExecutor.triggerEvent('user_registered', {
        ...eventContext,
        phone: user.phone || undefined,
      });

    } catch (error) {
      console.error('Erro ao disparar trigger de registro de usuário:', error);
    }
  }

  /**
   * Dispara trigger quando um pedido é entregue
   */
  async triggerOrderDelivered(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          orderItems: true,
        }
      });

      if (!order) return;

      const eventContext = {
        userId: order.userId || undefined,
        email: order.customerEmail,
        orderId: order.id,
        eventData: {
          orderNumber: order.orderNumber,
          total: order.total,
          deliveredAt: order.deliveredAt,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
        }
      };

      // Dispara para Email Marketing
      await flowExecutionService.triggerEvent('order_delivered', eventContext);

      // Dispara para SMS Marketing
      await smsAutomationExecutor.triggerEvent('order_delivered', {
        ...eventContext,
        phone: order.customerPhone,
      });

    } catch (error) {
      console.error('Erro ao disparar trigger de pedido entregue:', error);
    }
  }

  /**
   * Método para teste - dispara um trigger manualmente
   */
  async testTrigger(eventType: string, context: any): Promise<void> {
    // Dispara para Email Marketing
    await flowExecutionService.triggerEvent(eventType, context);

    // Dispara para SMS Marketing
    await smsAutomationExecutor.triggerEvent(eventType, {
      ...context,
      phone: context.phone || context.eventData?.customerPhone,
    });
  }

  /**
   * Verifica se o serviço está rodando
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }
}

export const triggersService = TriggersService.getInstance();







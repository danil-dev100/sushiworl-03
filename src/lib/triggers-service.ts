import { prisma } from '@/lib/db';
import { flowExecutionService } from '@/lib/flow-execution-service';

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

      // 3. Pedidos entregues (será tratado quando o status mudar)

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

      await flowExecutionService.triggerEvent('order_created', {
        userId: order.userId || undefined,
        email: order.customerEmail,
        orderId: order.id,
        eventData: {
          orderNumber: order.orderNumber,
          total: order.total,
          itemsCount: order.orderItems.length,
          customerName: order.customerName,
        }
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

      await flowExecutionService.triggerEvent('user_registered', {
        userId: user.id,
        email: user.email,
        eventData: {
          name: user.name,
          registrationDate: user.createdAt,
        }
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

      await flowExecutionService.triggerEvent('order_delivered', {
        userId: order.userId || undefined,
        email: order.customerEmail,
        orderId: order.id,
        eventData: {
          orderNumber: order.orderNumber,
          total: order.total,
          deliveredAt: order.deliveredAt,
          customerName: order.customerName,
        }
      });

    } catch (error) {
      console.error('Erro ao disparar trigger de pedido entregue:', error);
    }
  }

  /**
   * Método para teste - dispara um trigger manualmente
   */
  async testTrigger(eventType: string, context: any): Promise<void> {
    await flowExecutionService.triggerEvent(eventType, context);
  }

  /**
   * Verifica se o serviço está rodando
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }
}

export const triggersService = TriggersService.getInstance();



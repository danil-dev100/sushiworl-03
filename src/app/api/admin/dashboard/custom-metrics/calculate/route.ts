import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar métricas ativas
    const customMetrics = await prisma.customMetric.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (customMetrics.length === 0) {
      return NextResponse.json({ metrics: [] });
    }

    // Buscar dados necessários para cálculos
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED'] },
        isTest: false,
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        deliveryFee: true,
        discount: true,
        customerEmail: true,
        createdAt: true,
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(o => o.customerEmail)).size;
    const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);

    // Contar clientes recorrentes (mais de 1 pedido)
    const customerOrderCounts: Record<string, number> = {};
    orders.forEach(o => {
      customerOrderCounts[o.customerEmail] = (customerOrderCounts[o.customerEmail] || 0) + 1;
    });
    const recurrentCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const newCustomers = uniqueCustomers - recurrentCustomers;

    // Variáveis disponíveis para fórmulas (com múltiplos nomes para flexibilidade)
    const variables: Record<string, number> = {
      // Receita
      totalRevenue,
      receita_total: totalRevenue,
      total_revenue: totalRevenue,

      // Pedidos
      totalOrders,
      total_pedidos: totalOrders,
      total_orders: totalOrders,

      // Clientes
      uniqueCustomers,
      clientes_unicos: uniqueCustomers,
      unique_customers: uniqueCustomers,
      total_clientes: uniqueCustomers,

      // Ticket médio
      averageOrderValue: ticketMedio,
      ticket_medio: ticketMedio,
      average_order_value: ticketMedio,

      // Descontos
      totalDiscount,
      total_discount: totalDiscount,
      descontos_totais: totalDiscount,

      // Clientes recorrentes
      recurrentCustomers,
      clientes_recorrentes: recurrentCustomers,
      recurring_customers: recurrentCustomers,

      // Novos clientes
      newCustomers,
      novos_clientes: newCustomers,
      new_customers: newCustomers,

      // Frequência média de compras (pedidos / clientes)
      frequencia_compras: uniqueCustomers > 0 ? totalOrders / uniqueCustomers : 0,
      purchase_frequency: uniqueCustomers > 0 ? totalOrders / uniqueCustomers : 0,

      // Tempo de relacionamento (aproximado em meses - usando 1 como padrão para 30 dias)
      tempo_relacionamento: 1,

      // Custos (estimativa - 35% da receita)
      custos_totais: totalRevenue * 0.35,
      total_costs: totalRevenue * 0.35,

      // Marketing (placeholder - pode ser configurado)
      investimento_marketing: 0,
      total_investido_marketing: 0,
      investimento_anuncios: 0,
      receita_atribuida_anuncios: totalRevenue * 0.3, // Estimativa: 30% vem de anúncios
    };

    // Calcular cada métrica
    const calculatedMetrics = customMetrics.map(metric => {
      let value = 0;

      try {
        // Executar fórmula simples
        value = evaluateFormula(metric.formula, variables);
      } catch (error) {
        console.error(`[CustomMetrics] Erro ao calcular ${metric.name}:`, error);
        value = 0;
      }

      return {
        id: metric.id,
        name: metric.name,
        value: Number(value.toFixed(2)),
        unit: metric.unit || '',
        type: metric.type,
        description: metric.description || '',
      };
    });

    return NextResponse.json({ metrics: calculatedMetrics });
  } catch (error) {
    console.error('[CustomMetrics Calculate API] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao calcular métricas',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Função para avaliar fórmulas simples de forma segura
function evaluateFormula(formula: string, variables: Record<string, number>): number {
  // Substituir variáveis
  let expression = formula;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    expression = expression.replace(regex, value.toString());
  });

  // Permitir apenas operações matemáticas seguras
  const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');

  try {
    // Usar Function ao invés de eval para maior segurança
    const result = new Function(`return ${safeExpression}`)();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch {
    return 0;
  }
}

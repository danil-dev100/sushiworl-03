/**
 * 🎨 EMAIL TEMPLATE RENDERER
 *
 * Sistema de substituição de variáveis dinâmicas em templates de email.
 * Suporta sintaxe {{variavel}} com fallback seguro.
 *
 * @example
 * const html = renderEmailTemplate(
 *   'Olá {{customer_name}}, seu pedido #{{order_id}} foi confirmado!',
 *   { customer_name: 'João', order_id: '12345' }
 * );
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Variáveis disponíveis para templates de email
 */
export interface EmailTemplateVariables {
  // Cliente
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;

  // Pedido
  order_id?: string;
  order_number?: string;
  order_date?: string;
  order_status?: string;
  payment_method?: string;
  payment_status?: string;
  order_items?: string; // HTML formatado
  order_subtotal?: string;
  order_discount?: string;
  order_total?: string;

  // Entrega
  delivery_address?: string;
  delivery_type?: string;
  delivery_time_estimate?: string;
  delivery_fee?: string;

  // Loja
  store_name?: string;
  store_logo_url?: string;
  store_whatsapp?: string;
  store_instagram?: string;
  store_support_email?: string;

  // Mídia
  hero_image_url?: string;
  promo_gif_url?: string;
  product_image_url?: string;

  // Outros
  current_year?: string;
  tracking_url?: string;
  unsubscribe_url?: string;
}

/**
 * Renderiza um template de email substituindo variáveis
 *
 * @param template - Template HTML com variáveis no formato {{variavel}}
 * @param variables - Objeto com valores das variáveis
 * @param options - Opções de renderização
 * @returns Template renderizado com variáveis substituídas
 */
export function renderEmailTemplate(
  template: string,
  variables: EmailTemplateVariables,
  options: {
    fallbackValue?: string;
    preserveUnknown?: boolean;
  } = {}
): string {
  const { fallbackValue = '', preserveUnknown = false } = options;

  // Adicionar variáveis globais automáticas
  const enrichedVariables: EmailTemplateVariables = {
    current_year: new Date().getFullYear().toString(),
    ...variables,
  };

  // Substituir todas as variáveis no formato {{variavel}}
  let rendered = template;

  // Regex para encontrar {{variavel}} (incluindo espaços opcionais)
  const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

  rendered = rendered.replace(variableRegex, (match, variableName) => {
    const value = enrichedVariables[variableName as keyof EmailTemplateVariables];

    if (value !== undefined && value !== null) {
      return String(value);
    }

    // Se a variável não existe, usar fallback ou preservar
    return preserveUnknown ? match : fallbackValue;
  });

  return rendered;
}

/**
 * Formata dados de pedido para uso em templates
 *
 * @param order - Dados do pedido do Prisma
 * @param settings - Configurações da loja
 * @returns Variáveis formatadas para o template
 */
export function formatOrderVariables(
  order: any,
  settings?: any
): EmailTemplateVariables {
  // Formatar lista de itens como HTML
  const orderItemsHtml = order.orderItems?.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.quantity}x</strong> ${item.name}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
        €${item.priceAtTime.toFixed(2)}
      </td>
    </tr>
  `).join('') || '';

  const itemsTable = orderItemsHtml ? `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr>
          <th style="padding: 8px; border-bottom: 2px solid #FF6B00; text-align: left;">Produto</th>
          <th style="padding: 8px; border-bottom: 2px solid #FF6B00; text-align: right;">Preço</th>
        </tr>
      </thead>
      <tbody>
        ${orderItemsHtml}
      </tbody>
    </table>
  ` : '';

  // Formatar endereço
  const deliveryAddress = order.deliveryAddress
    ? `${order.deliveryAddress}, ${order.deliveryPostalCode || ''} ${order.deliveryCity || ''}`.trim()
    : '';

  // Formatar data
  const orderDate = order.createdAt
    ? format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : '';

  // Mapear método de pagamento
  const paymentMethodMap: Record<string, string> = {
    CASH: 'Dinheiro',
    CARD: 'Cartão',
    MBWAY: 'MBWay',
    MULTIBANCO: 'Multibanco',
  };

  // Mapear status do pedido
  const statusMap: Record<string, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Em Preparação',
    READY: 'Pronto',
    DELIVERING: 'Em Entrega',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
  };

  return {
    // Cliente
    customer_name: order.customerName || 'Cliente',
    customer_email: order.customerEmail || '',
    customer_phone: order.customerPhone || '',

    // Pedido
    order_id: order.id || '',
    order_number: order.orderNumber || order.id || '',
    order_date: orderDate,
    order_status: statusMap[order.status] || order.status || '',
    payment_method: paymentMethodMap[order.paymentMethod] || order.paymentMethod || '',
    payment_status: order.paymentStatus || '',
    order_items: itemsTable,
    order_subtotal: order.subtotal ? `€${order.subtotal.toFixed(2)}` : '',
    order_discount: order.discount ? `€${order.discount.toFixed(2)}` : '€0.00',
    order_total: order.total ? `€${order.total.toFixed(2)}` : '',

    // Entrega
    delivery_address: deliveryAddress,
    delivery_type: order.deliveryType === 'DELIVERY' ? 'Entrega' : 'Levantamento',
    delivery_time_estimate: order.estimatedDeliveryTime || '30-45 minutos',
    delivery_fee: order.deliveryFee ? `€${order.deliveryFee.toFixed(2)}` : '€0.00',

    // Loja (de settings)
    store_name: settings?.companyName || 'SushiWorld',
    store_logo_url: settings?.logoUrl || '',
    store_whatsapp: settings?.phone || '',
    store_instagram: settings?.instagram || '',
    store_support_email: settings?.email || 'pedidos@sushiworld.pt',
  };
}

/**
 * Lista de todas as variáveis disponíveis com descrição
 * Use para documentação e autocomplete
 */
export const AVAILABLE_VARIABLES = [
  // Cliente
  { key: 'customer_name', description: 'Nome do cliente', example: 'João Silva' },
  { key: 'customer_email', description: 'Email do cliente', example: 'joao@example.com' },
  { key: 'customer_phone', description: 'Telefone do cliente', example: '+351 912 345 678' },

  // Pedido
  { key: 'order_id', description: 'ID único do pedido', example: 'clx123abc' },
  { key: 'order_number', description: 'Número do pedido', example: '#12345' },
  { key: 'order_date', description: 'Data e hora do pedido', example: '25 de dezembro de 2024 às 18:30' },
  { key: 'order_status', description: 'Status do pedido', example: 'Confirmado' },
  { key: 'payment_method', description: 'Forma de pagamento', example: 'MBWay' },
  { key: 'payment_status', description: 'Status do pagamento', example: 'Pago' },
  { key: 'order_items', description: 'Lista formatada de produtos (HTML)', example: '<table>...</table>' },
  { key: 'order_subtotal', description: 'Subtotal do pedido', example: '€25.50' },
  { key: 'order_discount', description: 'Desconto aplicado', example: '€2.00' },
  { key: 'order_total', description: 'Valor total do pedido', example: '€23.50' },

  // Entrega
  { key: 'delivery_address', description: 'Endereço de entrega', example: 'Rua Example, 123, 1000-000 Lisboa' },
  { key: 'delivery_type', description: 'Tipo de entrega', example: 'Entrega' },
  { key: 'delivery_time_estimate', description: 'Tempo estimado', example: '30-45 minutos' },
  { key: 'delivery_fee', description: 'Taxa de entrega', example: '€2.50' },

  // Loja
  { key: 'store_name', description: 'Nome da loja', example: 'SushiWorld' },
  { key: 'store_logo_url', description: 'URL do logo', example: 'https://...' },
  { key: 'store_whatsapp', description: 'WhatsApp da loja', example: '+351 912 345 678' },
  { key: 'store_instagram', description: 'Instagram da loja', example: '@sushiworld' },
  { key: 'store_support_email', description: 'Email de suporte', example: 'pedidos@sushiworld.pt' },

  // Mídia
  { key: 'hero_image_url', description: 'Imagem principal', example: 'https://...' },
  { key: 'promo_gif_url', description: 'GIF promocional', example: 'https://...' },
  { key: 'product_image_url', description: 'Imagem do produto', example: 'https://...' },

  // Outros
  { key: 'current_year', description: 'Ano atual', example: '2024' },
  { key: 'tracking_url', description: 'URL de rastreamento', example: 'https://...' },
  { key: 'unsubscribe_url', description: 'URL para descadastrar', example: 'https://...' },
] as const;

/**
 * Valida se um template contém variáveis válidas
 *
 * @param template - Template HTML
 * @returns Lista de variáveis encontradas e se são válidas
 */
export function validateTemplateVariables(template: string): {
  valid: { key: string; position: number }[];
  invalid: { key: string; position: number }[];
} {
  const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const validKeys = new Set(AVAILABLE_VARIABLES.map(v => v.key));

  const valid: { key: string; position: number }[] = [];
  const invalid: { key: string; position: number }[] = [];

  let match;
  while ((match = variableRegex.exec(template)) !== null) {
    const key = match[1];
    const position = match.index;

    if (validKeys.has(key)) {
      valid.push({ key, position });
    } else {
      invalid.push({ key, position });
    }
  }

  return { valid, invalid };
}

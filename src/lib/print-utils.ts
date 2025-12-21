/**
 * Utilitários para geração de recibos de impressão
 */

export function renderOrderReceipt(
  orderData: any,
  companyInfo: any,
  printerConfig: any,
  paperSize: string
): string {
  // Processar dados do pedido para o formato esperado
  const order = {
    id: orderData.id,
    orderNumber: orderData.orderNumber.toString(),
    paymentMethod: orderData.paymentMethod === 'CASH' ? 'Dinheiro' : 'Cartão na entrega',
    asapTime: 60, // Tempo padrão ASAP
    estimatedDriveTime: 13, // Tempo estimado
    trafficInfo: `Pedido realizado em ${new Date(orderData.createdAt).toLocaleString('pt-PT')}`,
    deliveryDistance: 'A calcular',
    deliveryAddress: typeof orderData.deliveryAddress === 'string'
      ? orderData.deliveryAddress
      : `${orderData.deliveryAddress?.street || ''}, ${orderData.deliveryAddress?.city || ''}`,
    placedAt: orderData.createdAt,
    acceptedAt: orderData.acceptedAt || orderData.createdAt,
    completedAt: orderData.completedAt || new Date().toISOString(),
    customer: {
      firstName: orderData.customerName.split(' ')[0] || orderData.customerName,
      lastName: orderData.customerName.split(' ').slice(1).join(' ') || '',
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
    },
    specialInstructions: orderData.observations || '',
    items: (orderData.orderItems || orderData.items || []).map((item: any) => ({
      quantity: item.quantity,
      name: item.name,
      variant: item.selectedOptions ? JSON.stringify(item.selectedOptions) : '',
      notes: '',
      price: item.priceAtTime,
    })),
    subtotal: orderData.subtotal,
    deliveryFee: orderData.deliveryFee || 0,
    bagFee: 0.50,
    total: orderData.total,
  };

  const company = {
    name: companyInfo.companyName || 'SushiWorld',
    address: companyInfo.companyAddress || '',
    phone: companyInfo.companyPhone || '',
    websiteUrl: companyInfo.websiteUrl || '',
  };

  // Usar configuração padrão se não houver configuração salva
  const config = printerConfig || {
    sections: [
      { id: 'payment', enabled: true, order: 1 },
      { id: 'asap', enabled: true, order: 2 },
      { id: 'drive-time', enabled: true, order: 3 },
      { id: 'delivery-info', enabled: true, order: 4 },
      { id: 'order-details', enabled: true, order: 5 },
      { id: 'customer-info', enabled: true, order: 6 },
      { id: 'special-instructions', enabled: true, order: 7 },
      { id: 'items', enabled: true, order: 8 },
      { id: 'totals', enabled: true, order: 9 },
      { id: 'footer', enabled: true, order: 10 },
    ],
    fields: {
      showPaymentMethod: true,
      showAsapTime: true,
      showEstimatedDrive: true,
      showTrafficInfo: true,
      showDeliveryDistance: true,
      showQRCode: true,
      showOrderNumber: true,
      showOrderDates: true,
      showCustomerName: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showSpecialInstructions: true,
      showItemVariants: true,
      showItemNotes: true,
      showSubtotal: true,
      showDeliveryFee: true,
      showBagFee: true,
      showTotal: true,
      showCompanyInfo: true,
      showWebsiteUrl: true,
    },
  };

  // Gerar HTML do recibo
  const receiptContent = generateReceiptHTML(order, company, config);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido #${order.orderNumber} - ${company.name}</title>
        <style>
          ${getPrintStyles(paperSize)}
        </style>
      </head>
      <body>
        <div class="print-receipt">
          ${receiptContent}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;
}

function generateReceiptHTML(order: any, company: any, config: any): string {
  const sections = config.sections.sort((a: any, b: any) => a.order - b.order);
  let html = '';

  sections.forEach((section: any) => {
    if (!section.enabled) return;

    const sectionHTML = renderSection(section.id, order, company, config.fields);
    if (sectionHTML) {
      html += sectionHTML;
    }
  });

  return html;
}

function renderSection(sectionId: string, order: any, company: any, fields: any): string {
  switch (sectionId) {
    case 'payment':
      if (!fields.showPaymentMethod) return '';
      return `
        <div class="bg-[#2a2a2a] text-white px-4 py-2">
          <div class="text-sm font-medium">${order.paymentMethod}</div>
        </div>
      `;

    case 'asap':
      if (!fields.showAsapTime) return '';
      return `
        <div class="bg-[#2a2a2a] text-white px-4 py-2 flex justify-between items-center">
          <span class="text-sm font-medium">ASAP</span>
          <span class="text-sm font-bold">${order.asapTime} min.</span>
        </div>
      `;

    case 'drive-time':
      if (!fields.showEstimatedDrive) return '';
      return `
        <div class="border-b border-gray-200">
          <div class="bg-[#2a2a2a] text-white px-4 py-2 flex justify-between items-center">
            <span class="text-sm">Tempo estimado de condução</span>
            <span class="text-sm font-bold">~ ${order.estimatedDriveTime} minutos</span>
          </div>
          ${fields.showTrafficInfo ? `
            <div class="px-4 py-2 text-xs text-gray-600 bg-gray-50">
              ${order.trafficInfo}
            </div>
          ` : ''}
        </div>
      `;

    case 'delivery-info':
      return `
        <div class="border-b border-gray-200">
          <div class="bg-[#2a2a2a] text-white px-4 py-2 flex justify-between items-center">
            <span class="text-sm font-medium">Entrega</span>
            ${fields.showDeliveryDistance ? `<span class="text-sm">${order.deliveryDistance}</span>` : ''}
          </div>
          <div class="px-4 py-3">
            <p class="text-sm text-gray-700">${order.deliveryAddress}</p>
          </div>
        </div>
      `;

    case 'order-details':
      return `
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="font-semibold text-sm mb-2">Detalhes da encomenda:</h3>
          <div class="space-y-1 text-xs">
            ${fields.showOrderNumber ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Número:</span>
                <span class="font-medium">${order.orderNumber}</span>
              </div>
            ` : ''}
            ${fields.showOrderDates ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Colocado em:</span>
                <span class="font-medium">${new Date(order.placedAt).toLocaleString('pt-PT')}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Aceite em:</span>
                <span class="font-medium">${new Date(order.acceptedAt).toLocaleString('pt-PT')}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;

    case 'customer-info':
      return `
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="font-semibold text-sm mb-2">Info do cliente:</h3>
          <div class="space-y-1 text-xs">
            ${fields.showCustomerName ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Nome:</span>
                <span class="font-medium">${order.customer.firstName} ${order.customer.lastName}</span>
              </div>
            ` : ''}
            ${fields.showCustomerEmail ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Email:</span>
                <span class="font-medium text-xs">${order.customer.email}</span>
              </div>
            ` : ''}
            ${fields.showCustomerPhone ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Telefone:</span>
                <span class="font-medium">${order.customer.phone}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;

    case 'special-instructions':
      if (!fields.showSpecialInstructions || !order.specialInstructions) return '';
      return `
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2">
            <p class="text-xs text-amber-900">${order.specialInstructions}</p>
          </div>
        </div>
      `;

    case 'items':
      return `
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="font-semibold text-sm mb-2">Itens:</h3>
          <div class="space-y-2">
            ${order.items.map((item: any) => `
              <div class="text-xs">
                <div class="flex justify-between">
                  <span class="font-medium">${item.quantity}x ${item.name}</span>
                  <span class="font-semibold">€ ${item.price.toFixed(2)}</span>
                </div>
                ${fields.showItemVariants && item.variant ? `
                  <p class="text-gray-500 italic ml-4 text-[11px]">${item.variant}</p>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'totals':
      return `
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="space-y-1 text-xs">
            ${fields.showSubtotal ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">€ ${order.subtotal.toFixed(2)}</span>
              </div>
            ` : ''}
            ${fields.showDeliveryFee ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Taxa de entrega:</span>
                <span class="font-medium">€ ${order.deliveryFee.toFixed(2)}</span>
              </div>
            ` : ''}
            ${fields.showBagFee ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Taxa de Saco:</span>
                <span class="font-medium">€ ${order.bagFee.toFixed(2)}</span>
              </div>
            ` : ''}
            ${fields.showTotal ? `
              <div class="flex justify-between pt-2 border-t border-gray-300">
                <span class="font-bold text-sm">Total:</span>
                <span class="font-bold text-sm">€ ${order.total.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;

    case 'footer':
      return `
        <div class="px-4 py-3">
          ${fields.showWebsiteUrl ? `
            <div class="border border-gray-300 rounded p-3 text-center mb-3">
              <p class="text-xs font-semibold text-gray-700">Encomendar online:</p>
              <p class="text-xs text-gray-600 mt-1">${company.websiteUrl}</p>
            </div>
          ` : ''}
          ${fields.showCompanyInfo ? `
            <div class="text-center text-[10px] text-gray-600 space-y-0.5">
              <p class="font-semibold">${company.name}</p>
              <p>${company.address}</p>
              <p>${company.phone}</p>
            </div>
          ` : ''}
        </div>
      `;

    default:
      return '';
  }
}

function getPrintStyles(paperSize: string): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 20px;
      background: #f5f5f5;
      line-height: 1.5;
    }
    .print-receipt {
      max-width: ${paperSize === '58mm' ? '58mm' : '80mm'};
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border: 1px solid #ddd;
    }
    .print-receipt > div {
      padding: 0;
    }
    .bg-\\[\\#2a2a2a\\] {
      background-color: #2a2a2a !important;
    }
    .text-white {
      color: white !important;
    }
    .px-4 {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    .py-2 {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
    .py-3 {
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
    }
    .text-sm {
      font-size: 0.875rem;
    }
    .text-xs {
      font-size: 0.75rem;
    }
    .font-medium {
      font-weight: 500;
    }
    .font-bold {
      font-weight: 700;
    }
    .font-semibold {
      font-weight: 600;
    }
    .border-b {
      border-bottom-width: 1px;
    }
    .border-gray-200 {
      border-color: #e5e7eb;
    }
    .bg-gray-50 {
      background-color: #f9fafb;
    }
    .bg-amber-50 {
      background-color: #fffbeb;
    }
    .border-amber-200 {
      border-color: #fde68a;
    }
    .text-amber-900 {
      color: #78350f;
    }
    .text-gray-600 {
      color: #4b5563;
    }
    .text-gray-700 {
      color: #374151;
    }
    .rounded {
      border-radius: 0.25rem;
    }
    .border {
      border-width: 1px;
    }
    .p-2 {
      padding: 0.5rem;
    }
    .p-3 {
      padding: 0.75rem;
    }
    .flex {
      display: flex;
    }
    .items-start {
      align-items: flex-start;
    }
    .items-center {
      align-items: center;
    }
    .justify-between {
      justify-content: space-between;
    }
    .justify-center {
      justify-content: center;
    }
    .gap-2 {
      gap: 0.5rem;
    }
    .space-y-1 > * + * {
      margin-top: 0.25rem;
    }
    .space-y-2 > * + * {
      margin-top: 0.5rem;
    }
    .mb-2 {
      margin-bottom: 0.5rem;
    }
    .mb-3 {
      margin-bottom: 0.75rem;
    }
    .mt-1 {
      margin-top: 0.25rem;
    }
    .text-center {
      text-align: center;
    }
    .italic {
      font-style: italic;
    }
    .ml-4 {
      margin-left: 1rem;
    }
    .pt-2 {
      padding-top: 0.5rem;
    }
    .border-t {
      border-top-width: 1px;
    }
    .border-gray-300 {
      border-color: #d1d5db;
    }
    @media print {
      @page {
        size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto;
        margin: 0;
      }
      body {
        background: white;
        padding: 0;
        margin: 0;
      }
      .print-receipt {
        box-shadow: none;
        border: none;
        max-width: 100%;
        width: 100%;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  `;
}

'use client';

import React from 'react';
import QRCode from 'qrcode.react';
import { Info, MessageSquare } from 'lucide-react';

export interface OrderReceiptSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface OrderReceiptConfig {
  sections: OrderReceiptSection[];
  fields: {
    showPaymentMethod: boolean;
    showAsapTime: boolean;
    showEstimatedDrive: boolean;
    showTrafficInfo: boolean;
    showDeliveryDistance: boolean;
    showQRCode: boolean;
    showOrderNumber: boolean;
    showOrderDates: boolean;
    showCustomerName: boolean;
    showCustomerEmail: boolean;
    showCustomerPhone: boolean;
    showSpecialInstructions: boolean;
    showItemVariants: boolean;
    showItemNotes: boolean;
    showSubtotal: boolean;
    showDeliveryFee: boolean;
    showBagFee: boolean;
    showTotal: boolean;
    showCompanyInfo: boolean;
    showWebsiteUrl: boolean;
  };
}

export interface OrderReceiptProps {
  order: {
    id: string;
    orderNumber: string;
    paymentMethod: string;
    asapTime: number;
    estimatedDriveTime: number;
    trafficInfo: string;
    deliveryDistance: string;
    deliveryAddress: string;
    placedAt: string;
    acceptedAt: string;
    completedAt: string;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    specialInstructions?: string;
    items: Array<{
      quantity: number;
      name: string;
      variant?: string;
      notes?: string;
      price: number;
    }>;
    subtotal: number;
    deliveryFee: number;
    bagFee: number;
    total: number;
  };
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    websiteUrl: string;
  };
  config?: OrderReceiptConfig;
}

const defaultConfig: OrderReceiptConfig = {
  sections: [
    { id: 'payment', name: 'Método de Pagamento', enabled: true, order: 1 },
    { id: 'asap', name: 'Tempo ASAP', enabled: true, order: 2 },
    { id: 'drive-time', name: 'Tempo de Condução', enabled: true, order: 3 },
    { id: 'delivery-info', name: 'Informações de Entrega', enabled: true, order: 4 },
    { id: 'order-details', name: 'Detalhes da Encomenda', enabled: true, order: 5 },
    { id: 'customer-info', name: 'Info do Cliente', enabled: true, order: 6 },
    { id: 'special-instructions', name: 'Instruções Especiais', enabled: true, order: 7 },
    { id: 'items', name: 'Itens do Pedido', enabled: true, order: 8 },
    { id: 'totals', name: 'Totais', enabled: true, order: 9 },
    { id: 'footer', name: 'Rodapé', enabled: true, order: 10 },
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

export default function OrderReceiptPreview({ order, companyInfo, config = defaultConfig }: OrderReceiptProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return `€ ${value.toFixed(2)}`;
  };

  const sections = config.sections.sort((a, b) => a.order - b.order);

  const renderSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section?.enabled) return null;

    switch (sectionId) {
      case 'payment':
        if (!config.fields.showPaymentMethod) return null;
        return (
          <div key="payment" className="bg-[#2a2a2a] text-white px-4 py-2">
            <div className="text-sm font-medium">{order.paymentMethod}</div>
          </div>
        );

      case 'asap':
        if (!config.fields.showAsapTime) return null;
        return (
          <div key="asap" className="bg-[#2a2a2a] text-white px-4 py-2 flex justify-between items-center">
            <span className="text-sm font-medium">ASAP</span>
            <span className="text-sm font-bold">{order.asapTime} min.</span>
          </div>
        );

      case 'drive-time':
        if (!config.fields.showEstimatedDrive) return null;
        return (
          <div key="drive-time" className="border-b border-gray-200">
            <div className="bg-[#2a2a2a] text-white px-4 py-2 flex justify-between items-center">
              <span className="text-sm">Tempo estimado de condução</span>
              <span className="text-sm font-bold">~ {order.estimatedDriveTime} minutos</span>
            </div>
            {config.fields.showTrafficInfo && (
              <div className="px-4 py-2 text-xs text-gray-600 bg-gray-50">
                {order.trafficInfo}
              </div>
            )}
          </div>
        );

      case 'delivery-info':
        return (
          <div key="delivery-info" className="border-b border-gray-200">
            <div className="bg-[#2a2a2a] text-white px-4 py-2 flex justify-between items-center">
              <span className="text-sm font-medium">Entrega</span>
              {config.fields.showDeliveryDistance && (
                <span className="text-sm">{order.deliveryDistance}</span>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
              {config.fields.showQRCode && (
                <div className="flex justify-center mt-3">
                  <QRCode
                    value={`${companyInfo.websiteUrl}/pedido/${order.id}`}
                    size={120}
                    level="M"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'order-details':
        return (
          <div key="order-details" className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm mb-2">Detalhes da encomenda:</h3>
            <div className="space-y-1 text-xs">
              {config.fields.showOrderNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Número:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
              )}
              {config.fields.showOrderDates && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colocado em:</span>
                    <span className="font-medium">{formatDate(order.placedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aceite em:</span>
                    <span className="font-medium">{formatDate(order.acceptedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Realizado em:</span>
                    <span className="font-medium">{formatDate(order.completedAt)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'customer-info':
        return (
          <div key="customer-info" className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm mb-2">Info do cliente:</h3>
            <div className="space-y-1 text-xs">
              {config.fields.showCustomerName && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-medium">{order.customer.firstName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Apelido:</span>
                    <span className="font-medium">{order.customer.lastName}</span>
                  </div>
                </>
              )}
              {config.fields.showCustomerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-xs">{order.customer.email}</span>
                </div>
              )}
              {config.fields.showCustomerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefone:</span>
                  <span className="font-medium">{order.customer.phone}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'special-instructions':
        if (!config.fields.showSpecialInstructions || !order.specialInstructions) return null;
        return (
          <div key="special-instructions" className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900">{order.specialInstructions}</p>
            </div>
          </div>
        );

      case 'items':
        return (
          <div key="items" className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm mb-2">Itens:</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.price)}</span>
                  </div>
                  {config.fields.showItemVariants && item.variant && (
                    <p className="text-gray-500 italic ml-4 text-[11px]">{item.variant}</p>
                  )}
                  {config.fields.showItemNotes && item.notes && (
                    <div className="flex items-start gap-1 ml-4 mt-1">
                      <MessageSquare className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-600 text-[11px]">{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'totals':
        return (
          <div key="totals" className="px-4 py-3 border-b border-gray-200">
            <div className="space-y-1 text-xs">
              {config.fields.showSubtotal && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
              )}
              {config.fields.showDeliveryFee && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de entrega:</span>
                  <span className="font-medium">{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              {config.fields.showBagFee && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Saco:</span>
                  <span className="font-medium">{formatCurrency(order.bagFee)}</span>
                </div>
              )}
              {config.fields.showTotal && (
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-bold text-sm">Total:</span>
                  <span className="font-bold text-sm">{formatCurrency(order.total)}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div key="footer" className="px-4 py-3">
            {config.fields.showWebsiteUrl && (
              <div className="border border-gray-300 rounded p-3 text-center mb-3">
                <p className="text-xs font-semibold text-gray-700">Encomendar online:</p>
                <p className="text-xs text-gray-600 mt-1">{companyInfo.websiteUrl}</p>
              </div>
            )}
            {config.fields.showCompanyInfo && (
              <div className="text-center text-[10px] text-gray-600 space-y-0.5">
                <p className="font-semibold">{companyInfo.name}</p>
                <p>{companyInfo.address}</p>
                <p>{companyInfo.phone}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-[400px] mx-auto bg-white shadow-lg border border-gray-300">
      {sections.map((section) => renderSection(section.id))}
    </div>
  );
}

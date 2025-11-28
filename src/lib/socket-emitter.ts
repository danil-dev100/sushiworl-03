// Emissão de eventos via API interna (para uso em Next.js API routes)
// Este módulo permite emitir eventos mesmo quando o Socket.IO não está diretamente acessível

let globalIO: any = null;

export function setGlobalIO(io: any) {
  globalIO = io;
}

export function getGlobalIO() {
  return globalIO;
}

export interface OrderEventData {
  id: string;
  orderNumber?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: any;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  vatAmount: number;
  createdAt: Date;
  orderItems: Array<{
    id: string;
    name: string;
    quantity: number;
    priceAtTime: number;
  }>;
}

// Funções para emitir eventos
export async function emitNewOrderEvent(order: OrderEventData) {
  if (globalIO) {
    globalIO.to('admin').emit('pedido:novo', order);
    console.log('[Socket Emitter] pedido:novo emitido:', order.id);
  } else {
    console.warn('[Socket Emitter] IO não disponível para emitir pedido:novo');
  }
}

export async function emitOrderCancelledEvent(order: OrderEventData) {
  if (globalIO) {
    globalIO.to('admin').emit('pedido:cancelado', order);
    console.log('[Socket Emitter] pedido:cancelado emitido:', order.id);
  } else {
    console.warn('[Socket Emitter] IO não disponível para emitir pedido:cancelado');
  }
}

export async function emitOrderUpdatedEvent(order: OrderEventData) {
  if (globalIO) {
    globalIO.to('admin').emit('pedido:atualizado', order);
    console.log('[Socket Emitter] pedido:atualizado emitido:', order.id);
  } else {
    console.warn('[Socket Emitter] IO não disponível para emitir pedido:atualizado');
  }
}

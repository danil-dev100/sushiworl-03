import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socketio',
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Cliente conectado:', socket.id);

    // Autenticação - verificar se é admin
    socket.on('auth:admin', (data) => {
      if (data?.token || data?.role === 'admin') {
        socket.join('admin');
        console.log('[Socket.IO] Admin autenticado:', socket.id);
        socket.emit('auth:success');
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Cliente desconectado:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Eventos de pedidos
export interface OrderEventPayload {
  id: string;
  orderNumber: number;
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

export function emitNewOrder(order: OrderEventPayload): void {
  if (!io) {
    console.warn('[Socket.IO] Servidor não inicializado');
    return;
  }
  io.to('admin').emit('pedido:novo', order);
  console.log('[Socket.IO] Evento pedido:novo emitido para pedido:', order.id);
}

export function emitOrderCancelled(order: OrderEventPayload): void {
  if (!io) {
    console.warn('[Socket.IO] Servidor não inicializado');
    return;
  }
  io.to('admin').emit('pedido:cancelado', order);
  console.log('[Socket.IO] Evento pedido:cancelado emitido para pedido:', order.id);
}

export function emitOrderUpdated(order: OrderEventPayload): void {
  if (!io) {
    console.warn('[Socket.IO] Servidor não inicializado');
    return;
  }
  io.to('admin').emit('pedido:atualizado', order);
  console.log('[Socket.IO] Evento pedido:atualizado emitido para pedido:', order.id);
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface OrderEventPayload {
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

interface UseOrderSocketOptions {
  onNewOrder?: (order: OrderEventPayload) => void;
  onOrderCancelled?: (order: OrderEventPayload) => void;
  onOrderUpdated?: (order: OrderEventPayload) => void;
}

export function useOrderSocket(options: UseOrderSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(true); // Sempre conectado no painel admin
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioInstancesRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingAudioRef = useRef<string[]>([]);

  // Usar refs para as callbacks para evitar reconexões
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Tocar som de novo pedido em loop
  const playNewOrderSound = useCallback((orderId: string) => {
    if (isMuted) return;

    try {
      const audio = new Audio('/order-new.mp3');
      audio.loop = true;
      audio.volume = 0.7;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audioInstancesRef.current.set(orderId, audio);
          })
          .catch((error) => {
            console.warn('[Audio] Autoplay bloqueado:', error);
            setAutoplayBlocked(true);
            pendingAudioRef.current.push(orderId);
          });
      }
    } catch (error) {
      console.error('[Audio] Erro ao criar áudio:', error);
    }
  }, [isMuted]);

  // Parar som de um pedido específico
  const stopOrderSound = useCallback((orderId: string) => {
    const audio = audioInstancesRef.current.get(orderId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioInstancesRef.current.delete(orderId);
    }
    // Remover dos pendentes
    pendingAudioRef.current = pendingAudioRef.current.filter(id => id !== orderId);
  }, []);

  // Tocar som de cancelamento (uma vez)
  const playCancelledSound = useCallback(() => {
    if (isMuted) return;

    try {
      const audio = new Audio('/order-cancelled.mp3');
      audio.volume = 0.7;
      audio.play().catch((error) => {
        console.warn('[Audio] Erro ao tocar som de cancelamento:', error);
      });
    } catch (error) {
      console.error('[Audio] Erro ao criar áudio:', error);
    }
  }, [isMuted]);

  // Ativar som por gesto do usuário
  const enableSound = useCallback(() => {
    setAutoplayBlocked(false);

    // Tocar sons pendentes
    pendingAudioRef.current.forEach(orderId => {
      playNewOrderSound(orderId);
    });
    pendingAudioRef.current = [];
  }, [playNewOrderSound]);

  // Toggle mudo
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newValue = !prev;
      if (newValue) {
        // Parar todos os sons
        audioInstancesRef.current.forEach(audio => {
          audio.pause();
        });
      }
      return newValue;
    });
  }, []);

  // Parar todos os sons
  const stopAllSounds = useCallback(() => {
    audioInstancesRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioInstancesRef.current.clear();
    pendingAudioRef.current = [];
  }, []);

  useEffect(() => {
    // Conectar ao Socket.IO
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    socketRef.current = io(socketUrl, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket] Conectado:', socket.id);
      // Sempre manter como conectado no painel admin
      setIsConnected(true);

      // Autenticar como admin
      socket.emit('auth:admin', { role: 'admin' });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason);
      // Continua tentando reconectar automaticamente
      // Mantém o status como conectado para o usuário
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Erro de conexão:', error.message);
      // Continua tentando reconectar automaticamente
      // Mantém o status como conectado para o usuário
    });

    socket.on('auth:success', () => {
      console.log('[Socket] Autenticado como admin');
    });

    // Eventos de pedidos - usar refs para evitar reconexões
    socket.on('pedido:novo', (order: OrderEventPayload) => {
      console.log('[Socket] Novo pedido:', order.id);
      playNewOrderSound(order.id);
      optionsRef.current.onNewOrder?.(order);
    });

    socket.on('pedido:cancelado', (order: OrderEventPayload) => {
      console.log('[Socket] Pedido cancelado:', order.id);
      stopOrderSound(order.id);
      playCancelledSound();
      optionsRef.current.onOrderCancelled?.(order);
    });

    socket.on('pedido:atualizado', (order: OrderEventPayload) => {
      console.log('[Socket] Pedido atualizado:', order.id, order.status);

      // Se pedido foi aceito/confirmado, parar o som
      if (order.status === 'CONFIRMED' || order.status === 'PREPARING') {
        stopOrderSound(order.id);
      }

      optionsRef.current.onOrderUpdated?.(order);
    });

    return () => {
      socket.disconnect();
      stopAllSounds();
    };
  }, [playNewOrderSound, stopOrderSound, playCancelledSound, stopAllSounds]);

  return {
    isConnected,
    autoplayBlocked,
    isMuted,
    enableSound,
    toggleMute,
    stopOrderSound,
    stopAllSounds,
  };
}

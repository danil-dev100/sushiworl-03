/**
 * Event Dispatcher Central para Pixels de Rastreamento
 *
 * Sistema unificado para disparar eventos de conversão para múltiplas plataformas
 * (Facebook Pixel, Google Analytics, TikTok, etc.) respeitando configurações do admin.
 */

export type TrackingEventType =
  | 'page_view'
  | 'sign_up'
  | 'add_to_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'cart_abandonment';

export interface TrackingEventPayload {
  // Dados do pedido
  orderId?: string;
  value?: number;
  currency?: string;

  // Dados do produto
  items?: Array<{
    id?: string;
    name?: string;
    quantity?: number;
    price?: number;
    category?: string;
  }>;

  // Dados do cliente
  customer?: {
    email?: string;
    phone?: string;
    name?: string;
  };

  // Metadados
  pageUrl?: string;
  referrer?: string;

  // Dados adicionais
  [key: string]: any;
}

interface TrackingConfig {
  integrations: Array<{
    id: string;
    platform: string;
    type: string;
    pixelId: string | null;
    measurementId: string | null;
    isActive: boolean;
    events: string[];
  }>;
}

// Cache de configuração (renovado a cada 5 minutos)
let configCache: TrackingConfig | null = null;
let configCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Busca configurações ativas de pixels do backend
 */
async function fetchTrackingConfig(): Promise<TrackingConfig> {
  const now = Date.now();

  // Retornar cache se ainda válido
  if (configCache && (now - configCacheTime) < CACHE_TTL) {
    return configCache;
  }

  try {
    const response = await fetch('/api/events/config', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const config = await response.json();
      configCache = config;
      configCacheTime = now;
      return config;
    }
  } catch (error) {
    console.error('[TrackEvent] Erro ao buscar configuração:', error);
  }

  // Fallback: retornar cache expirado ou vazio
  return configCache || { integrations: [] };
}

/**
 * Gera um ID único para deduplicação entre Pixel e API
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Dispara evento para Facebook Pixel (client-side)
 */
function trackFacebookPixel(
  pixelId: string,
  eventType: TrackingEventType,
  payload: TrackingEventPayload,
  eventId: string
): void {
  if (typeof window === 'undefined' || !window.fbq) {
    console.warn('[TrackEvent] Facebook Pixel não encontrado');
    return;
  }

  const fbEventMap: Record<string, string> = {
    page_view: 'PageView',
    sign_up: 'CompleteRegistration',
    add_to_cart: 'AddToCart',
    view_cart: 'ViewContent',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
    cart_abandonment: 'AddToCart', // Mesmo evento, diferente contexto
  };

  const fbEventName = fbEventMap[eventType] || 'CustomEvent';

  const fbPayload: any = {
    content_type: 'product',
    eventID: eventId, // Importante para deduplicação com CAPI
  };

  if (payload.value) fbPayload.value = payload.value;
  if (payload.currency) fbPayload.currency = payload.currency;
  if (payload.items) {
    fbPayload.content_ids = payload.items.map(item => item.id || item.name);
    fbPayload.contents = payload.items.map(item => ({
      id: item.id || item.name,
      quantity: item.quantity || 1,
      item_price: item.price || 0,
    }));
  }

  console.log(`[TrackEvent] Facebook Pixel (${pixelId}): ${fbEventName}`, fbPayload);
  window.fbq('track', fbEventName, fbPayload);
}

/**
 * Dispara evento para Google Analytics 4 (client-side)
 */
function trackGoogleAnalytics(
  measurementId: string,
  eventType: TrackingEventType,
  payload: TrackingEventPayload
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('[TrackEvent] Google Analytics não encontrado');
    return;
  }

  const gaEventMap: Record<string, string> = {
    page_view: 'page_view',
    sign_up: 'sign_up',
    add_to_cart: 'add_to_cart',
    view_cart: 'view_cart',
    begin_checkout: 'begin_checkout',
    purchase: 'purchase',
    cart_abandonment: 'add_to_cart',
  };

  const gaEventName = gaEventMap[eventType] || eventType;

  const gaPayload: any = {};

  if (payload.value) gaPayload.value = payload.value;
  if (payload.currency) gaPayload.currency = payload.currency;
  if (payload.orderId) gaPayload.transaction_id = payload.orderId;
  if (payload.items) {
    gaPayload.items = payload.items.map((item, index) => ({
      item_id: item.id || `item_${index}`,
      item_name: item.name || 'Product',
      quantity: item.quantity || 1,
      price: item.price || 0,
      item_category: item.category || 'Food',
    }));
  }

  console.log(`[TrackEvent] Google Analytics (${measurementId}): ${gaEventName}`, gaPayload);
  window.gtag('event', gaEventName, gaPayload);
}

/**
 * Envia evento para o backend (server-side processing)
 */
async function sendToBackend(
  eventType: TrackingEventType,
  payload: TrackingEventPayload,
  eventId: string,
  integrations: Array<{ id: string; platform: string }>
): Promise<void> {
  try {
    // Capturar informações de origem
    const trackingData = {
      event: eventType,
      eventId,
      payload: {
        ...payload,
        pageUrl: window.location.href,
        referrer: document.referrer,
      },
      integrations: integrations.map(i => ({
        id: i.id,
        platform: i.platform,
      })),
      // Capturar parâmetros UTM da URL
      utm: {
        gclid: new URLSearchParams(window.location.search).get('gclid'),
        fbclid: new URLSearchParams(window.location.search).get('fbclid'),
        ttclid: new URLSearchParams(window.location.search).get('ttclid'),
      },
    };

    // Usar sendBeacon se disponível (mais confiável)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(trackingData)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/events/track', blob);
    } else {
      // Fallback para fetch com keepalive
      fetch('/api/events/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData),
        keepalive: true,
      }).catch(error => {
        console.error('[TrackEvent] Erro ao enviar para backend:', error);
      });
    }
  } catch (error) {
    console.error('[TrackEvent] Erro ao preparar envio:', error);
  }
}

/**
 * Função principal: Dispara evento de rastreamento
 *
 * @param eventType - Tipo do evento
 * @param payload - Dados do evento
 * @param options - Opções adicionais
 */
export async function trackEvent(
  eventType: TrackingEventType,
  payload: TrackingEventPayload = {},
  options: { force?: boolean } = {}
): Promise<void> {
  // Não executar no servidor
  if (typeof window === 'undefined') {
    return;
  }

  console.log(`[TrackEvent] Disparando evento: ${eventType}`, payload);

  try {
    // Buscar configuração de pixels ativos
    const config = await fetchTrackingConfig();

    // Filtrar apenas integrações ativas que aceitam este evento
    const activeIntegrations = config.integrations.filter(
      integration =>
        integration.isActive &&
        (integration.events.includes(eventType) || options.force)
    );

    if (activeIntegrations.length === 0) {
      console.log(`[TrackEvent] Nenhuma integração ativa para evento: ${eventType}`);
      return;
    }

    // Gerar ID único para deduplicação
    const eventId = generateEventId();

    // Disparar eventos client-side (assíncrono, não bloqueia)
    setTimeout(() => {
      activeIntegrations.forEach(integration => {
        try {
          if (integration.platform === 'FACEBOOK' && integration.pixelId) {
            trackFacebookPixel(integration.pixelId, eventType, payload, eventId);
          } else if (
            integration.platform === 'GOOGLE_ANALYTICS' &&
            integration.measurementId
          ) {
            trackGoogleAnalytics(integration.measurementId, eventType, payload);
          }
          // Adicionar mais plataformas conforme necessário
        } catch (error) {
          console.error(`[TrackEvent] Erro ao disparar ${integration.platform}:`, error);
        }
      });
    }, 0);

    // Enviar para backend (CAPI, logs, etc.) - assíncrono
    setTimeout(() => {
      sendToBackend(eventType, payload, eventId, activeIntegrations);
    }, 100);

  } catch (error) {
    console.error('[TrackEvent] Erro geral:', error);
  }
}

/**
 * Limpa o cache de configuração (útil para testes)
 */
export function clearTrackingCache(): void {
  configCache = null;
  configCacheTime = 0;
}

// Declarações globais para TypeScript
declare global {
  interface Window {
    fbq?: (command: string, eventName: string, params?: any) => void;
    gtag?: (command: string, ...args: any[]) => void;
  }
}

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
    apiKey: string | null;
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
 * Dispara evento de conversão para Google Ads (client-side)
 */
function trackGoogleAds(
  conversionId: string,
  conversionLabel: string | null,
  eventType: TrackingEventType,
  payload: TrackingEventPayload
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('[TrackEvent] Google Ads gtag não encontrado');
    return;
  }

  // Eventos que geram conversões no Google Ads
  const conversionEvents: Record<string, boolean> = {
    purchase: true,
    begin_checkout: true,
    add_to_cart: true,
    sign_up: true,
  };

  // Só enviar conversão para eventos relevantes
  if (!conversionEvents[eventType]) {
    return;
  }

  const conversionData: any = {};

  if (payload.value) conversionData.value = payload.value;
  if (payload.currency) conversionData.currency = payload.currency;
  if (payload.orderId) conversionData.transaction_id = payload.orderId;

  // send_to: 'AW-XXXXXXXXX/label' para conversão específica
  if (conversionLabel) {
    conversionData.send_to = `${conversionId}/${conversionLabel}`;
  } else {
    conversionData.send_to = conversionId;
  }

  console.log(`[TrackEvent] Google Ads (${conversionId}): conversion`, conversionData);
  window.gtag('event', 'conversion', conversionData);
}

/**
 * Dispara evento para TikTok Pixel (client-side)
 */
function trackTikTok(
  pixelId: string,
  eventType: TrackingEventType,
  payload: TrackingEventPayload
): void {
  if (typeof window === 'undefined' || !window.ttq) {
    console.warn('[TrackEvent] TikTok Pixel não encontrado');
    return;
  }

  const ttEventMap: Record<string, string> = {
    page_view: 'ViewContent',
    sign_up: 'CompleteRegistration',
    add_to_cart: 'AddToCart',
    view_cart: 'ViewContent',
    begin_checkout: 'InitiateCheckout',
    purchase: 'CompletePayment',
    cart_abandonment: 'AddToCart',
  };

  const ttEventName = ttEventMap[eventType] || eventType;

  const ttPayload: any = {};
  if (payload.value) ttPayload.value = payload.value;
  if (payload.currency) ttPayload.currency = payload.currency;
  if (payload.items) {
    ttPayload.contents = payload.items.map(item => ({
      content_id: item.id || item.name,
      content_name: item.name,
      quantity: item.quantity || 1,
      price: item.price || 0,
    }));
    ttPayload.content_type = 'product';
  }

  console.log(`[TrackEvent] TikTok (${pixelId}): ${ttEventName}`, ttPayload);
  window.ttq.track(ttEventName, ttPayload);
}

/**
 * Dispara evento para Pinterest Tag (client-side)
 */
function trackPinterest(
  pixelId: string,
  eventType: TrackingEventType,
  payload: TrackingEventPayload
): void {
  if (typeof window === 'undefined' || !window.pintrk) {
    console.warn('[TrackEvent] Pinterest Tag não encontrado');
    return;
  }

  const pinEventMap: Record<string, string> = {
    page_view: 'pagevisit',
    sign_up: 'signup',
    add_to_cart: 'addtocart',
    view_cart: 'pagevisit',
    begin_checkout: 'checkout',
    purchase: 'checkout',
    cart_abandonment: 'addtocart',
  };

  const pinEventName = pinEventMap[eventType] || 'custom';

  const pinPayload: any = {};
  if (payload.value) pinPayload.value = payload.value;
  if (payload.currency) pinPayload.currency = payload.currency;
  if (payload.orderId) pinPayload.order_id = payload.orderId;
  if (payload.items) {
    pinPayload.line_items = payload.items.map(item => ({
      product_id: item.id || item.name,
      product_name: item.name,
      product_quantity: item.quantity || 1,
      product_price: item.price || 0,
      product_category: item.category || 'Food',
    }));
  }

  console.log(`[TrackEvent] Pinterest (${pixelId}): ${pinEventName}`, pinPayload);
  window.pintrk('track', pinEventName, pinPayload);
}

/**
 * Dispara evento para Taboola Pixel (client-side)
 */
function trackTaboola(
  accountId: string,
  eventType: TrackingEventType,
  payload: TrackingEventPayload
): void {
  if (typeof window === 'undefined' || !window._tfa) {
    console.warn('[TrackEvent] Taboola Pixel não encontrado');
    return;
  }

  const tblEventMap: Record<string, string> = {
    page_view: 'page_view',
    sign_up: 'lead',
    add_to_cart: 'add_to_cart',
    view_cart: 'page_view',
    begin_checkout: 'checkout',
    purchase: 'purchase',
    cart_abandonment: 'add_to_cart',
  };

  const tblEventName = tblEventMap[eventType] || eventType;

  const tblPayload: any = {
    notify: 'event',
    name: tblEventName,
    id: Number(accountId),
  };

  if (payload.value) tblPayload.revenue = payload.value;
  if (payload.currency) tblPayload.currency = payload.currency;
  if (payload.orderId) tblPayload.orderid = payload.orderId;
  if (payload.items) {
    tblPayload.quantity = payload.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  console.log(`[TrackEvent] Taboola (${accountId}): ${tblEventName}`, tblPayload);
  window._tfa.push(tblPayload);
}

/**
 * Captura e persiste parâmetros UTM/click IDs no sessionStorage
 * para que não se percam ao navegar entre páginas
 */
function getPersistedUtmParams(): Record<string, string | null> {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['gclid', 'fbclid', 'ttclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  // Salvar novos parâmetros da URL no sessionStorage
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      sessionStorage.setItem(`_track_${key}`, value);
    }
  });

  // Retornar valores persistidos (URL atual ou sessão anterior)
  return {
    gclid: params.get('gclid') || sessionStorage.getItem('_track_gclid'),
    fbclid: params.get('fbclid') || sessionStorage.getItem('_track_fbclid'),
    ttclid: params.get('ttclid') || sessionStorage.getItem('_track_ttclid'),
    utmSource: params.get('utm_source') || sessionStorage.getItem('_track_utm_source'),
    utmMedium: params.get('utm_medium') || sessionStorage.getItem('_track_utm_medium'),
    utmCampaign: params.get('utm_campaign') || sessionStorage.getItem('_track_utm_campaign'),
    utmTerm: params.get('utm_term') || sessionStorage.getItem('_track_utm_term'),
    utmContent: params.get('utm_content') || sessionStorage.getItem('_track_utm_content'),
  };
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
    // Capturar informações de origem com persistência
    const utm = getPersistedUtmParams();

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
      utm,
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
          } else if (
            integration.platform === 'GOOGLE_ADS' &&
            integration.measurementId
          ) {
            trackGoogleAds(integration.measurementId, integration.apiKey, eventType, payload);
          } else if (integration.platform === 'TIKTOK' && integration.pixelId) {
            trackTikTok(integration.pixelId, eventType, payload);
          } else if (integration.platform === 'PINTEREST' && integration.pixelId) {
            trackPinterest(integration.pixelId, eventType, payload);
          } else if (integration.platform === 'TABOOLA' && integration.pixelId) {
            trackTaboola(integration.pixelId, eventType, payload);
          }
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
    ttq?: { track: (eventName: string, params?: any) => void; page: () => void };
    pintrk?: (command: string, eventName?: string, params?: any) => void;
    _tfa?: Array<any>;
  }
}

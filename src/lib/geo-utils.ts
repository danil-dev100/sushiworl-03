/**
 * Utilities para validação geográfica de áreas de entrega
 */

/**
 * Verifica se um ponto está dentro de um polígono usando o algoritmo Ray Casting
 * @param point - [latitude, longitude]
 * @param polygon - Array de pontos [[lat, lng], [lat, lng], ...]
 * @returns true se o ponto está dentro do polígono
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: number[][]
): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];

    // Ray casting algorithm
    const intersect =
      lng1 > lng !== lng2 > lng &&
      lat < ((lat2 - lat1) * (lng - lng1)) / (lng2 - lng1) + lat1;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Geocodifica um endereço usando Nominatim (OpenStreetMap)
 * @param address - Endereço completo
 * @returns Coordenadas [latitude, longitude] ou null se não encontrado
 */
export async function geocodeAddress(
  address: string
): Promise<[number, number] | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address + ', Portugal'
      )}&limit=1`,
      {
        headers: {
          'User-Agent': 'SushiWorld-DeliveryValidation/1.0',
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }

    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
}

/**
 * Obtém localização aproximada baseada no IP
 * @param ip - Endereço IP (opcional, usa o IP do request se não fornecido)
 * @returns Coordenadas [latitude, longitude] ou null se não encontrado
 */
export async function getLocationFromIP(
  ip?: string
): Promise<[number, number] | null> {
  try {
    // Usa ip-api.com (gratuito, sem necessidade de API key)
    const url = ip
      ? `http://ip-api.com/json/${ip}`
      : 'http://ip-api.com/json';

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'success') {
      return [data.lat, data.lon];
    }

    return null;
  } catch (error) {
    console.error('Erro ao obter localização do IP:', error);
    return null;
  }
}

/**
 * Calcula a distância entre dois pontos em metros (Haversine formula)
 * @param point1 - [latitude, longitude]
 * @param point2 - [latitude, longitude]
 * @returns Distância em metros
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ============================================
// GEOCODIFICAÇÃO COM CONTEXTO GEOGRÁFICO
// ============================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SushiWorld Delivery App';
const REQUEST_TIMEOUT = 5000; // 5 segundos
const RATE_LIMIT_DELAY = 1100; // 1.1 segundos entre requests

// Cache em memória para evitar requests duplicados
const geocodeCache = new Map<string, { result: GeocodeResult | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export type DeliveryAreaData = {
  name: string;
  polygon: number[][];
  searchContexts?: string[];
};

export type GeocodeResult = {
  coordinates: [number, number]; // [lat, lng]
  confidence: number; // 0 a 1
  displayName?: string;
  areaName?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  type: string;
};

/**
 * Extrai contextos geográficos dos nomes das áreas
 * Ex: "Santa Iria - Centro" → ["Santa Iria de Azóia", "Santa Iria"]
 */
export function extractContextsFromAreas(areas: DeliveryAreaData[]): string[] {
  const contexts = new Set<string>();

  for (const area of areas) {
    // Adicionar contextos configurados manualmente
    if (area.searchContexts && area.searchContexts.length > 0) {
      area.searchContexts.forEach(ctx => contexts.add(ctx.trim()));
    }

    // Extrair do nome da área
    const name = area.name.toLowerCase();

    // Padrões comuns em Santa Iria
    if (name.includes('santa iria') || name.includes('sta iria')) {
      contexts.add('Santa Iria de Azóia');
      contexts.add('Santa Iria');
      contexts.add('Loures');
    }

    if (name.includes('são joão') || name.includes('s. joão')) {
      contexts.add('São João da Talha');
      contexts.add('Loures');
    }

    if (name.includes('póvoa')) {
      contexts.add('Póvoa de Santa Iria');
      contexts.add('Vila Franca de Xira');
    }

    // Adicionar concelho genérico se específico não identificado
    if (contexts.size === 0) {
      contexts.add('Loures');
      contexts.add('Lisboa');
    }
  }

  console.log(`[Geocode] Contextos extraídos: ${Array.from(contexts).join(', ')}`);
  return Array.from(contexts);
}

/**
 * Geocodifica um endereço usando Nominatim com contexto específico
 */
async function geocodeWithContext(
  address: string,
  context: string
): Promise<NominatimResult[]> {
  const query = `${address}, ${context}, Portugal`;
  const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}&limit=5`;

  console.log(`[Geocode] Buscando: "${query}"`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Geocode] Erro HTTP ${response.status} para contexto: ${context}`);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[Geocode] Timeout ao buscar com contexto: ${context}`);
    } else {
      console.error(`[Geocode] Erro ao buscar com contexto ${context}:`, error);
    }

    return [];
  }
}

/**
 * Geocodificação genérica (fallback) sem contexto específico
 */
async function geocodeAddressGeneric(address: string): Promise<NominatimResult[]> {
  const query = `${address}, Portugal`;
  const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}&limit=5`;

  console.log(`[Geocode] Fallback genérico: "${query}"`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Geocode] Erro HTTP ${response.status} no fallback`);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[Geocode] Erro no fallback genérico:', error);
    return [];
  }
}

/**
 * Encontra a melhor correspondência entre resultados e áreas ativas
 */
function findBestMatch(
  results: NominatimResult[],
  areas: DeliveryAreaData[]
): GeocodeResult | null {
  for (const result of results) {
    const coordinates: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];

    for (const area of areas) {
      if (isPointInPolygon(coordinates, area.polygon)) {
        console.log(`[Geocode] ✅ Match encontrado em: ${area.name}`);
        console.log(`[Geocode]    Coordenadas: [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`);
        console.log(`[Geocode]    Display: ${result.display_name}`);

        return {
          coordinates,
          confidence: Math.min(result.importance || 0.5, 1),
          displayName: result.display_name,
          areaName: area.name,
        };
      }
    }
  }

  return null;
}

/**
 * Geocodifica endereço usando contextos das áreas ativas
 *
 * ALGORITMO:
 * 1. Extrai contextos geográficos das áreas
 * 2. Para cada contexto, busca o endereço no Nominatim
 * 3. Verifica se algum resultado cai dentro dos polígonos
 * 4. Se nenhum match, faz busca genérica como fallback
 *
 * @param address - Endereço completo do cliente
 * @param areas - Áreas de entrega ativas com polígonos
 * @returns Coordenadas e confiança, ou null se não encontrado
 */
export async function geocodeAddressWithContext(
  address: string,
  areas: DeliveryAreaData[]
): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 5) {
    console.error('[Geocode] Endereço muito curto');
    return null;
  }

  if (areas.length === 0) {
    console.error('[Geocode] Nenhuma área ativa fornecida');
    return null;
  }

  // Verificar cache
  const cacheKey = address.toLowerCase().trim();
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Geocode] Resultado do cache');
    return cached.result;
  }

  console.log(`[Geocode] Iniciando busca para: "${address}"`);
  console.log(`[Geocode] ${areas.length} área(s) ativa(s)`);

  const contexts = extractContextsFromAreas(areas);
  let lastRequestTime = 0;

  // Tentar cada contexto
  for (const context of contexts) {
    // Rate limit: garantir 1 segundo entre requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`[Geocode] Aguardando ${delay}ms (rate limit)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const results = await geocodeWithContext(address, context);
    lastRequestTime = Date.now();

    if (results.length > 0) {
      const match = findBestMatch(results, areas);
      if (match) {
        // Salvar no cache
        geocodeCache.set(cacheKey, { result: match, timestamp: Date.now() });
        return match;
      }
    }
  }

  console.log('[Geocode] Nenhum match nos contextos, tentando fallback genérico...');

  // Fallback: busca genérica
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  const genericResults = await geocodeAddressGeneric(address);

  if (genericResults.length > 0) {
    const match = findBestMatch(genericResults, areas);
    if (match) {
      console.log('[Geocode] ✅ Match encontrado no fallback');
      geocodeCache.set(cacheKey, { result: match, timestamp: Date.now() });
      return match;
    }
  }

  console.log('[Geocode] ❌ Nenhum resultado encontrado');
  geocodeCache.set(cacheKey, { result: null, timestamp: Date.now() });
  return null;
}

/**
 * Limpa cache de geocodificação (útil para testes)
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
  console.log('[Geocode] Cache limpo');
}

/**
 * Retorna estatísticas do cache
 */
export function getGeocodeStats(): { cacheSize: number } {
  return {
    cacheSize: geocodeCache.size,
  };
}

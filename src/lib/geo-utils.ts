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

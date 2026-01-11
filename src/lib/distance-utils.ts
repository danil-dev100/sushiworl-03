/**
 * Utilitários para cálculo de distância geográfica
 */

/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converte graus para radianos
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Verifica se um ponto está dentro de um círculo
 * @param pointLat Latitude do ponto
 * @param pointLng Longitude do ponto
 * @param centerLat Latitude do centro do círculo
 * @param centerLng Longitude do centro do círculo
 * @param radiusKm Raio do círculo em quilômetros
 * @returns true se o ponto está dentro do círculo
 */
export function isPointInCircle(
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(pointLat, pointLng, centerLat, centerLng);
  return distance <= radiusKm;
}

/**
 * Calcula a taxa de entrega baseada na distância
 * @param distance Distância em quilômetros
 * @param pricePerKm Preço por quilômetro
 * @param baseFee Taxa base (opcional)
 * @returns Taxa de entrega total
 */
export function calculateDeliveryFeeByDistance(
  distance: number,
  pricePerKm: number,
  baseFee: number = 0
): number {
  return baseFee + distance * pricePerKm;
}

/**
 * Formata distância para exibição
 * @param km Distância em quilômetros
 * @returns String formatada (ex: "2.5 km" ou "850 m")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

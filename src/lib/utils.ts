import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes do Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata preço em euros
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/**
 * Formata data em português
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formata data e hora em português
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Gera SKU baseado no número do produto
 */
export function generateSKU(productNumber: number): string {
  return productNumber.toString().padStart(2, '0');
}

/**
 * Obtém URL da imagem do produto
 */
export function getProductImageUrl(sku: string): string {
  // Remove zeros à esquerda do SKU para obter o número da imagem
  const imageNumber = parseInt(sku, 10);
  return `/produtos.webp/${imageNumber}.webp`;
}

/**
 * Calcula IVA
 */
export function calculateVAT(
  price: number,
  vatRate: number,
  vatType: 'INCLUSIVE' | 'EXCLUSIVE'
): { vatAmount: number; totalWithVat: number; priceWithoutVat: number } {
  if (vatType === 'INCLUSIVE') {
    // IVA já incluído no preço
    const priceWithoutVat = price / (1 + vatRate / 100);
    const vatAmount = price - priceWithoutVat;
    return {
      vatAmount,
      totalWithVat: price,
      priceWithoutVat,
    };
  } else {
    // IVA somado ao preço
    const vatAmount = price * (vatRate / 100);
    const totalWithVat = price + vatAmount;
    return {
      vatAmount,
      totalWithVat,
      priceWithoutVat: price,
    };
  }
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone português
 */
export function isValidPhone(phone: string): boolean {
  // Remove espaços e caracteres especiais
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Valida formato português: +351 ou 00351 seguido de 9 dígitos
  const phoneRegex = /^(\+351|00351|351)?[1-9]\d{8}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Valida NIF português
 */
export function isValidNIF(nif: string): boolean {
  // Remove espaços
  const cleanNIF = nif.replace(/\s/g, '');
  
  // Deve ter 9 dígitos
  if (!/^\d{9}$/.test(cleanNIF)) {
    return false;
  }

  // Algoritmo de validação do NIF
  const digits = cleanNIF.split('').map(Number);
  const checkDigit = digits[8];
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }
  
  const remainder = sum % 11;
  const calculatedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return checkDigit === calculatedCheckDigit;
}

/**
 * Trunca texto
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Gera slug a partir de texto
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/--+/g, '-') // Remove hífens duplicados
    .trim();
}

/**
 * Delay (para testes)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifica se está no horário de atendimento
 */
export function isOpenNow(openingHours: any): boolean {
  if (!openingHours) return true;

  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todayHours = openingHours[dayOfWeek];
  if (!todayHours || todayHours.closed) return false;

  const [openHour, openMinute] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;

  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Obtém próximo horário de abertura
 */
export function getNextOpeningTime(openingHours: any): string | null {
  if (!openingHours) return null;

  const now = new Date();
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Procurar nos próximos 7 dias
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    const dayOfWeek = weekdays[checkDate.getDay()];
    
    const dayHours = openingHours[dayOfWeek];
    if (dayHours && !dayHours.closed) {
      const dayName = {
        sunday: 'Domingo',
        monday: 'Segunda-feira',
        tuesday: 'Terça-feira',
        wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira',
        friday: 'Sexta-feira',
        saturday: 'Sábado',
      }[dayOfWeek];
      
      return `${dayName} às ${dayHours.open}`;
    }
  }

  return null;
}

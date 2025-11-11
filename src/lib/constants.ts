/**
 * Constantes globais do sistema
 */

// Caminhos de imagens
export const IMAGES_PATH = {
  PRODUCTS: '/produtos.webp',
  BANNERS: '/banners',
  LOGO: '/logo.webp',
} as const;

// Status de pedidos
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  DELIVERING: 'DELIVERING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  DELIVERING: 'Em Entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
} as const;

export const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
} as const;

// Categorias de produtos
export const PRODUCT_CATEGORIES = [
  'Destaques',
  'Combinados',
  'Hots',
  'Entradas',
  'Poke Bowl',
  'Gunkan',
  'Sashimi',
  'Nigiri',
  'Makis',
  'Temaki',
] as const;

// Emojis por categoria
export const CATEGORY_EMOJIS = {
  'Destaques': '✨',
  'Combinados': '🍱',
  'Hots': '🔥',
  'Entradas': '🥢',
  'Poke Bowl': '🥗',
  'Gunkan': '🍣',
  'Sashimi': '🐟',
  'Nigiri': '🍣',
  'Makis': '🍙',
  'Temaki': '🌯',
} as const;

// Alérgenos disponíveis
export const ALLERGENS = [
  'Leite',
  'Frutos de casca rija',
  'Ovos',
  'Amendoins',
  'Peixe',
  'Trigo',
  'Marisco',
  'Soja',
] as const;

// Configurações do produto
export const PRODUCT_CONFIG_OPTIONS = [
  { value: 'isHot', label: 'Quente', icon: '🔥' },
  { value: 'isHalal', label: 'Halal', icon: '☪️' },
  { value: 'isVegan', label: 'Vegan', icon: '🌱' },
  { value: 'isDairyFree', label: 'Sem laticínios', icon: '🥛' },
  { value: 'isVegetarian', label: 'Vegetariano', icon: '🥬' },
  { value: 'isRaw', label: 'Cru', icon: '🐟' },
  { value: 'isGlutenFree', label: 'Sem glúten', icon: '🌾' },
  { value: 'isNutFree', label: 'Sem nozes', icon: '🥜' },
] as const;

// Métodos de pagamento
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'Cartão de Crédito',
  CASH: 'Dinheiro',
} as const;

// Tipos de IVA
export const VAT_TYPES = {
  INCLUSIVE: 'Inclusivo',
  EXCLUSIVE: 'Exclusivo',
} as const;

// Dias da semana
export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const WEEKDAY_LABELS = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
} as const;

// Limites
export const LIMITS = {
  PRODUCT_NAME_MAX: 100,
  PRODUCT_DESCRIPTION_MAX: 300,
  INGREDIENTS_MAX: 2000,
  ADDITIVES_MAX: 2000,
  OPTION_NAME_MAX: 80,
  OPTION_DESCRIPTION_MAX: 150,
  CATEGORY_DESCRIPTION_MAX: 150,
} as const;

// Configurações padrão
export const DEFAULT_SETTINGS = {
  vatRate: 13,
  vatType: 'INCLUSIVE',
  companyName: 'SushiWorld',
  phone: '+351 934 841 148',
  email: 'pedidosushiworld@gmail.com',
  address: 'Santa Iria',
} as const;

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  SETTINGS: 'settings',
  DELIVERY_AREAS: 'delivery-areas',
  PROMOTIONS: 'promotions',
} as const;

// Revalidate times (em segundos)
export const REVALIDATE_TIMES = {
  PRODUCTS: 60, // 1 minuto
  SETTINGS: 300, // 5 minutos
  ORDERS: 10, // 10 segundos
  STATIC: 3600, // 1 hora
} as const;


/**
 * ✅ RATE LIMITING SEM DEPENDÊNCIAS EXTERNAS
 *
 * Implementação simples usando Map em memória
 * Para produção com múltiplos servidores, considere usar Redis/Upstash
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Armazenamento em memória (será resetado quando o servidor reiniciar)
const limitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 1 minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limitStore.entries()) {
    if (entry.resetAt < now) {
      limitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  maxRequests: number;  // Número máximo de requisições
  windowMs: number;     // Janela de tempo em milissegundos
}

/**
 * Configurações pré-definidas de rate limit
 */
export const RATE_LIMITS = {
  // Autenticação - 5 tentativas a cada 10 segundos
  AUTH: {
    maxRequests: 5,
    windowMs: 10 * 1000,
  },

  // API geral - 30 requisições por minuto
  API: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },

  // Pedidos - 3 pedidos por minuto
  ORDERS: {
    maxRequests: 3,
    windowMs: 60 * 1000,
  },

  // Upload de arquivos - 10 por minuto
  UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },

  // Validação de email/endereço - 20 por minuto
  VALIDATION: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
} as const;

/**
 * Extrai IP do request (suporta proxies/load balancers)
 */
function getClientIp(request: NextRequest): string {
  // Tentar headers de proxy primeiro
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for pode ter múltiplos IPs, pegar o primeiro
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback para IP do request (pode não estar disponível em serverless)
  return request.ip || 'unknown';
}

/**
 * Verifica e aplica rate limit
 *
 * @param request - NextRequest
 * @param config - Configuração de rate limit
 * @param identifier - Identificador customizado (opcional, usa IP por padrão)
 * @returns NextResponse com erro 429 se exceder limite, null caso contrário
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<NextResponse | null> {
  const ip = identifier || getClientIp(request);
  const key = `${request.nextUrl.pathname}:${ip}`;
  const now = Date.now();

  // Buscar entrada existente
  let entry = limitStore.get(key);

  // Se não existe ou expirou, criar nova
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    limitStore.set(key, entry);

    return null; // Permitir requisição
  }

  // Incrementar contador
  entry.count++;

  // Verificar se excedeu o limite
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    console.warn(`[Rate Limit] ${ip} excedeu limite em ${request.nextUrl.pathname}`);

    return NextResponse.json(
      {
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetAt.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  // Requisição permitida
  return null;
}

/**
 * Middleware de rate limit (para usar em rotas API)
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    return await checkRateLimit(request, config);
  };
}

/**
 * Verifica rate limit por email (para validações)
 */
export async function checkRateLimitByEmail(
  email: string,
  config: RateLimitConfig
): Promise<boolean> {
  const key = `email:${email.toLowerCase()}`;
  const now = Date.now();

  let entry = limitStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    limitStore.set(key, entry);
    return true; // Permitir
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    console.warn(`[Rate Limit] Email ${email} excedeu limite`);
    return false; // Bloquear
  }

  return true; // Permitir
}

/**
 * Limpa rate limit de um IP específico (útil para testes)
 */
export function clearRateLimit(ip: string, pathname?: string) {
  if (pathname) {
    limitStore.delete(`${pathname}:${ip}`);
  } else {
    // Limpar todos os limites deste IP
    for (const key of limitStore.keys()) {
      if (key.endsWith(`:${ip}`)) {
        limitStore.delete(key);
      }
    }
  }
}

/**
 * Obtém estatísticas de rate limit
 */
export function getRateLimitStats() {
  const now = Date.now();
  let activeEntries = 0;
  let totalRequests = 0;

  for (const [key, entry] of limitStore.entries()) {
    if (entry.resetAt >= now) {
      activeEntries++;
      totalRequests += entry.count;
    }
  }

  return {
    activeEntries,
    totalRequests,
    averageRequestsPerEntry: activeEntries > 0 ? totalRequests / activeEntries : 0,
    totalEntries: limitStore.size,
  };
}

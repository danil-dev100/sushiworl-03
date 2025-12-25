# ✅ COMO APLICAR RATE LIMITING NAS ROTAS DE API

## Exemplo 1: Proteger API de Pedidos

### Arquivo: src/app/api/orders/route.ts

Adicionar NO INÍCIO da função POST (antes de qualquer processamento):

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // ✅ VERIFICAR RATE LIMIT ANTES DE PROCESSAR
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ORDERS);
  if (rateLimitResponse) {
    return rateLimitResponse; // Retorna 429 se exceder limite
  }

  try {
    // ... resto do código
  }
}
```

## Exemplo 2: Proteger API de Autenticação

### Arquivo: src/app/api/auth/[...nextauth]/route.ts

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // ✅ Rate limit para login
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.AUTH);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // ... resto do código do NextAuth
}
```

## Exemplo 3: Proteger API de Validação de Endereço

### Arquivo: src/app/api/delivery/check-area/route.ts

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // ✅ Rate limit para validações
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.VALIDATION);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // ... resto do código
}
```

## Exemplo 4: Rate Limit Customizado por Email

```typescript
import { checkRateLimitByEmail, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  // ✅ Verificar rate limit por email (além do IP)
  const allowed = await checkRateLimitByEmail(email, RATE_LIMITS.ORDERS);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas com este email. Aguarde alguns minutos.' },
      { status: 429 }
    );
  }

  // ... resto do código
}
```

## Configurações Disponíveis

```typescript
RATE_LIMITS.AUTH        // 5 req / 10 segundos
RATE_LIMITS.API         // 30 req / minuto
RATE_LIMITS.ORDERS      // 3 req / minuto
RATE_LIMITS.UPLOAD      // 10 req / minuto
RATE_LIMITS.VALIDATION  // 20 req / minuto
```

## Criar Configuração Customizada

```typescript
const customLimit = {
  maxRequests: 10,
  windowMs: 30 * 1000, // 30 segundos
};

const rateLimitResponse = await checkRateLimit(request, customLimit);
```

## IMPORTANTE

⚠️ Esta implementação usa memória local (Map)
   - Funciona para servidores únicos
   - Será resetado ao reiniciar o servidor
   - Para produção com múltiplos servidores, use Redis/Upstash

## Upgrade para Redis (Produção)

Para ambientes com múltiplos servidores, instalar:
```bash
npm install @upstash/ratelimit @upstash/redis
```

E seguir a documentação em:
https://github.com/upstash/ratelimit

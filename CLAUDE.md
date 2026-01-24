# SushiWorld - Instruções do Projeto

## Sobre o Projeto
Sistema de e-commerce para restaurante de sushi com:
- Cardápio digital com categorias e produtos
- Carrinho de compras e checkout
- Pedidos agendados
- Sistema de cupons e promoções
- Email marketing automatizado
- Painel administrativo completo

## Stack Tecnológico
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Estilização**: Tailwind CSS + shadcn/ui
- **Autenticação**: NextAuth.js
- **Pagamentos**: Stripe
- **Email**: Resend
- **Deploy**: Vercel

## Estrutura do Projeto
```
src/
├── app/                    # App Router (páginas e API routes)
│   ├── (store)/           # Páginas da loja (cardápio, checkout)
│   ├── admin/             # Painel administrativo
│   └── api/               # API Routes
├── components/            # Componentes React
├── lib/                   # Utilitários e serviços
├── hooks/                 # Custom hooks
└── types/                 # Tipos TypeScript
prisma/
├── schema.prisma          # Schema do banco
└── seed*.ts               # Seeds de dados
```

## Padrões de Código

### Convenções
- Usar português para nomes de variáveis relacionadas ao negócio
- Comentários em português
- Mensagens de erro em português para o usuário
- Logs internos podem ser em inglês

### Imports
```typescript
// 1. React/Next
import { useState } from 'react'
import { NextRequest } from 'next/server'

// 2. Bibliotecas externas
import { prisma } from '@/lib/db'

// 3. Componentes internos
import { Button } from '@/components/ui/button'

// 4. Tipos
import type { Order } from '@prisma/client'
```

### API Routes
```typescript
// Sempre usar try/catch
// Sempre retornar JSON consistente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    // lógica
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Mensagem amigável' },
      { status: 500 }
    )
  }
}
```

### Prisma
- Sempre usar transações para operações múltiplas
- Incluir apenas campos necessários com `select`
- Usar `include` com moderação

## Regras Importantes

### Não Fazer
- NÃO criar arquivos de documentação sem pedir
- NÃO adicionar dependências sem necessidade
- NÃO modificar schema.prisma sem confirmar
- NÃO fazer commits automáticos

### Sempre Fazer
- Testar código antes de commitar
- Verificar se o build passa
- Manter consistência com código existente
- Usar os componentes UI existentes (shadcn/ui)

## Skills Disponíveis

Para tarefas específicas, consulte as skills em `.cursor/skills/skills/`:

### Desenvolvimento
- `nextjs-best-practices` - Padrões Next.js App Router
- `prisma-expert` - Queries e migrations Prisma
- `typescript-expert` - TypeScript avançado
- `clean-code` - Código limpo e legível

### Integrações
- `stripe-integration` - Pagamentos Stripe
- `nextjs-supabase-auth` - Autenticação Supabase
- `email-systems` - Sistemas de email
- `email-sequence` - Fluxos de email marketing

### APIs
- `api-patterns` - Padrões de API REST
- `api-security-best-practices` - Segurança de APIs
- `database-design` - Design de banco de dados

### Segurança

- `api-security-best-practices` - Segurança de APIs
- `cc-skill-security-review` - Revisão de segurança de código
- `top-web-vulnerabilities` - OWASP Top 10
- `sql-injection-testing` - Testes de SQL injection
- `xss-html-injection` - Testes de XSS

### SEO

- `seo-fundamentals` - Fundamentos de SEO
- `seo-audit` - Auditoria de SEO
- `programmatic-seo` - SEO programático

### Marketing & CRO

- `analytics-tracking` - GA4, GTM, tracking
- `marketing-ideas` - Ideias de marketing
- `marketing-psychology` - Psicologia de marketing
- `copywriting` - Escrita persuasiva
- `form-cro` - Otimização de formulários
- `page-cro` - Otimização de páginas
- `popup-cro` - Otimização de popups
- `signup-flow-cro` - Otimização de fluxo de cadastro

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Prisma
npx prisma generate
npx prisma db push
npx prisma studio

# Seeds
npx tsx prisma/seed.ts
npx tsx prisma/seed-email-flows.ts
```

## Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (Email)
RESEND_API_KEY=

# Vercel Cron
CRON_SECRET=
```

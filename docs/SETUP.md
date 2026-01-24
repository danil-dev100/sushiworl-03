# 🍱 SushiWorld - Guia de Instalação

Este guia irá ajudá-lo a configurar o projeto SushiWorld do zero.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- Conta no Supabase (para storage de imagens)
- npm ou pnpm instalado

## 🚀 Passo a Passo

### 1. Clonar o Repositório

```bash
git clone <seu-repositorio>
cd sushiworld_3
```

### 2. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sushiworld?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-uma-chave-secreta-aqui"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# Resend (Email)
RESEND_API_KEY="re_sua_api_key"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Configurar Banco de Dados

#### Opção A: Script Automático (Linux/Mac)

```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

#### Opção B: Comandos Manuais

```bash
# Gerar Prisma Client
npx prisma generate

# Criar e aplicar migrations
npx prisma migrate dev --name init

# Popular banco com dados iniciais
npm run db:seed
```

### 5. Configurar Supabase Storage

1. Acesse seu projeto no Supabase
2. Vá em **Storage** no menu lateral
3. Crie os seguintes buckets (públicos):
   - `products`
   - `banners`
   - `promotions`

**Configuração de cada bucket:**
- Public bucket: ✅ Sim
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### 6. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O site estará disponível em: `http://localhost:3000`

## 🔐 Credenciais Padrão

Após o seed, use estas credenciais para fazer login no painel admin:

- **Email:** `admin@sushiworld.pt`
- **Senha:** `123sushi`

⚠️ **IMPORTANTE:** Altere a senha no primeiro login!

## 📁 Estrutura do Projeto

```
sushiworld_3/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Dados iniciais
├── src/
│   ├── app/
│   │   ├── (admin)/       # Rotas do painel admin
│   │   ├── (cliente)/     # Rotas do site público
│   │   ├── api/           # API Routes
│   │   └── login/         # Página de login
│   ├── components/
│   │   ├── admin/         # Componentes do admin
│   │   ├── cliente/       # Componentes do cliente
│   │   └── ui/            # Componentes UI (Shadcn)
│   ├── lib/
│   │   ├── auth.ts        # Configuração NextAuth
│   │   ├── db.ts          # Prisma Client
│   │   └── supabase.ts    # Helpers Supabase
│   └── types/             # TypeScript types
└── public/
    └── produtos/          # Imagens dos produtos
```

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm run start

# Prisma Studio (visualizar banco)
npm run db:studio

# Reset do banco (cuidado!)
npm run db:reset

# Gerar tipos do Prisma
npx prisma generate
```

## 📊 Acessar Prisma Studio

Para visualizar e editar dados do banco visualmente:

```bash
npm run db:studio
```

Abre em: `http://localhost:5555`

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

- Verifique se o PostgreSQL está rodando
- Confirme a `DATABASE_URL` no `.env`
- Teste a conexão: `npx prisma db pull`

### Erro: "Missing Supabase environment variables"

- Verifique se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão no `.env`
- Reinicie o servidor de desenvolvimento

### Erro: "NextAuth configuration error"

- Verifique se `NEXTAUTH_SECRET` está definido
- Confirme que `NEXTAUTH_URL` está correto

### Erro ao fazer upload de imagens

- Verifique se os buckets foram criados no Supabase
- Confirme que os buckets estão configurados como públicos
- Verifique as permissões de MIME types

## 🔄 Próximos Passos

Após a instalação, você pode:

1. ✅ Fazer login no painel admin (`/login`)
2. ✅ Configurar informações da empresa
3. ✅ Adicionar áreas de entrega
4. ✅ Importar produtos do cardápio
5. ✅ Configurar integrações (Google Analytics, Facebook Pixel, etc.)
6. ✅ Personalizar banners e popups

## 📞 Suporte

Se encontrar problemas, verifique:
- Logs do console do navegador
- Logs do terminal onde o servidor está rodando
- Arquivo `.env` está configurado corretamente

## 🎯 Fase 1 - Concluída! ✅

- ✅ Schema do Prisma com todos os modelos
- ✅ Supabase Storage configurado
- ✅ Sistema de autenticação NextAuth
- ✅ Seed com dados iniciais
- ✅ Middleware de proteção de rotas
- ✅ Sistema de roles (Admin/Manager)

**Próxima Fase:** Desenvolvimento da área do cliente (carrinho, checkout, etc.)


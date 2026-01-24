# 🚀 Guia de Deploy para GitHub e Vercel

## 📋 Checklist Antes do Deploy

### 1. Arquivos de Segurança ✅

- ✅ `.env.example` criado (sem dados sensíveis)
- ✅ `.gitignore` configurado
- ✅ `.env.local` NÃO será commitado
- ✅ Senhas e tokens protegidos

### 2. Estrutura de Imagens ✅

- ✅ Imagens em `/public/produtos.webp/` (78 produtos)
- ✅ Logo em `/public/logo.webp/`
- ✅ Imagens commitadas no repositório
- ✅ Função `getProductImageUrl()` usa SKU para buscar imagem

### 3. Configurações do Site ✅

- ✅ Alterações no admin refletem automaticamente no site
- ✅ `revalidatePath()` implementado nas APIs
- ✅ Horários de atendimento dinâmicos
- ✅ Preços e produtos atualizados em tempo real

---

## 🔐 Variáveis de Ambiente

### Criar `.env.local` (NÃO commitar)

```env
# Copiar de .env.example e preencher com dados reais
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="[GERAR_COM_openssl_rand_-base64_32]"
NEXTAUTH_URL="http://localhost:3000"
```

### Configurar no Vercel

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione todas as variáveis do `.env.local`
3. Selecione: Production, Preview, Development

---

## 📦 Comandos Git

### 1. Inicializar Repositório (se ainda não fez)

```bash
git init
git add .
git commit -m "🎉 Initial commit: SushiWorld Admin Panel"
```

### 2. Conectar ao GitHub

```bash
# Criar repositório no GitHub primeiro
# Depois conectar:
git remote add origin https://github.com/SEU_USUARIO/sushiworld.git
git branch -M main
git push -u origin main
```

### 3. Commits Futuros

```bash
# Adicionar alterações
git add .

# Commit com mensagem descritiva
git commit -m "✨ feat: Adiciona gestão de pedidos"

# Push para GitHub
git push origin main
```

---

## 🌐 Deploy na Vercel

### Opção 1: Via GitHub (Recomendado)

1. Acesse: https://vercel.com/new
2. Conecte sua conta do GitHub
3. Selecione o repositório `sushiworld`
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

### Opção 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

---

## 🗄️ Configurar Banco de Dados

### 1. Criar Banco no Supabase

1. Acesse: https://supabase.com
2. Crie um novo projeto
3. Copie as URLs de conexão:
   - **Pooler (6543)**: Para runtime
   - **Direct (5432)**: Para migrações

### 2. Configurar Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Sincronizar schema
npx prisma db push

# Abrir Prisma Studio
npx prisma studio
```

### 3. Criar Usuário Admin

```bash
# Opção 1: Via Prisma Studio
# Abrir http://localhost:5555
# Criar usuário manualmente

# Opção 2: Via script
npx tsx scripts/create-admin.ts
```

---

## 👤 Criar Primeiro Usuário Admin

### Script: `scripts/create-admin.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123'; // TROCAR DEPOIS DO PRIMEIRO LOGIN
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@sushiworld.pt',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      firstLogin: true, // Forçar troca de senha
    },
  });

  console.log('✅ Admin criado:', admin.email);
  console.log('🔑 Senha temporária:', password);
  console.log('⚠️  TROQUE A SENHA NO PRIMEIRO LOGIN!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Executar:**
```bash
npx tsx scripts/create-admin.ts
```

---

## 🔄 Atualizar Produção

### Após fazer alterações:

```bash
# 1. Commitar alterações
git add .
git commit -m "✨ feat: Nova funcionalidade"
git push origin main

# 2. Vercel faz deploy automático
# 3. Verificar em: https://seu-projeto.vercel.app
```

### Forçar rebuild:

```bash
# Via CLI
vercel --prod --force

# Ou via dashboard Vercel
# Settings > Deployments > Redeploy
```

---

## 🧪 Testar Antes do Deploy

### 1. Build Local

```bash
# Testar build de produção
npm run build

# Rodar build
npm start
```

### 2. Verificar Erros

```bash
# Linter
npm run lint

# TypeScript
npx tsc --noEmit
```

### 3. Testar Funcionalidades

- ✅ Login admin
- ✅ Dashboard com métricas
- ✅ Gestão de pedidos
- ✅ Configurações da empresa
- ✅ Alterações refletem no site

---

## 📝 Estrutura de Commits (Conventional Commits)

```bash
# Novas funcionalidades
git commit -m "✨ feat: Adiciona gestão de produtos"

# Correções
git commit -m "🐛 fix: Corrige erro no cálculo de IVA"

# Documentação
git commit -m "📝 docs: Atualiza README"

# Estilo/formatação
git commit -m "💄 style: Ajusta cores do tema"

# Refatoração
git commit -m "♻️ refactor: Melhora estrutura de pastas"

# Performance
git commit -m "⚡️ perf: Otimiza queries do Prisma"

# Testes
git commit -m "✅ test: Adiciona testes unitários"

# Build
git commit -m "👷 build: Atualiza dependências"
```

---

## 🔒 Segurança

### O que NÃO commitar:

- ❌ `.env.local`
- ❌ `.env`
- ❌ Senhas
- ❌ Tokens de API
- ❌ Chaves privadas
- ❌ `/node_modules/`
- ❌ `/.next/`

### O que PODE commitar:

- ✅ `.env.example` (sem dados reais)
- ✅ Código fonte
- ✅ Imagens dos produtos (`/public/produtos.webp/`)
- ✅ Logo (`/public/logo.webp/`)
- ✅ Documentação
- ✅ Schema do Prisma

---

## 🎯 Checklist Final

### Antes do primeiro deploy:

- [ ] `.env.local` criado e configurado
- [ ] `.gitignore` configurado
- [ ] Variáveis de ambiente no Vercel
- [ ] Banco de dados criado no Supabase
- [ ] `npx prisma db push` executado
- [ ] Usuário admin criado
- [ ] Build local testado (`npm run build`)
- [ ] Commit inicial feito
- [ ] Repositório no GitHub criado
- [ ] Deploy na Vercel configurado

### Após deploy:

- [ ] Site acessível em produção
- [ ] Login admin funcionando
- [ ] Dashboard carregando
- [ ] Imagens dos produtos aparecendo
- [ ] Configurações salvando corretamente
- [ ] Alterações refletindo no site

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
npx prisma generate
```

### Erro: "Database connection failed"
```bash
# Verificar URLs no .env.local
# Verificar IP whitelisted no Supabase
```

### Erro: "Unauthorized"
```bash
# Verificar NEXTAUTH_SECRET
# Verificar NEXTAUTH_URL
```

### Imagens não aparecem
```bash
# Verificar se estão em /public/produtos.webp/
# Verificar função getProductImageUrl()
# Verificar permissões de arquivo
```

---

## 📞 Suporte

- 📧 Email: pedidosushiworld@gmail.com
- 📱 Telefone: +351 934 841 148
- 🌐 Site: https://sushiworld.pt

---

**Última atualização**: 11/11/2025
**Versão**: 1.0.0


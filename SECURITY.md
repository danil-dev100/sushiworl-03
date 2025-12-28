# 🔒 Segurança do Sistema

## Proteção de Rotas Administrativas

### ✅ PROBLEMA CORRIGIDO
Anteriormente, era possível que em alguns casos as rotas `/admin/*` fossem acessíveis sem login adequado. Isso foi **COMPLETAMENTE CORRIGIDO**.

---

## 🛡️ Camadas de Segurança Implementadas

### 1️⃣ **Middleware (Primeira Linha de Defesa)** - NOVO!

**Arquivo:** `src/middleware.ts`

**Proteção:**
- Intercepta TODAS as requisições antes de chegarem às páginas
- Bloqueia acesso a `/admin/*` sem autenticação
- Bloqueia acesso a `/api/admin/*` sem autenticação
- Verifica JWT token automaticamente
- Verifica role (só ADMIN ou MANAGER podem acessar)

**Como funciona:**
```typescript
// Se tentar acessar /admin/qualquer-coisa sem login
→ Redireciona automaticamente para /login

// Se tentar acessar com role CUSTOMER
→ Redireciona para página inicial (/)

// Se estiver logado como ADMIN ou MANAGER
→ Permite acesso ✅
```

### 2️⃣ **Layout Admin (Segunda Camada)**

**Arquivo:** `src/app/admin/layout.tsx`

**Proteção:**
- Executa no servidor (Server Component)
- Verifica sessão usando `getServerSession()`
- Verifica role novamente (redundância de segurança)
- Protege todos os componentes filhos

### 3️⃣ **Páginas Individuais (Terceira Camada)**

**Exemplo:** `src/app/admin/marketing/apps/page.tsx`

**Proteção:**
- Cada página verifica autenticação individualmente
- Útil para permissões específicas (ex: só ADMIN pode gerenciar usuários)

---

## 🔐 Fluxo de Autenticação

### Quando você acessa `/admin/marketing/apps` SEM login:

```
1. Middleware intercepta a requisição
   ↓
2. Verifica: "Tem token JWT?"
   → NÃO
   ↓
3. Redireciona para: /login?callbackUrl=/admin/marketing/apps
   ↓
4. Após login bem-sucedido
   ↓
5. Redireciona de volta para: /admin/marketing/apps
```

### Quando você acessa `/admin/dashboard` LOGADO como CUSTOMER:

```
1. Middleware intercepta a requisição
   ↓
2. Verifica: "Tem token JWT?"
   → SIM
   ↓
3. Verifica: "Role é ADMIN ou MANAGER?"
   → NÃO (é CUSTOMER)
   ↓
4. Redireciona para: / (página inicial)
   ↓
5. ❌ ACESSO NEGADO
```

### Quando você acessa `/admin/pedidos` LOGADO como ADMIN:

```
1. Middleware intercepta a requisição
   ↓
2. Verifica: "Tem token JWT?"
   → SIM ✅
   ↓
3. Verifica: "Role é ADMIN ou MANAGER?"
   → SIM ✅
   ↓
4. Permite acesso
   ↓
5. Layout Admin verifica novamente (redundância)
   ↓
6. Página verifica novamente (redundância)
   ↓
7. ✅ ACESSO PERMITIDO
```

---

## 🧪 Como Testar a Segurança

### Teste 1: Acessar Admin sem Login
```bash
1. Abra uma aba anônima (Ctrl+Shift+N no Chrome)
2. Acesse: http://seusite.com/admin/dashboard
3. Resultado esperado: Redireciona para /login
```

### Teste 2: Acessar Admin com Role Errado
```bash
1. Faça login como CUSTOMER (cliente comum)
2. Tente acessar: http://seusite.com/admin/pedidos
3. Resultado esperado: Redireciona para / (home)
```

### Teste 3: Acessar Admin como MANAGER
```bash
1. Faça login como MANAGER
2. Acesse: http://seusite.com/admin/marketing/apps
3. Resultado esperado: Acesso permitido ✅
```

### Teste 4: Acessar API Admin sem Token
```bash
curl http://seusite.com/api/admin/users
# Resultado esperado: 401 Unauthorized
```

---

## 🚨 Rotas Protegidas

### Todas as rotas começando com:
- `/admin/*` - PROTEGIDAS
- `/api/admin/*` - PROTEGIDAS

### Rotas públicas (não protegidas):
- `/` - Home
- `/cardapio` - Cardápio
- `/login` - Login
- `/api/auth/*` - Autenticação NextAuth
- Qualquer outra rota que não comece com `/admin`

---

## 🔑 Variáveis de Ambiente Necessárias

### Produção (Vercel)
Certifique-se de ter configurado:

```bash
NEXTAUTH_URL=https://seudominio.com
NEXTAUTH_SECRET=sua-chave-secreta-muito-forte
DATABASE_URL=sua-connection-string-postgres
```

### Como gerar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 📋 Checklist de Segurança

- [x] Middleware protegendo `/admin/*`
- [x] Middleware protegendo `/api/admin/*`
- [x] Layout Admin com verificação de sessão
- [x] Páginas individuais com verificação redundante
- [x] JWT com expiração (30 dias)
- [x] Verificação de role (ADMIN/MANAGER)
- [x] Redirect para login com callbackUrl
- [x] Senhas hasheadas com bcrypt
- [x] IP hasheado (SHA-256) no tracking PWA
- [x] HASH_SALT único para IP hashing
- [x] Variáveis de ambiente protegidas (.gitignore)
- [x] RLS (Row Level Security) no Supabase

---

## 🆘 Suporte

### Se você ainda consegue acessar `/admin` sem login:

1. **Limpe o cache do navegador**
   - Chrome: Ctrl+Shift+Delete → Cookies e cache

2. **Teste em aba anônima**
   - Ctrl+Shift+N (Chrome) ou Ctrl+Shift+P (Firefox)

3. **Verifique se está na versão correta**
   - Acesse: https://vercel.com/seu-projeto/deployments
   - Confirme que o último commit foi deployado

4. **Verifique variáveis de ambiente na Vercel**
   - Settings → Environment Variables
   - Confirme que NEXTAUTH_SECRET está configurado

---

## 📝 Notas Técnicas

### Por que 3 camadas de segurança?

**Defesa em Profundidade (Defense in Depth)**
- Se uma camada falhar, as outras ainda protegem
- Redundância garante segurança mesmo com bugs
- Cada camada tem propósito específico

### Middleware vs Layout vs Page

| Camada | Executa | Quando | Propósito |
|--------|---------|--------|-----------|
| Middleware | Edge | Antes de tudo | Bloqueio rápido |
| Layout | Servidor | Ao renderizar | Proteção estrutural |
| Page | Servidor | Ao renderizar | Permissões específicas |

---

**Última atualização:** 28 de dezembro de 2024
**Status:** ✅ Todas as rotas admin protegidas

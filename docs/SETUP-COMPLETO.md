# 🍣 SushiWorld - Sistema de Setup Automatizado

## ✅ **O QUE FOI CRIADO**

### **📂 Arquivos Criados**

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `scripts/setup.ts` | Script automatizado Node.js/TypeScript | ✅ Criado |
| `scripts/setup.ps1` | Script automatizado PowerShell (Windows) | ✅ Criado |
| `scripts/importar-cardapio.ts` | Importador dinâmico de produtos | ✅ Criado |
| `prisma.config.ts` | Configuração moderna do Prisma | ✅ Criado |
| `package.json` | Adicionados comandos `setup` | ✅ Atualizado |
| `prisma/schema.prisma` | Adicionado `directUrl` | ✅ Atualizado |
| `README-SETUP.md` | Guia completo de setup | ✅ Criado |
| `QUICKSTART.md` | Guia rápido (5 minutos) | ✅ Criado |

### **🎯 Comandos Adicionados ao package.json**

```json
{
  "scripts": {
    "setup": "tsx scripts/setup.ts",                    // Setup completo
    "setup:quick": "tsx scripts/setup.ts --skip-seed --no-studio", // Setup rápido
    "setup:no-dev": "tsx scripts/setup.ts --no-dev",    // Sem iniciar servidor
    "db:push": "prisma db push",                        // Sincronizar DB
    "db:seed:cardapio": "tsx scripts/importar-cardapio.ts", // Importar produtos
    "db:validate": "prisma validate"                    // Validar schema
  }
}
```

---

## 🚀 **COMO USAR (3 PASSOS)**

### **PASSO 1: Criar .env.local** ⚠️ **OBRIGATÓRIO**

**Você ainda NÃO tem o arquivo `.env.local`!** Precisa criar agora:

```powershell
# No PowerShell, na raiz do projeto:
New-Item -Path ".env.local" -ItemType File -Force
notepad .env.local
```

**Cole este conteúdo (substitua os valores entre colchetes):**

```env
# ============================================
# BANCO DE DADOS - SUPABASE
# ============================================

# Para runtime (queries) - Porta 6543 (Pooler)
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Para migrações (DDL) - Porta 5432 (Direto)
DIRECT_URL="postgresql://postgres:[SUA_SENHA]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_SECRET="[GERE_STRING_ALEATORIA]"
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# SUPABASE (Opcional)
# ============================================
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave_anon"
```

**Como gerar NEXTAUTH_SECRET:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

### **PASSO 2: Executar Setup Automatizado**

```powershell
npm run setup
```

**Isso vai fazer TUDO automaticamente:**

```
┌─────────────────────────────────────────┐
│ 1. ✅ Validar schema                    │
│ 2. ✅ Gerar Prisma Client               │
│ 3. ✅ Sincronizar DB com Supabase       │
│ 4. ✅ Popular produtos do cardápio      │
│ 5. ✅ Abrir Prisma Studio (verificação) │
│ 6. ✅ Iniciar servidor (porta 3000)     │
└─────────────────────────────────────────┘
```

**Tempo estimado:** ~1 minuto

---

### **PASSO 3: Verificar se Funcionou**

#### **A) Verificar Banco de Dados**

O script já abre automaticamente, mas você pode rodar manualmente:

```powershell
npm run db:studio
```

Abrir `http://localhost:5555` e verificar:
- ✅ Tabela `Product` com ~80 produtos
- ✅ Tabela `User` com admin
- ✅ Tabela `Settings` com configurações

#### **B) Verificar Servidor**

Abrir `http://localhost:3000` e testar:
- ✅ Home carrega
- ✅ `/cardapio` mostra produtos
- ✅ `/api/products` retorna JSON

#### **C) Verificar Login Admin**

Acessar `http://localhost:3000/login`:
- **Email:** `admin@sushiworld.pt`
- **Senha:** `123sushi`

---

## 📋 **Comandos Úteis**

### **Setup e Inicialização**

```powershell
# Setup completo (primeira vez)
npm run setup

# Setup rápido (já tem dados)
npm run setup:quick

# Apenas configurar DB (sem rodar servidor)
npm run setup:no-dev
```

### **Banco de Dados**

```powershell
# Sincronizar schema
npm run db:push

# Popular com seed completo
npm run db:seed

# Importar apenas produtos do cardápio
npm run db:seed:cardapio

# Visualizar dados
npm run db:studio

# Validar schema
npm run db:validate

# Resetar tudo
npm run db:reset
```

### **Desenvolvimento**

```powershell
# Rodar servidor
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm run start
```

---

## 🎯 **Scripts Criados (Detalhado)**

### **1. scripts/setup.ts (Principal)**

**Funcionalidades:**
- ✅ Verificações preliminares (arquivos essenciais)
- ✅ Validação do schema
- ✅ Geração do Prisma Client
- ✅ Sincronização do banco (db push)
- ✅ População de dados (seed)
- ✅ Abertura do Prisma Studio
- ✅ Inicialização do servidor
- ✅ Logs coloridos sem dependências externas
- ✅ Tratamento de erros com dicas de solução

**Parâmetros:**
```bash
--skip-seed    # Pula população de dados
--no-dev       # Não inicia servidor
--no-studio    # Não abre Prisma Studio
```

**Exemplo:**
```powershell
npx tsx scripts/setup.ts --skip-seed --no-studio
```

---

### **2. scripts/setup.ps1 (PowerShell)**

**Funcionalidades:**
- ✅ Mesmas funcionalidades do setup.ts
- ✅ Otimizado para Windows/PowerShell
- ✅ Cores nativas do PowerShell
- ✅ Sintaxe PowerShell

**Parâmetros:**
```powershell
-SkipSeed    # Pula população de dados
-NoDev       # Não inicia servidor
-NoStudio    # Não abre Prisma Studio
```

**Exemplo:**
```powershell
.\scripts\setup.ps1 -SkipSeed -NoStudio
```

---

### **3. scripts/importar-cardapio.ts**

**Funcionalidades:**
- ✅ Lê `docs/descrição-cardapio.txt`
- ✅ Parse automático de produtos
- ✅ Detecta alérgenos automaticamente
- ✅ Usa `upsert` (não duplica produtos)
- ✅ Relatório detalhado da importação

**Formato do arquivo esperado:**
```
Categoria|ID|Nome|Descrição|Preço
Entradas|16|Ebi Fry|Camarão tempura|7.80
```

**Uso:**
```powershell
npm run db:seed:cardapio
```

**Output esperado:**
```
🍱 IMPORTADOR DE CARDÁPIO - SUSHIWORLD

📖 Lendo arquivo: C:\...\docs\descrição-cardapio.txt
✅ 78 produtos parseados

💾 Importando produtos para o banco...
✨ Criado: Gunkan Mix 10 Peças (SKU: 1)
✨ Criado: Hot Mix 22 Peças (SKU: 2)
...

📊 RESUMO DA IMPORTAÇÃO
═══════════════════════════════════════
✨ Produtos criados:     78
🔄 Produtos atualizados: 0
❌ Erros:                0
📦 Total processado:     78
═══════════════════════════════════════

🎉 Importação concluída com sucesso!
```

---

## 🐛 **Troubleshooting**

### **Erro: "Can't reach database server"**

**Causa:** IP não autorizado no Supabase.

**Solução:**
1. Acesse: https://supabase.com/dashboard
2. Vá em **Settings → Database**
3. Em **Connection Pooling**, clique **"Add new address"**
4. Digite `0.0.0.0/0` (dev) ou seu IP público

---

### **Erro: "password authentication failed"**

**Causa:** Senha incorreta no `.env.local`.

**Solução:**
1. Verifique senha no Supabase Dashboard
2. Settings → Database → Database Password
3. Se necessário, resete a senha
4. Atualize `.env.local`

---

### **Erro: "P1001 - Timed out"**

**Causa:** Usando pooler (6543) para migração.

**Solução:**
Verifique `.env.local`:
```env
# DIRECT_URL deve ter:
DIRECT_URL="postgresql://....:5432/postgres"  # ✅ Porta 5432
# NÃO deve ter: ?pgbouncer=true                # ❌ Remova isso
```

---

### **Erro: "tsx not found"**

**Causa:** Dependência não instalada.

**Solução:**
```powershell
npm install tsx --save-dev
```

---

### **Erro: "defineConfig is not a function"**

**Causa:** Versão antiga do Prisma.

**Solução:**
```powershell
npm install @prisma/client@latest prisma@latest
```

---

## 📊 **Fluxo Visual do Setup**

```
┌──────────────────────────────────────────────────────────┐
│                    INÍCIO DO SETUP                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PASSO 0: Verificações Preliminares                      │
│  ├─ Verificar prisma/schema.prisma existe                │
│  ├─ Verificar package.json existe                        │
│  ├─ Verificar .env.local existe                          │
│  ├─ Verificar DATABASE_URL definida                      │
│  └─ Verificar DIRECT_URL definida                        │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PASSO 1: Validar Schema                                 │
│  └─ npx prisma validate                                  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PASSO 2: Gerar Prisma Client                            │
│  └─ npx prisma generate                                  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PASSO 3: Sincronizar Database                           │
│  └─ npx prisma db push (usa DIRECT_URL - porta 5432)    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PASSO 4: Popular Database                               │
│  ├─ Procura scripts/importar-cardapio.ts                 │
│  ├─ Ou usa prisma/seed-complete.ts                       │
│  └─ Ou usa prisma/seed.ts                                │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PASSO 5: Abrir Prisma Studio                            │
│  └─ npx prisma studio (http://localhost:5555)           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PASSO 6: Iniciar Servidor                               │
│  └─ npm run dev -- --port 3000                           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              🎉 PROJETO RODANDO! 🎉                      │
│         http://localhost:3000                            │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 **Próximos Passos**

Após o setup, você pode:

1. **Explorar o site:**
   - `http://localhost:3000` - Home
   - `http://localhost:3000/cardapio` - Ver produtos
   - `http://localhost:3000/carrinho` - Testar carrinho

2. **Acessar área admin:**
   - `http://localhost:3000/login`
   - Email: `admin@sushiworld.pt`
   - Senha: `123sushi`

3. **Desenvolver:**
   - Editar arquivos em `src/`
   - Hot reload automático

4. **Gerenciar dados:**
   - `npm run db:studio` - Visualizar/editar dados
   - `npm run db:seed:cardapio` - Atualizar produtos

---

## 📞 **Suporte**

Se tiver problemas:

1. ✅ Verifique que `.env.local` está configurado
2. ✅ Confirme que IP está na whitelist do Supabase
3. ✅ Rode `npx prisma validate` para testar schema
4. ✅ Veja os logs de erro no terminal

---

## ✨ **Resumo**

**Você agora tem:**
- ✅ Script de setup automatizado completo
- ✅ Scripts individuais para cada etapa
- ✅ Comandos npm organizados
- ✅ Documentação completa
- ✅ Tratamento de erros robusto
- ✅ Logs coloridos e informativos

**Para começar:**
```powershell
npm run setup
```

**Tempo total:** ~1 minuto ⏱️

---

**Desenvolvido com ❤️ para iniciantes em programação**

*Última atualização: 2025-11-10*



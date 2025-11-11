# ⚡ SushiWorld - Quickstart (5 minutos)

## 🎯 **Setup em 1 Comando**

```powershell
npm run setup
```

**Isso vai:**
- ✅ Validar schema
- ✅ Gerar Prisma Client  
- ✅ Criar tabelas no Supabase
- ✅ Adicionar produtos
- ✅ Abrir Prisma Studio
- ✅ Iniciar servidor em `localhost:3000`

---

## ✅ **Checklist Pré-Setup**

Antes de rodar o setup, verifique:

```
[✓] Node.js instalado (v18+)
    Teste: node --version

[✓] npm instalado
    Teste: npm --version

[✓] Arquivo .env.local criado
    Localização: C:\Projetos\sushi_03\sushiworld_3\.env.local

[✓] DATABASE_URL configurada (porta 6543)
    Exemplo: postgresql://postgres:[SENHA]@...pooler.supabase.com:6543/postgres?pgbouncer=true

[✓] DIRECT_URL configurada (porta 5432)
    Exemplo: postgresql://postgres:[SENHA]@...pooler.supabase.com:5432/postgres

[✓] IP na whitelist do Supabase
    Dashboard → Settings → Database → Connection Pooling → Add IP
```

---

## 🚀 **Opções de Setup**

### **Opção 1: Setup Completo (Primeira Vez)**

```powershell
npm run setup
```

### **Opção 2: Setup Rápido (Já tem dados)**

```powershell
npm run setup:quick
```

### **Opção 3: Apenas Configurar (Sem rodar servidor)**

```powershell
npm run setup:no-dev
```

---

## 🔍 **Verificação Pós-Setup**

### **1. Verificar Banco de Dados**

```powershell
npm run db:studio
```

Abrir `http://localhost:5555` e verificar:
- [ ] Tabela `Product` existe e tem produtos
- [ ] Tabela `User` existe e tem admin
- [ ] Tabela `Order` existe (pode estar vazia)
- [ ] Tabela `Settings` existe e tem configurações

### **2. Verificar Servidor**

```powershell
npm run dev
```

Abrir `http://localhost:3000` e verificar:
- [ ] Home carrega corretamente
- [ ] `/cardapio` mostra produtos
- [ ] `/api/products` retorna JSON
- [ ] Imagens dos produtos aparecem

### **3. Verificar Login Admin**

Acessar `http://localhost:3000/login`:
- [ ] Email: `admin@sushiworld.pt`
- [ ] Senha: `123sushi`
- [ ] Dashboard abre após login

---

## ⏱️ **Tempo Estimado**

| Etapa | Tempo |
|-------|-------|
| Validar schema | 5s |
| Gerar Prisma Client | 10s |
| Sincronizar DB | 15s |
| Popular dados | 20s |
| Iniciar servidor | 10s |
| **TOTAL** | **~1 min** |

---

## 📊 **Output Esperado**

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🍣  SUSHIWORLD - SETUP AUTOMATIZADO  🍣            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════
📍 PASSO 0: Verificações Preliminares
═══════════════════════════════════════════════════════════
✅ Schema do Prisma encontrado
✅ Package.json encontrado
✅ Variáveis de ambiente encontrado
✅ DATABASE_URL definida
✅ DIRECT_URL definida

✨ Todas as verificações passaram!

═══════════════════════════════════════════════════════════
📍 PASSO 1: Validar Schema do Prisma
═══════════════════════════════════════════════════════════
ℹ️  Verificando se o schema está correto...
$ npx prisma validate
The schema at prisma/schema.prisma is valid 🚀
✅ Schema validado com sucesso!

═══════════════════════════════════════════════════════════
📍 PASSO 2: Gerar Prisma Client
═══════════════════════════════════════════════════════════
ℹ️  Gerando tipos TypeScript do Prisma...
$ npx prisma generate
✔ Generated Prisma Client to ./node_modules/@prisma/client
✅ Prisma Client gerado com sucesso!

═══════════════════════════════════════════════════════════
📍 PASSO 3: Sincronizar Database com Supabase
═══════════════════════════════════════════════════════════
ℹ️  Aplicando schema no banco de dados (usando DIRECT_URL)...
⚠️  Isso pode levar alguns segundos na primeira vez...

🚀  Your database is now in sync with your Prisma schema.
✅ Database sincronizado com sucesso!

═══════════════════════════════════════════════════════════
📍 PASSO 4: Popular Database com Dados Iniciais
═══════════════════════════════════════════════════════════
ℹ️  Usando: Seed Completo (prisma/seed.ts)
ℹ️  Inserindo dados no banco...
$ npx tsx prisma/seed.ts
🌱 Iniciando seed do banco de dados...
✅ Admin criado: admin@sushiworld.pt
✅ Configurações criadas
✅ Área de entrega criada
✅ 80 produtos criados
✅ Dados populados com sucesso!

═══════════════════════════════════════════════════════════
📍 PASSO 5: Abrir Prisma Studio para Verificação
═══════════════════════════════════════════════════════════
ℹ️  Abrindo Prisma Studio em http://localhost:5555
⚠️  Feche o Prisma Studio (Ctrl+C) quando terminar de verificar.

═══════════════════════════════════════════════════════════
📍 PASSO 6: Iniciar Servidor de Desenvolvimento
═══════════════════════════════════════════════════════════
✅ ✨ Setup concluído com sucesso!

🚀 Iniciando Next.js em http://localhost:3000

📌 ROTAS DISPONÍVEIS:
   - http://localhost:3000              (Home)
   - http://localhost:3000/cardapio     (Cardápio)
   - http://localhost:3000/carrinho     (Carrinho)
   - http://localhost:3000/api/products (API JSON)

👤 LOGIN ADMIN:
   - Email: admin@sushiworld.pt
   - Senha: 123sushi

⚠️  Pressione Ctrl+C para parar o servidor.

═══════════════════════════════════════════════════════════

  ▲ Next.js 15.3.4
  - Local:        http://localhost:3000
  - Ready in 2.5s

✅ ⏱️  Setup concluído em 62.45s
```

---

## 🐛 **Problemas Comuns**

### **Erro: "Can't reach database"**

```powershell
# Solução: Adicionar IP no Supabase
# 1. Dashboard → Settings → Database
# 2. Connection Pooling → Add new address
# 3. Digite: 0.0.0.0/0
```

### **Erro: "P1001"**

```powershell
# Solução: Verificar .env.local
# 1. Confirme DIRECT_URL tem porta 5432
# 2. Confirme não tem ?pgbouncer=true na DIRECT_URL
```

### **Erro: "tsx não encontrado"**

```powershell
npm install tsx --save-dev
```

---

## 🎉 **Pronto para Desenvolver!**

Após o setup, você pode:

```powershell
# Rodar servidor
npm run dev

# Ver banco de dados
npm run db:studio

# Adicionar produtos
npm run db:seed:cardapio

# Resetar banco
npm run db:reset
```

---

**💡 Dica:** Salve este arquivo como referência rápida!



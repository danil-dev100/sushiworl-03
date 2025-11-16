# 🚀 Guia de Deploy - SushiWorld

## 📋 Pré-requisitos

- Conta no GitHub
- Conta na Vercel
- Banco de dados PostgreSQL (Supabase, Neon, ou Railway)

---

## 🔐 Variáveis de Ambiente Necessárias

### **Obrigatórias:**

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="gere-uma-chave-secreta-aleatoria"
NEXTAUTH_URL="https://seu-dominio.vercel.app"
```

### **Opcionais:**

```env
# Email (para recuperação de senha)
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_FROM=""

# Google Maps (para área de entrega)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Analytics
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_FB_PIXEL_ID=""
```

---

## 📦 Passo 1: Preparar o Repositório Git

### **1.1. Verificar arquivos ignorados**

O `.gitignore` já está configurado para ignorar:
- ✅ Variáveis de ambiente (`.env`)
- ✅ Node modules
- ✅ Build files
- ✅ Imagens de teste
- ✅ Documentação de desenvolvimento
- ✅ Scripts de debug

### **1.2. Adicionar arquivos ao Git**

```bash
git add .
git commit -m "feat: sistema de carrinho e opções de produtos"
git push origin main
```

---

## 🗄️ Passo 2: Configurar Banco de Dados

### **Opção A: Supabase (Recomendado - Grátis)**

1. Acesse: https://supabase.com
2. Crie um novo projeto
3. Vá em "Settings" → "Database"
4. Copie a "Connection String" (formato URI)
5. Substitua `[YOUR-PASSWORD]` pela senha do projeto

**Formato:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### **Opção B: Neon (Grátis)**

1. Acesse: https://neon.tech
2. Crie um novo projeto
3. Copie a "Connection String"

### **Opção C: Railway (Grátis com limites)**

1. Acesse: https://railway.app
2. Crie um novo projeto PostgreSQL
3. Copie a "DATABASE_URL"

---

## 🚀 Passo 3: Deploy na Vercel

### **3.1. Conectar Repositório**

1. Acesse: https://vercel.com
2. Clique em "New Project"
3. Importe seu repositório do GitHub
4. Selecione o projeto

### **3.2. Configurar Variáveis de Ambiente**

Na página de configuração do projeto:

1. Vá em "Environment Variables"
2. Adicione as variáveis:

```
DATABASE_URL = postgresql://...
NEXTAUTH_SECRET = (gere uma chave aleatória)
NEXTAUTH_URL = https://seu-projeto.vercel.app
```

**Para gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### **3.3. Deploy**

1. Clique em "Deploy"
2. Aguarde o build (3-5 minutos)
3. Acesse o link gerado

---

## 🗃️ Passo 4: Executar Migrations

### **Opção A: Via Vercel CLI (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Link do projeto
vercel link

# Executar migration
vercel env pull .env.production
npx prisma migrate deploy
```

### **Opção B: Via Prisma Studio**

```bash
# Conectar ao banco de produção
DATABASE_URL="sua-url-de-producao" npx prisma studio

# Ou executar migration diretamente
DATABASE_URL="sua-url-de-producao" npx prisma migrate deploy
```

---

## 👤 Passo 5: Criar Usuário Admin

### **5.1. Acessar o site**

```
https://seu-projeto.vercel.app/admin/setup
```

### **5.2. Criar primeiro admin**

- Usuário: `admin`
- Senha: `(escolha uma senha forte)`
- Email: `seu-email@exemplo.com`

---

## ✅ Checklist de Deploy

- [ ] Repositório no GitHub
- [ ] `.gitignore` configurado
- [ ] Banco de dados criado
- [ ] `DATABASE_URL` configurada
- [ ] `NEXTAUTH_SECRET` gerada
- [ ] `NEXTAUTH_URL` configurada
- [ ] Deploy na Vercel concluído
- [ ] Migrations executadas
- [ ] Usuário admin criado
- [ ] Site acessível

---

## 🔒 Segurança

### **O que NÃO vai para o Git:**

✅ Arquivos de ambiente (`.env`)
✅ Senhas e chaves secretas
✅ Imagens de teste dos produtos
✅ Documentação de desenvolvimento
✅ Scripts de debug
✅ Node modules
✅ Build files

### **O que VAI para o Git:**

✅ Código fonte
✅ Schema do Prisma
✅ Configurações do Next.js
✅ Componentes React
✅ Rotas da API
✅ Estilos CSS
✅ Arquivos públicos (logo, etc)

---

## 📁 Estrutura de Pastas (Produção)

```
sushiworld_3/
├── src/
│   ├── app/              # Rotas e páginas
│   ├── components/       # Componentes React
│   ├── contexts/         # Context API
│   ├── lib/              # Utilitários
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # Schema do banco
├── public/
│   ├── logo.webp/        # Logo do site
│   └── produtos/         # Imagens (não versionadas)
├── .gitignore            # Arquivos ignorados
├── package.json          # Dependências
├── next.config.ts        # Config do Next.js
└── tsconfig.json         # Config do TypeScript
```

---

## 🐛 Troubleshooting

### **Erro: "DATABASE_URL not found"**

**Solução:**
1. Vá nas configurações da Vercel
2. Adicione a variável `DATABASE_URL`
3. Faça um novo deploy

### **Erro: "Prisma Client not generated"**

**Solução:**
```bash
vercel env pull .env.production
npx prisma generate
git add .
git commit -m "fix: regenerate prisma client"
git push
```

### **Erro: "NextAuth configuration error"**

**Solução:**
1. Verifique se `NEXTAUTH_SECRET` está definida
2. Verifique se `NEXTAUTH_URL` está correta
3. Faça um novo deploy

### **Site lento ou não carrega**

**Solução:**
1. Verifique se o banco de dados está online
2. Verifique os logs na Vercel
3. Verifique se as migrations foram executadas

---

## 📊 Monitoramento

### **Logs da Vercel:**

1. Acesse o dashboard da Vercel
2. Selecione seu projeto
3. Vá em "Deployments"
4. Clique no deployment
5. Veja os logs em "Functions"

### **Banco de Dados:**

Use Prisma Studio para visualizar dados:
```bash
DATABASE_URL="sua-url" npx prisma studio
```

---

## 🔄 Atualizações Futuras

Para fazer deploy de novas alterações:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

A Vercel fará deploy automaticamente! 🚀

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs da Vercel
2. Verifique se o banco está online
3. Verifique as variáveis de ambiente
4. Consulte a documentação:
   - Vercel: https://vercel.com/docs
   - Prisma: https://www.prisma.io/docs
   - Next.js: https://nextjs.org/docs

---

**Deploy concluído! 🎉**


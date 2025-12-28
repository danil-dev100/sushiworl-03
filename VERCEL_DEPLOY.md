# 🚀 Guia de Deploy na Vercel

## 📋 Checklist Pré-Deploy

Antes de fazer o deploy, verifique:

- [x] ✅ Ícones do PWA gerados (`npm run generate-icons` ou `node scripts/generate-icons.js`)
- [x] ✅ .env.example criado (não contém dados sensíveis)
- [x] ✅ .gitignore protegendo .env.local
- [ ] ⏳ Migração do banco aplicada no Supabase (veja SUPABASE_SETUP.md)
- [ ] ⏳ Variáveis de ambiente configuradas na Vercel

---

## 🔧 Configurar Variáveis de Ambiente na Vercel

### 1. Acessar Painel da Vercel
1. Vá para https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**

### 2. Adicionar Variáveis (OBRIGATÓRIAS)

#### **DATABASE_URL**
```
postgresql://postgres:SUA_SENHA@SEU_HOST.supabase.co:6543/postgres?pgbouncer=true
```
- Copie do Supabase → Settings → Database → Connection String
- Use a URL com **pooler (porta 6543)** para produção
- **Environments**: Production, Preview, Development

#### **NEXTAUTH_SECRET**
```bash
# Gere uma chave aleatória no terminal:
openssl rand -base64 32
```
- Cole o resultado
- **Environments**: Production, Preview, Development

#### **NEXTAUTH_URL**
```
https://seu-dominio.vercel.app
```
- Use a URL final do seu projeto Vercel
- Se já tiver domínio customizado, use ele
- **Environments**: Production

#### **HASH_SALT** (para PWA tracking)
```
fc34ad09d93f921a989289ff5d97c6403623a6cdb90562b06d89a956ae7d8aca
```
- Use o HASH_SALT do .env.example ou gere um novo
- **Environments**: Production, Preview, Development

#### **NEXT_PUBLIC_APP_URL**
```
https://seu-dominio.vercel.app
```
- Mesma URL do NEXTAUTH_URL
- Usado para gerar links de instalação do PWA
- **Environments**: Production

### 3. Variáveis Opcionais (Email, Analytics)

Se for usar envio de emails:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_FROM=Sushi World <noreply@sushiworld.com>
```

---

## 🚀 Fazer Deploy

### Opção 1: Via Git (Automático)
```bash
git add .
git commit -m "deploy: preparar para produção"
git push origin main
```

A Vercel detecta automaticamente e faz o deploy.

### Opção 2: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 📱 Após o Deploy

### 1. Testar PWA
1. Abra a URL da Vercel no Chrome (mobile)
2. Toque em Menu (⋮) → "Adicionar à tela inicial"
3. Verifique se o ícone e nome aparecem corretos

### 2. Testar Tracking
1. Acesse `/admin/marketing/apps` (após login)
2. Gere um link de instalação Android
3. Acesse o link gerado
4. Verifique se o evento foi registrado na aba "Analytics"

### 3. Gerar QR Codes
1. Acesse `/admin/marketing/apps`
2. Digite um nome de campanha (ex: "qr_loja")
3. Clique "Gerar Link para Android"
4. Baixe o QR code gerado
5. Distribua para clientes

---

## 🔄 Configurar Domínio Customizado (Opcional)

### 1. Adicionar Domínio na Vercel
1. Settings → Domains
2. Adicionar domínio (ex: sushiworld.com)

### 2. Configurar DNS no Provedor
Adicione estes registros DNS:

**Tipo A (ou CNAME):**
```
@  →  76.76.21.21
www  →  cname.vercel-dns.com
```

### 3. Aguardar Propagação
- Pode levar até 48h
- Verifique em: https://dnschecker.org

### 4. Atualizar Variáveis de Ambiente
Na Vercel, atualize:
```
NEXTAUTH_URL=https://seudominio.com
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

---

## 🔒 Segurança - Checklist

Antes de ir para produção:

- [ ] ✅ .env.local **NÃO** está no git
- [ ] ✅ Variáveis de ambiente configuradas na Vercel
- [ ] ✅ DATABASE_URL usa pooler (porta 6543)
- [ ] ✅ HASH_SALT único e aleatório
- [ ] ✅ NEXTAUTH_SECRET forte e aleatório
- [ ] ✅ Migração do Supabase aplicada
- [ ] ✅ RLS (Row Level Security) habilitado no Supabase
- [ ] ✅ Dados de teste removidos do banco

---

## 🧪 Testar em Produção

### 1. PWA Instalável
```bash
# Chrome DevTools → Lighthouse
# Verificar se PWA passa em todos os testes
```

### 2. Service Worker
```bash
# DevTools → Application → Service Workers
# Verificar se está registrado e ativo
```

### 3. Manifest
```bash
# DevTools → Application → Manifest
# Verificar ícones e configurações
```

### 4. Tracking de Instalação
```bash
# Gerar link com UTM
# Acessar e instalar
# Verificar em /admin/marketing/apps → Analytics
```

---

## ⚠️ Troubleshooting

### Erro: "DATABASE_URL not found"
- Verificar se variável foi adicionada na Vercel
- Verificar se está em todos os environments (Production, Preview, Development)
- Re-deploy após adicionar variável

### PWA não instala
- Verificar se manifest.json está acessível: `https://seusite.com/manifest.json`
- Verificar se ícones existem: `https://seusite.com/icon-192.png`
- Verificar se Service Worker está registrado
- Usar HTTPS (Vercel já fornece SSL automático)

### Tracking não funciona
- Verificar se tabela `AppInstallLog` foi criada no Supabase
- Verificar se HASH_SALT está configurado
- Verificar console do navegador por erros
- Verificar se link tem parâmetros UTM

### Erro 500 na API
- Verificar logs da Vercel: Dashboard → Deployments → View Function Logs
- Verificar se DATABASE_URL está correta
- Verificar se migração foi aplicada no Supabase

---

## 📊 Monitoramento

### Logs da Vercel
```
Dashboard → Deployments → [Deployment] → View Function Logs
```

### Analytics do Supabase
```
Supabase → Database → Table Editor → AppInstallLog
```

### Métricas de PWA
```
/admin/marketing/apps → Tab "Analytics"
```

---

## 🔄 Atualizações Futuras

Quando fizer mudanças:

1. Commitar código:
```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

2. Vercel faz deploy automático

3. Se houver mudanças no banco:
```bash
# Criar migração
npx prisma migrate dev --name nome_da_mudanca

# Aplicar no Supabase via SQL Editor
# (copiar SQL da migration gerada)
```

4. Se houver novas variáveis de ambiente:
- Adicionar na Vercel → Settings → Environment Variables
- Re-deploy (ou aguardar próximo commit)

---

## ✅ Deploy Concluído!

Seu PWA está pronto! 🎉

**Próximos passos:**
1. ✅ Testar instalação em Android e iOS
2. ✅ Gerar QR codes para clientes
3. ✅ Monitorar analytics de instalação
4. 🔜 Gerar APK assinado via PWABuilder (quando tiver domínio final)

---

**Criado com ❤️ por Claude Code**

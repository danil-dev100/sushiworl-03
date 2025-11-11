# 🚀 Próximos Passos - SushiWorld

## ✅ O que Já Foi Feito

- ✅ Código enviado para o GitHub
- ✅ Sistema de autenticação implementado
- ✅ Dashboard admin funcionando
- ✅ Gestão de pedidos completa
- ✅ Configurações da empresa
- ✅ Documentação completa
- ✅ Segurança configurada (.gitignore, .env.example)

---

## 📋 Checklist de Deploy

### 1. Configurar Banco de Dados no Supabase

```bash
# 1. Criar projeto no Supabase
# Acesse: https://supabase.com

# 2. Copiar URLs de conexão
# Pooler (6543): DATABASE_URL
# Direct (5432): DIRECT_URL

# 3. Adicionar IPs permitidos
# Configurações > Database > Connection Pooling
# Adicionar: 0.0.0.0/0 (ou IPs específicos)
```

### 2. Configurar Variáveis de Ambiente

```bash
# Criar .env.local na raiz do projeto
cp .env.example .env.local

# Editar .env.local com dados reais:
# - DATABASE_URL (do Supabase)
# - DIRECT_URL (do Supabase)
# - NEXTAUTH_SECRET (gerar com: openssl rand -base64 32)
# - NEXTAUTH_URL (http://localhost:3000)
```

### 3. Sincronizar Banco de Dados

```bash
# Gerar Prisma Client
npx prisma generate

# Sincronizar schema
npx prisma db push

# Verificar no Prisma Studio
npx prisma studio
```

### 4. Criar Usuário Admin

```bash
# Executar script
npx tsx scripts/create-admin.ts

# Credenciais padrão:
# Email: admin@sushiworld.pt
# Senha: admin123 (TROCAR NO PRIMEIRO LOGIN!)
```

### 5. Testar Localmente

```bash
# Rodar projeto
npm run dev

# Acessar:
# Site: http://localhost:3000
# Admin: http://localhost:3000/login
```

### 6. Deploy na Vercel

```bash
# Opção 1: Via Dashboard
# 1. Acesse: https://vercel.com/new
# 2. Conecte o repositório GitHub
# 3. Configure variáveis de ambiente
# 4. Deploy!

# Opção 2: Via CLI
npm i -g vercel
vercel login
vercel --prod
```

---

## 🛠️ Funcionalidades a Implementar

### 🔥 Prioridade Alta (Esta Semana)

#### 1. Gestão de Cardápio (CRUD Completo)
**Arquivos a criar:**
- `src/app/(admin)/cardapio/page.tsx`
- `src/app/(admin)/cardapio/novo/page.tsx`
- `src/app/(admin)/cardapio/[id]/page.tsx`
- `src/components/admin/products/ProductForm.tsx`
- `src/components/admin/products/ProductList.tsx`
- `src/app/api/admin/products/route.ts`
- `src/app/api/admin/products/[id]/route.ts`

**Funcionalidades:**
- [ ] Listar produtos
- [ ] Adicionar produto
- [ ] Editar produto
- [ ] Deletar produto
- [ ] Upload de imagem (salvar em `/public/produtos.webp/`)
- [ ] Ativar/desativar produto
- [ ] Duplicar produto
- [ ] Filtros por categoria
- [ ] Busca por nome/SKU

#### 2. Gestão de Usuários
**Arquivos a criar:**
- `src/app/(admin)/usuarios/page.tsx`
- `src/components/admin/users/UserForm.tsx`
- `src/components/admin/users/UserList.tsx`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`

**Funcionalidades:**
- [ ] Listar usuários (admin/gerente)
- [ ] Adicionar gerente
- [ ] Definir nível de permissão (BASIC/INTERMEDIATE/FULL)
- [ ] Desativar usuário
- [ ] Resetar senha
- [ ] Forçar troca de senha no primeiro login

### ⚡ Prioridade Média (Este Mês)

#### 3. Sistema de Promoções
**Arquivos a criar:**
- `src/app/(admin)/promocoes/page.tsx`
- `src/app/(admin)/promocoes/nova/page.tsx`
- `src/components/admin/promotions/PromotionForm.tsx`
- `src/app/api/admin/promotions/route.ts`

**Funcionalidades:**
- [ ] Cupons de desconto
- [ ] Up-sell (upgrade de produto)
- [ ] Down-sell (alternativa mais barata)
- [ ] Order bump (adicional no checkout)
- [ ] Primeira compra
- [ ] Regras de aplicação

#### 4. Áreas de Entrega
**Arquivos a criar:**
- `src/app/(admin)/areas-entrega/page.tsx`
- `src/components/admin/delivery/DeliveryMap.tsx`
- `src/app/api/admin/delivery-areas/route.ts`

**Dependências:**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**Funcionalidades:**
- [ ] Mapa interativo (Leaflet.js)
- [ ] Desenhar polígonos
- [ ] Frete grátis/pago por área
- [ ] Valor mínimo para frete grátis
- [ ] Validação de endereço no checkout

### 🎯 Prioridade Baixa (Próximo Mês)

#### 5. Email Marketing
**Arquivos a criar:**
- `src/app/(admin)/email-marketing/page.tsx`
- `src/components/admin/email/EmailEditor.tsx`
- `src/components/admin/email/AutomationFlow.tsx`
- `src/app/api/admin/email/route.ts`

**Dependências:**
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

#### 6. Relatórios
**Arquivos a criar:**
- `src/app/(admin)/relatorios/page.tsx`
- `src/components/admin/reports/SalesChart.tsx`
- `src/components/admin/reports/MetricsCards.tsx`

**Dependências:**
```bash
npm install chart.js react-chartjs-2
```

#### 7. Integrações
**Arquivos a criar:**
- `src/app/(admin)/integracoes/page.tsx`
- `src/components/admin/integrations/FacebookPixel.tsx`
- `src/components/admin/integrations/GoogleAds.tsx`
- `src/app/api/admin/integrations/route.ts`

---

## 📝 Tarefas Imediatas (Hoje)

### 1. Testar Sistema Localmente

```bash
# 1. Verificar se .env.local está configurado
cat .env.local

# 2. Instalar dependências (se necessário)
npm install

# 3. Gerar Prisma Client
npx prisma generate

# 4. Sincronizar banco
npx prisma db push

# 5. Criar admin
npx tsx scripts/create-admin.ts

# 6. Rodar projeto
npm run dev

# 7. Testar:
# - Login: http://localhost:3000/login
# - Dashboard: http://localhost:3000/admin/dashboard
# - Pedidos: http://localhost:3000/admin/pedidos
# - Configurações: http://localhost:3000/admin/configuracoes/empresa
```

### 2. Verificar Imagens dos Produtos

```bash
# Verificar se as 78 imagens estão em /public/produtos.webp/
ls public/produtos.webp/

# Deve mostrar: 1.webp, 2.webp, ..., 78.webp
```

### 3. Testar Configurações

1. Login no admin
2. Ir em "Configurações da Empresa"
3. Alterar horário de atendimento
4. Salvar
5. Verificar se refletiu no site (home page)

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Erro: "Database connection failed"
```bash
# Verificar URLs no .env.local
# Verificar IP whitelisted no Supabase
```

### Erro: "Unauthorized" no login
```bash
# Verificar se criou o usuário admin
npx tsx scripts/create-admin.ts

# Verificar NEXTAUTH_SECRET no .env.local
```

### Imagens não aparecem
```bash
# Verificar se estão em /public/produtos.webp/
ls public/produtos.webp/

# Verificar permissões
chmod 755 public/produtos.webp/
```

---

## 📊 Métricas de Progresso

### Implementado (70%)
- ✅ Autenticação
- ✅ Dashboard
- ✅ Gestão de Pedidos
- ✅ Configurações da Empresa
- ✅ Documentação
- ✅ Segurança

### Em Progresso (20%)
- 🔄 Gestão de Cardápio (estrutura pronta, falta CRUD)
- 🔄 Sidebar e Header do Admin (placeholders criados)

### Pendente (10%)
- ⏳ Gestão de Usuários
- ⏳ Promoções
- ⏳ Áreas de Entrega
- ⏳ Email Marketing
- ⏳ Relatórios
- ⏳ Integrações

---

## 🎓 Recursos de Aprendizado

### Next.js 15
- https://nextjs.org/docs
- https://nextjs.org/learn

### Prisma
- https://www.prisma.io/docs
- https://www.prisma.io/docs/getting-started

### NextAuth.js
- https://next-auth.js.org/getting-started/introduction
- https://next-auth.js.org/configuration/options

### Tailwind CSS
- https://tailwindcss.com/docs
- https://tailwindcss.com/docs/utility-first

---

## 📞 Suporte

- **Email**: pedidosushiworld@gmail.com
- **Telefone**: +351 934 841 148

---

**Última atualização**: 11/11/2025
**Próxima revisão**: Após implementar Gestão de Cardápio


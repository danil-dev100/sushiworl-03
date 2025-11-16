# 🍣 SushiWorld - Sistema de Delivery

Sistema completo de delivery para restaurante de sushi com painel administrativo e carrinho de compras.

## 🚀 Funcionalidades

### **Para Clientes:**
- 🛒 Carrinho de compras com localStorage
- 🎯 Opções personalizáveis nos produtos (braseado, molhos, etc)
- 🔍 Busca de produtos
- 📱 Design responsivo (mobile, tablet, desktop)
- 🌙 Modo escuro
- 📦 Visualização de produtos por categoria

### **Para Administradores:**
- 📊 Dashboard com estatísticas
- 🍱 Gestão completa de produtos
- 🎨 Opções e complementos personalizáveis
- 📋 Gestão de pedidos em tempo real
- 👥 Gestão de usuários e permissões
- 💰 Controle financeiro
- 🗺️ Área de entrega personalizada

---

## 🛠️ Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL + Prisma ORM
- **Autenticação:** NextAuth.js
- **UI:** Tailwind CSS + Shadcn/ui
- **Formulários:** React Hook Form + Zod
- **Notificações:** Sonner (Toast)
- **Deploy:** Vercel

---

## 📦 Instalação Local

### **Pré-requisitos:**
- Node.js 18+
- PostgreSQL
- npm ou yarn

### **Passos:**

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/sushiworld.git
cd sushiworld

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Executar migrations
npx prisma migrate dev

# 5. (Opcional) Seed do banco
npx prisma db seed

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

---

## 🌐 Deploy

Veja o guia completo em [DEPLOY.md](./DEPLOY.md)

**Resumo:**
1. Configure o banco de dados (Supabase/Neon/Railway)
2. Faça push para o GitHub
3. Conecte na Vercel
4. Configure variáveis de ambiente
5. Deploy automático! 🚀

---

## 📝 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://..."

# Autenticação
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"
```

Veja `.env.example` para todas as variáveis.

---

## 🗂️ Estrutura do Projeto

```
src/
├── app/                    # Rotas Next.js
│   ├── (admin)/           # Painel administrativo
│   ├── (cliente)/         # Site público
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── admin/            # Componentes do admin
│   ├── cliente/          # Componentes do site
│   └── ui/               # Componentes UI (Shadcn)
├── contexts/             # Context API (Carrinho, etc)
├── lib/                  # Utilitários e configurações
└── types/                # TypeScript types

prisma/
└── schema.prisma         # Schema do banco de dados

public/
├── logo.webp/           # Logo e assets
└── produtos/            # Imagens dos produtos
```

---

## 🔐 Segurança

- ✅ Autenticação com NextAuth
- ✅ Proteção de rotas admin
- ✅ Validação de dados com Zod
- ✅ Sanitização de HTML
- ✅ CSRF protection
- ✅ Variáveis de ambiente seguras

---

## 📱 Responsividade

- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Large Desktop (1440px+)

---

## 🎨 Tema

**Cores:**
- Primária: `#FF6B00` (Laranja)
- Background Light: `#f5f1e9` (Bege claro)
- Background Dark: `#23170f` (Marrom escuro)
- Texto: `#333333` (Cinza escuro)

---

## 📄 Licença

Este projeto é proprietário e confidencial.

---

## 👨‍💻 Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Start produção
npm start

# Prisma Studio
npx prisma studio

# Verificar tipos
npm run type-check

# Lint
npm run lint
```

---

## 🆘 Suporte

Para suporte, entre em contato:
- Email: pedidosushiworld@gmail.com
- Telefone: +351 934 841 148

---

**Desenvolvido com ❤️ para SushiWorld**

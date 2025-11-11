# 🍣 SushiWorld - Sistema de Delivery

Sistema completo de delivery de sushi com painel administrativo, desenvolvido com Next.js 15, Prisma, Supabase e NextAuth.

## 🚀 Funcionalidades

### 🛒 Site do Cliente
- ✅ Cardápio completo com categorias
- ✅ Carrinho de compras
- ✅ Checkout com endereço de entrega
- ✅ Validação de área de entrega
- ✅ Múltiplas formas de pagamento
- ✅ Tracking de pedidos em tempo real
- ✅ Sistema de promoções e cupons
- ✅ Responsivo (mobile, tablet, desktop)

### 👨‍💼 Painel Administrativo
- ✅ Dashboard com métricas em tempo real
- ✅ Gestão de pedidos (aceitar/recusar/imprimir)
- ✅ Gestão de produtos e cardápio
- ✅ Configurações da empresa (horários, IVA, impressora)
- ✅ Gestão de usuários e permissões
- ✅ Áreas de entrega com mapa interativo
- ✅ Sistema de promoções (cupons, up-sell, down-sell)
- ✅ Relatórios e analytics
- ✅ Email marketing e automações
- ✅ Integrações (Facebook Pixel, Google Ads, Webhooks)

## 🛠️ Tecnologias

- **Framework**: Next.js 15 (App Router)
- **Banco de Dados**: PostgreSQL (Supabase)
- **ORM**: Prisma 6.19.0
- **Autenticação**: NextAuth.js
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **Gráficos**: Chart.js
- **Mapas**: Leaflet.js
- **Deploy**: Vercel

## 📦 Instalação

### 1. Clonar Repositório

```bash
git clone https://github.com/SEU_USUARIO/sushiworld.git
cd sushiworld
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com suas credenciais
```

### 4. Configurar Banco de Dados

```bash
# Gerar Prisma Client
npx prisma generate

# Sincronizar schema
npx prisma db push

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

### 5. Criar Usuário Admin

```bash
npx tsx scripts/create-admin.ts
```

### 6. Rodar Projeto

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🔐 Login Admin

Após criar o usuário admin:

- **URL**: http://localhost:3000/login
- **Email**: admin@sushiworld.pt
- **Senha**: admin123 (trocar no primeiro login)

## 📁 Estrutura do Projeto

```
sushiworld/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Painel administrativo
│   │   ├── (cliente)/         # Site do cliente
│   │   └── api/               # APIs REST
│   ├── components/
│   │   ├── admin/             # Componentes do admin
│   │   └── cliente/           # Componentes do site
│   ├── lib/
│   │   ├── auth.ts            # Configuração NextAuth
│   │   ├── db.ts              # Prisma Client
│   │   ├── constants.ts       # Constantes globais
│   │   └── utils.ts           # Funções auxiliares
│   └── prisma/
│       └── schema.prisma      # Schema do banco
├── public/
│   ├── produtos.webp/         # Imagens dos produtos (78 fotos)
│   └── logo.webp/             # Logo do restaurante
├── scripts/
│   ├── create-admin.ts        # Criar usuário admin
│   └── setup.ts               # Setup automático
└── docs/                      # Documentação
```

## 🎨 Design System

### Cores
- **Primary**: `#FF6B00` (Laranja)
- **Background**: `#f5f1e9`
- **Text**: `#333333`
- **Secondary**: `#a16b45`

### Fontes
- **Display**: Plus Jakarta Sans

## 📝 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="[GERAR_COM_openssl_rand_-base64_32]"
NEXTAUTH_URL="http://localhost:3000"

# Supabase (Opcional)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Push para GitHub
2. Conectar repositório na Vercel
3. Configurar variáveis de ambiente
4. Deploy automático

Veja [DEPLOY-GITHUB.md](./DEPLOY-GITHUB.md) para instruções detalhadas.

## 📚 Documentação

- [Guia de Setup Completo](./SETUP-COMPLETO.md)
- [Quick Start](./QUICKSTART.md)
- [Implementação do Admin](./ADMIN-PANEL-IMPLEMENTATION.md)
- [Deploy no GitHub](./DEPLOY-GITHUB.md)

## 🔒 Segurança

- ✅ Autenticação com NextAuth
- ✅ Senhas hash com bcrypt
- ✅ Proteção de rotas por role
- ✅ Validação de dados com Zod
- ✅ CSRF protection
- ✅ Rate limiting (em produção)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m '✨ feat: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Contato

- **Restaurante**: SushiWorld Santa Iria
- **Telefone**: +351 934 841 148
- **Email**: pedidosushiworld@gmail.com
- **Endereço**: Santa Iria

---

**Desenvolvido com ❤️ para SushiWorld**

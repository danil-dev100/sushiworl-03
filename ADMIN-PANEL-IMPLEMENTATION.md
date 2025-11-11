# 🍣 Painel Administrativo SushiWorld - Guia de Implementação

## ✅ O que já foi implementado

### 1. **Estrutura Base** ✅
- Layout admin completo com sidebar e header
- Sistema de autenticação NextAuth com roles (ADMIN, MANAGER, CUSTOMER)
- Proteção de rotas baseada em permissões
- Schema Prisma completo com todos os models necessários

### 2. **Dashboard Principal** ✅
- Métricas em tempo real (pedidos, faturamento, produtos top)
- Gráficos de vendas com Chart.js
- Lista de pedidos recentes
- Top 3 produtos mais vendidos

### 3. **Componentes Criados** ✅
- `AdminSidebar` - Navegação lateral com ícones
- `AdminHeader` - Cabeçalho com notificações e perfil
- `DashboardCharts` - Gráficos de vendas
- `RecentOrders` - Tabela de pedidos recentes
- `TopProducts` - Lista de produtos mais vendidos

---

## 📋 Próximos Passos - O que falta implementar

### 1. **Gestão de Pedidos** (Prioridade Alta)

**Arquivos a criar:**

```typescript
// src/components/admin/orders/OrdersTable.tsx
- Tabela com todos os pedidos
- Botões: Aceitar (verde), Recusar (vermelho), Imprimir (laranja)
- Modal de detalhes do pedido ao clicar
- Atualização de status em tempo real

// src/components/admin/orders/OrdersFilters.tsx
- Filtros por status (Hoje, Pendentes, Aceitos, Todos)
- Contador de pedidos por status

// src/components/admin/orders/OrderDetailModal.tsx
- Modal com detalhes completos do pedido
- Itens, cliente, endereço, forma de pagamento
- Botões de ação (aceitar, recusar, imprimir)

// src/app/api/admin/orders/[id]/route.ts
- PUT: Atualizar status do pedido
- DELETE: Cancelar pedido

// src/app/api/admin/orders/print/route.ts
- POST: Gerar PDF da fatura para impressão
- Usar biblioteca `pdfkit` ou `react-pdf`
```

**Funcionalidades:**
- ✅ Aceitar pedido → Status: CONFIRMED
- ✅ Recusar pedido → Status: CANCELLED + notificar cliente
- ✅ Imprimir pedido → Gerar PDF com:
  - Nome Fantasia (grande)
  - Nome Fiscal (pequeno)
  - NIF, itens, total, forma de pagamento
  - IVA (se configurado)
  - Observações do cliente

---

### 2. **Gestão de Cardápio** (Prioridade Alta)

**Arquivos a criar:**

```typescript
// src/app/(admin)/produtos/page.tsx
- Grid de produtos com imagens
- Busca por nome/SKU
- Filtro por categoria
- Botões: Editar, Duplicar, Ocultar/Mostrar

// src/app/(admin)/produtos/novo/page.tsx
- Formulário completo de criação de produto
- Upload de imagem
- Campos: nome, descrição, preço, categoria, SKU
- Configurações: quente, halal, vegan, etc.
- Ingredientes, alérgenos, valores nutricionais
- Adicionais & Complementos

// src/app/(admin)/produtos/[id]/editar/page.tsx
- Formulário de edição (mesmo do novo)
- Pré-preenchido com dados do produto

// src/components/admin/products/ProductForm.tsx
- Formulário reutilizável para criar/editar
- Validação com Zod
- Upload de imagem para `/api/admin/upload`

// src/components/admin/products/ProductOptionsManager.tsx
- Gerenciar opções e complementos do produto
- Adicionar/remover opções
- Definir se é obrigatório/opcional
- Preço adicional de cada opção

// src/app/api/admin/products/route.ts
- GET: Listar produtos
- POST: Criar produto

// src/app/api/admin/products/[id]/route.ts
- GET: Buscar produto por ID
- PUT: Atualizar produto
- DELETE: Deletar produto
```

---

### 3. **Configurações da Empresa** (Prioridade Média)

**Arquivos a criar:**

```typescript
// src/app/(admin)/configuracoes/empresa/page.tsx
- Formulário com:
  - Nome fantasia, nome fiscal, NIF
  - Endereço, telefone, email
  - Horários de atendimento (segunda a domingo)
  - Configuração de IVA (taxa %, tipo: inclusive/exclusive)
  - Configuração de impressora (USB/Bluetooth, tamanho papel)

// src/app/api/admin/settings/route.ts
- GET: Buscar configurações
- PUT: Atualizar configurações

// src/components/admin/settings/OpeningHoursEditor.tsx
- Editor visual de horários
- Toggle para dias fechados
- Campos de hora de abertura/fechamento
```

**Lógica de IVA:**
```typescript
// Inclusive (já incluído no preço)
const vatAmount = price - (price / (1 + vatRate / 100));
const totalWithVat = price; // Não muda

// Exclusive (somado ao preço)
const vatAmount = price * (vatRate / 100);
const totalWithVat = price + vatAmount;
```

---

### 4. **Gestão de Usuários** (Prioridade Média)

**Arquivos a criar:**

```typescript
// src/app/(admin)/configuracoes/usuarios/page.tsx
- Tabela de usuários (admin, gerentes, clientes)
- Filtro por role
- Botão "Adicionar Usuário"
- Toggle ativo/inativo

// src/components/admin/users/UserModal.tsx
- Modal para criar/editar usuário
- Campos: nome, email, senha, role
- Se MANAGER: selecionar nível (BASIC, INTERMEDIATE, FULL)
- Checkbox "Forçar troca de senha no primeiro login"

// src/app/api/admin/users/route.ts
- GET: Listar usuários
- POST: Criar usuário (hash senha com bcrypt)

// src/app/api/admin/users/[id]/route.ts
- PUT: Atualizar usuário
- DELETE: Desativar usuário (não deletar, apenas isActive = false)
```

**Níveis de Permissão:**
- **BASIC**: Aceitar/cancelar/imprimir pedidos
- **INTERMEDIATE**: + Alterar pedidos
- **FULL**: Acesso total exceto financeiro e dados de clientes

---

### 5. **Promoções** (Prioridade Média)

**Arquivos a criar:**

```typescript
// src/app/(admin)/marketing/promocoes/page.tsx
- Tabela de promoções
- Filtro: Ativas/Inativas
- Botões: Criar Promoção, Up-sell, Down-sell, Order Bump

// src/components/admin/promotions/PromotionForm.tsx
- Formulário para criar promoção
- Tipo: COUPON, FIRST_PURCHASE, ORDER_BUMP, UP_SELL, DOWN_SELL
- Desconto: FIXED ou PERCENTAGE
- Valor mínimo do pedido
- Gatilho (produto, categoria, carrinho)
- Validade (datas, horários)

// src/app/api/admin/promotions/route.ts
- GET: Listar promoções
- POST: Criar promoção

// src/app/api/admin/promotions/[id]/route.ts
- PUT: Atualizar promoção
- DELETE: Deletar promoção
```

**Tipos de Promoção:**
1. **COUPON**: Cupom de desconto (código)
2. **FIRST_PURCHASE**: Desconto na primeira compra
3. **ORDER_BUMP**: Adicional no checkout (checkbox)
4. **UP_SELL**: Upgrade de produto (modal ao adicionar)
5. **DOWN_SELL**: Alternativa mais barata (ao remover item caro)

---

### 6. **Áreas de Entrega** (Prioridade Alta)

**Arquivos a criar:**

```typescript
// src/app/(admin)/areas-entrega/page.tsx
- Mapa interativo com Leaflet.js
- Lista de áreas à esquerda
- Botão "Adicionar Nova Área"
- Desenhar polígonos no mapa

// src/components/admin/delivery/DeliveryMap.tsx
- Componente com Leaflet
- Desenhar/editar polígonos
- Cores diferentes por área
- Click para selecionar área

// src/components/admin/delivery/AreaForm.tsx
- Formulário para configurar área
- Nome da área
- Tipo: FREE ou PAID
- Valor da taxa (se PAID)
- Valor mínimo para frete grátis (se FREE)

// src/app/api/admin/delivery-areas/route.ts
- GET: Listar áreas
- POST: Criar área

// src/app/api/admin/delivery-areas/[id]/route.ts
- PUT: Atualizar área
- DELETE: Deletar área

// src/app/api/areas-entrega/validar/route.ts
- POST: Validar se endereço está em área de entrega
- Usar Nominatim (OpenStreetMap) para geocoding
- Retornar taxa de entrega
```

**Bibliotecas necessárias:**
```bash
npm install leaflet react-leaflet @types/leaflet
```

---

### 7. **Email Marketing** (Prioridade Baixa)

**Arquivos a criar:**

```typescript
// src/app/(admin)/configuracoes/email/page.tsx
- Tabs: Automações, Modelos de Email, Configurações SMTP
- Editor visual de funil de emails (arrastar e soltar)
- Configurar SMTP (servidor, porta, usuário, senha)

// src/components/admin/email/EmailFlowBuilder.tsx
- Builder visual de automações
- Nós: Gatilho, Delay, Enviar Email, Condição
- Conectar nós com linhas

// src/components/admin/email/EmailTemplateEditor.tsx
- Editor rico (Quill.js ou TipTap)
- Variáveis: [Nome Cliente], [Número Pedido], etc.
- Botões personalizados com links

// src/app/api/admin/email/campaigns/route.ts
- GET: Listar campanhas
- POST: Criar campanha

// src/app/api/admin/email/send/route.ts
- POST: Enviar email (usar Nodemailer)
- Delay randômico anti-spam
- Rastreamento de abertura (pixel)
```

---

### 8. **Relatórios** (Prioridade Média)

**Arquivos a criar:**

```typescript
// src/app/(admin)/marketing/relatorios/page.tsx
- Métricas: LTV, CAC, Taxa de Retenção
- Gráficos: Vendas por Categoria, Origem do Tráfego
- Filtros: 7D, 30D, 90D, Personalizado

// src/components/admin/reports/MetricsCards.tsx
- Cards com métricas principais
- Variação percentual (verde/vermelho)

// src/components/admin/reports/ChartsGrid.tsx
- Grid com gráficos (Chart.js)
- Vendas por Categoria (Pizza)
- Origem do Tráfego (Donut)
- Evolução de Pedidos (Linha)

// src/app/api/admin/reports/route.ts
- GET: Buscar dados para relatórios
- Calcular LTV, CAC, etc.
```

**Cálculos:**
```typescript
// LTV (Lifetime Value)
const ltv = totalRevenue / totalCustomers;

// CAC (Custo de Aquisição)
const cac = marketingSpend / newCustomers;

// Taxa de Retenção
const retention = (returningCustomers / totalCustomers) * 100;
```

---

### 9. **Integrações** (Prioridade Baixa)

**Arquivos a criar:**

```typescript
// src/app/(admin)/configuracoes/integracoes/page.tsx
- Cards de integrações disponíveis
- Facebook Pixel, Google Ads, Google Analytics, Webhooks
- Status: Conectado/Não Conectado
- Botão "Configurar"

// src/components/admin/integrations/FacebookPixelConfig.tsx
- Adicionar múltiplos Pixel IDs
- Configurar CAPI (Conversions API)
- Testar eventos

// src/components/admin/integrations/GoogleAdsConfig.tsx
- Adicionar IDs de conversão
- Configurar Google Tag Manager
- Google Analytics 4

// src/components/admin/integrations/WebhooksConfig.tsx
- Adicionar URLs de webhook
- Selecionar eventos (order.created, order.confirmed, etc.)
- Testar webhook

// src/app/api/admin/integrations/route.ts
- GET: Listar integrações
- POST: Criar integração

// src/app/api/webhooks/route.ts
- POST: Receber webhooks externos
```

---

### 10. **Pixels e Anúncios** (Prioridade Baixa)

**Arquivos a criar:**

```typescript
// src/app/(admin)/configuracoes/pixels/page.tsx
- Tabs: Meta (Facebook), Google, TikTok
- Adicionar múltiplos pixels
- Log de eventos em tempo real
- Botão "Enviar Evento de Teste"

// src/components/admin/pixels/MetaPixelConfig.tsx
- Adicionar Pixel IDs
- Configurar CAPI (token de acesso)
- Sincronizar catálogo

// src/components/admin/pixels/GoogleAdsConfig.tsx
- Adicionar IDs de conversão
- Configurar GA4
- Sincronizar Merchant Center

// src/lib/tracking/facebook.ts
- Funções para disparar eventos do Facebook Pixel
- Server-side com CAPI

// src/lib/tracking/google.ts
- Funções para disparar eventos do Google Analytics 4
- Google Ads conversions
```

---

## 🚀 Como Continuar

### 1. **Instalar Dependências Necessárias**

```bash
# Chart.js para gráficos
npm install chart.js react-chartjs-2

# Leaflet para mapas
npm install leaflet react-leaflet @types/leaflet

# Date-fns para datas
npm install date-fns

# Zod para validação
npm install zod

# React Hook Form
npm install react-hook-form @hookform/resolvers

# Nodemailer para emails
npm install nodemailer @types/nodemailer

# PDF generation
npm install pdfkit @types/pdfkit

# Lucide icons (já deve estar instalado)
npm install lucide-react
```

### 2. **Ordem de Implementação Sugerida**

1. ✅ **Dashboard** (Concluído)
2. 🔄 **Gestão de Pedidos** (Em andamento)
3. **Gestão de Cardápio**
4. **Configurações da Empresa**
5. **Áreas de Entrega**
6. **Gestão de Usuários**
7. **Promoções**
8. **Relatórios**
9. **Email Marketing**
10. **Integrações e Pixels**

### 3. **Testar Cada Módulo**

Após implementar cada módulo:
1. Testar CRUD completo
2. Verificar permissões (admin vs gerente)
3. Testar responsividade (mobile/desktop)
4. Verificar erros no console
5. Testar com dados reais

---

## 📝 Notas Importantes

### Segurança
- ✅ Sempre validar permissões no servidor (não confiar no cliente)
- ✅ Usar `getServerSession` em Server Components
- ✅ Validar dados com Zod antes de salvar no banco
- ✅ Hash de senhas com bcrypt (min 10 rounds)
- ✅ Nunca expor senhas ou tokens no cliente

### Performance
- ✅ Usar `revalidatePath` após mutações
- ✅ Implementar paginação em listas grandes
- ✅ Otimizar queries do Prisma (select apenas campos necessários)
- ✅ Usar `loading.tsx` para feedback visual
- ✅ Implementar cache com `unstable_cache` quando apropriado

### UX
- ✅ Feedback visual para todas as ações (toast/alert)
- ✅ Confirmação antes de ações destrutivas (deletar)
- ✅ Loading states em botões
- ✅ Mensagens de erro claras
- ✅ Validação em tempo real nos formulários

---

## 🎨 Design System

### Cores
- **Primary**: `#FF6B00` (Laranja)
- **Background Light**: `#f5f1e9`
- **Background Dark**: `#23170f`
- **Card Light**: `#ffffff`
- **Card Dark**: `#2a1e14`
- **Text Primary Light**: `#333333`
- **Text Primary Dark**: `#f5f1e9`
- **Text Secondary**: `#a16b45`
- **Border Light**: `#ead9cd`
- **Border Dark**: `#4a3c30`

### Componentes Reutilizáveis a Criar

```typescript
// src/components/ui/Button.tsx
// src/components/ui/Input.tsx
// src/components/ui/Select.tsx
// src/components/ui/Modal.tsx
// src/components/ui/Toast.tsx
// src/components/ui/Badge.tsx
// src/components/ui/Card.tsx
// src/components/ui/Table.tsx
```

---

## 📚 Recursos Úteis

- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Chart.js](https://www.chartjs.org/)
- [Leaflet](https://leafletjs.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Boa sorte com a implementação! 🍣🚀**


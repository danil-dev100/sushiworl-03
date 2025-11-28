# 🚀 Email Marketing Visual (Tipo n8n) - Guia Completo

Sistema completo de automação de email marketing com editor visual drag-and-drop igual ao n8n/Zapier.

## 📋 ÍNDICE

1. [Funcionalidades](#funcionalidades)
2. [Arquitetura](#arquitetura)
3. [Componentes Criados](#componentes-criados)
4. [Como Usar](#como-usar)
5. [Configuração SMTP](#configuração-smtp)
6. [Criando Fluxos](#criando-fluxos)
7. [Tipos de Nós](#tipos-de-nós)
8. [Motor de Execução](#motor-de-execução)
9. [Anti-Spam](#anti-spam)
10. [Troubleshooting](#troubleshooting)

---

## ✨ FUNCIONALIDADES

### Editor Visual Tipo n8n
- ✅ **Drag-and-drop** de nós no canvas
- ✅ **Conexões visuais** entre nós
- ✅ **Painel lateral de configuração** (NodeConfigPanel)
- ✅ **Validação em tempo real**
- ✅ **Zoom, pan e minimap**
- ✅ **Seleção múltipla** de nós
- ✅ **Duplicação e exclusão** de nós
- ✅ **Undo/Redo** (ReactFlow nativo)

### Gerenciamento de Fluxos
- ✅ **Lista visual de fluxos** com cards
- ✅ **Estatísticas** (execuções, taxa de sucesso)
- ✅ **Ativar/Desativar** fluxos
- ✅ **Duplicar** fluxos
- ✅ **Deletar** com confirmação
- ✅ **Status** (Ativo, Inativo, Rascunho)

### Configurações SMTP
- ✅ **Configuração completa** do servidor
- ✅ **Teste de conexão** antes de salvar
- ✅ **Headers anti-spam**
- ✅ **Rate limiting**
- ✅ **Delay entre envios**

---

## 🏗️ ARQUITETURA

### Estrutura de Pastas

```
src/
├── components/admin/email-marketing/
│   ├── FlowCanvas.tsx                 ← Editor visual completo
│   ├── NodeConfigPanel.tsx            ← Painel lateral de config
│   ├── FlowsList.tsx                  ← Lista de funis
│   ├── FlowBuilderContent.tsx         ← Container do builder
│   ├── NodePalette.tsx                ← Paleta de nós
│   ├── SMTPSettingsForm.tsx           ← Formulário SMTP
│   └── nodes/
│       ├── TriggerNode.tsx            ← Nó de gatilho
│       ├── EmailNode.tsx              ← Nó de email
│       ├── DelayNode.tsx              ← Nó de delay
│       ├── ConditionNode.tsx          ← Nó de condição
│       └── ActionNode.tsx             ← Nó de ação
│
├── app/admin/marketing/email/
│   ├── page.tsx                       ← Lista de fluxos
│   ├── builder/[id]/page.tsx          ← Editor de fluxo
│   └── settings/page.tsx              ← Configurações SMTP
│
└── app/api/admin/marketing/email/
    ├── automations/route.ts           ← CRUD automações
    ├── automations/[id]/route.ts      ← Ações individuais
    ├── settings/route.ts              ← Config SMTP
    └── test-smtp/route.ts             ← Teste SMTP
```

---

## 🧩 COMPONENTES CRIADOS

### 1. **FlowCanvas** (Editor Principal)

**Localização:** `src/components/admin/email-marketing/FlowCanvas.tsx`

**Funcionalidades:**
- ReactFlow completo com Provider
- Validação de fluxos (requer trigger)
- Detecção de nós órfãos
- Seleção múltipla (Shift + Click)
- Zoom In/Out e Fit View
- Duplicar e deletar nós
- Painel de estatísticas
- Toolbar superior e inferior

**Props:**
```typescript
interface FlowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[], isActive: boolean) => Promise<void>;
  templates?: Array<{ id: string; name: string; subject: string }>;
  flowId?: string;
  initialIsActive?: boolean;
}
```

**Exemplo de uso:**
```tsx
<FlowCanvas
  initialNodes={nodes}
  initialEdges={edges}
  onSave={handleSave}
  templates={templates}
  flowId={automation.id}
  initialIsActive={automation.isActive}
/>
```

---

### 2. **NodeConfigPanel** (Painel de Configuração)

**Localização:** `src/components/admin/email-marketing/NodeConfigPanel.tsx`

**Funcionalidades:**
- Configurações específicas por tipo de nó
- Formulários dinâmicos
- Validação de campos
- Salvar/Cancelar
- UI responsiva

**Tipos de configuração:**

#### **TriggerConfig**
- Tipo de gatilho (NEW_ORDER, CART_ABANDONED, etc.)
- Tempo de abandono (para carrinho)

#### **EmailConfig**
- Template de email
- Assunto personalizado
- Nome do remetente
- Botão de ação (texto, URL)

#### **DelayConfig**
- Dias e horas de espera
- Cálculo automático de total

#### **ConditionConfig**
- Campo a verificar
- Operador (gt, lt, eq, etc.)
- Valor de comparação

#### **ActionConfig**
- Tipo de ação
- Parâmetros específicos

---

### 3. **FlowsList** (Lista de Fluxos)

**Localização:** `src/components/admin/email-marketing/FlowsList.tsx`

**Funcionalidades:**
- Cards visuais com estatísticas
- Ações (Editar, Duplicar, Deletar)
- Ativar/Desativar com switch
- Dialog de confirmação de exclusão
- Empty state quando não há fluxos

**Estatísticas exibidas:**
- Total de nós
- Total de conexões
- Execuções totais
- Taxa de sucesso
- Componentes do fluxo (triggers, emails, delays, etc.)

---

### 4. **NodePalette** (Paleta de Componentes)

**Localização:** `src/components/admin/email-marketing/NodePalette.tsx`

**Nós disponíveis:**

**Gatilhos (Triggers):**
- 🛒 Novo Pedido
- ❌ Pedido Cancelado
- 🛒 Carrinho Abandonado
- 👤 Usuário Registrado
- 🎂 Aniversário

**Ações:**
- ✉️ Enviar Email
- ⏰ Aguardar (Delay)
- 🔀 Condição (If/Else)
- 🔧 Atualizar Status

**Uso:**
- Arrastar para o canvas
- Ou clicar para adicionar

---

## 🎯 COMO USAR

### 1. Acessar o Sistema

**URL:** `/admin/marketing/email`

Você verá:
- Lista de fluxos existentes
- Botão "Novo Fluxo"
- Estatísticas de cada fluxo

### 2. Criar Novo Fluxo

1. Clique em **"Novo Fluxo"**
2. Será redirecionado para `/admin/marketing/email/builder/[id]`
3. Dê um nome ao fluxo
4. Adicione uma descrição (opcional)

### 3. Adicionar Nós

**Método 1: Click**
- Clique no nó desejado na paleta lateral
- Ele será adicionado ao canvas

**Método 2: Drag-and-Drop**
- Arraste o nó da paleta
- Solte no canvas na posição desejada

### 4. Conectar Nós

- Clique no **handle (ponto de conexão)** de um nó
- Arraste até o handle de outro nó
- A conexão será criada automaticamente

### 5. Configurar Nós

- Clique em qualquer nó no canvas
- O **NodeConfigPanel** abrirá à direita
- Preencha as configurações
- Clique em **"Salvar"**

### 6. Salvar Fluxo

- Clique no botão **"Salvar Fluxo"** na toolbar inferior
- O fluxo será validado
- Se válido, será salvo no banco

### 7. Ativar Fluxo

- Clique no botão **"Inativo"** para ativar
- Mudará para **"Ativo"** com cor verde
- O fluxo começará a executar automaticamente

---

## ⚙️ CONFIGURAÇÃO SMTP

### Acessar Configurações

**URL:** `/admin/marketing/email/settings`

### Campos Obrigatórios

#### Servidor SMTP
```
Hostinger: smtp.hostinger.com
Gmail: smtp.gmail.com
Outlook: smtp-mail.outlook.com
```

#### Porta
```
587 - STARTTLS (recomendado)
465 - SSL
25 - Sem criptografia (não recomendado)
```

#### Usuário e Senha
- **Gmail:** Use "Senhas de app" (App Passwords)
- **Hostinger:** Credenciais da conta de email
- **Outlook:** Senha da conta

#### TLS
- ✅ **Ativado:** Conexão criptografada (recomendado)
- ❌ **Desativado:** Sem criptografia

### Configurações Anti-Spam

#### Delay Mínimo/Máximo
- Define intervalo aleatório entre envios
- Evita detecção como spam
- Recomendado: 60-300 segundos

#### Limite por Hora
- Máximo de emails por hora
- Gmail: ~100-500/dia
- Hostinger: Varia por plano

### Testar Conexão

1. Preencha todos os campos
2. Clique em **"Testar Conexão"**
3. Um email será enviado para o usuário configurado
4. Verifique sua caixa de entrada
5. Se sucesso, clique em **"Salvar"**

---

## 🎨 CRIANDO FLUXOS

### Exemplo 1: Boas-vindas

**Objetivo:** Enviar email de boas-vindas quando usuário se registra

**Passos:**
1. Adicionar nó **"Usuário Registrado"** (Trigger)
2. Adicionar nó **"Enviar Email"**
3. Conectar Trigger → Email
4. Configurar Email:
   - Template: "Bem-vindo"
   - Assunto: "Bem-vindo ao SushiWorld!"
5. Salvar e Ativar

**Fluxo:**
```
[Usuário Registrado] → [Enviar Email: Bem-vindo]
```

### Exemplo 2: Carrinho Abandonado

**Objetivo:** Lembrar cliente após 24h de abandono

**Passos:**
1. Adicionar nó **"Carrinho Abandonado"**
   - Configurar: 24 horas
2. Adicionar nó **"Aguardar"**
   - Configurar: 1 dia
3. Adicionar nó **"Enviar Email"**
   - Template: "Volte e complete sua compra"
4. Conectar: Trigger → Delay → Email
5. Salvar e Ativar

**Fluxo:**
```
[Carrinho Abandonado] → [Aguardar 24h] → [Email: Volte!]
```

### Exemplo 3: Condicional por Valor

**Objetivo:** Email diferente se pedido > 50€

**Passos:**
1. Adicionar nó **"Novo Pedido"**
2. Adicionar nó **"Condição"**
   - Campo: orderTotal
   - Operador: gt (maior que)
   - Valor: 50
3. Adicionar 2 nós **"Enviar Email"**:
   - Email 1: "Obrigado Cliente VIP"
   - Email 2: "Obrigado pela compra"
4. Conectar:
   - Trigger → Condição
   - Condição (true) → Email VIP
   - Condição (false) → Email Normal

**Fluxo:**
```
[Novo Pedido] → [Condição: Valor > 50€]
                  ├─ Sim → [Email VIP]
                  └─ Não → [Email Normal]
```

---

## 🔧 TIPOS DE NÓS

### Trigger Nodes

#### Novo Pedido
- Dispara quando pedido é criado
- Dados disponíveis: cliente, produtos, total

#### Pedido Cancelado
- Dispara quando pedido é cancelado
- Dados: motivo, cliente

#### Carrinho Abandonado
- Dispara após X horas de inatividade
- Configurável: 1-72 horas

#### Usuário Registrado
- Dispara ao criar conta
- Dados: nome, email, telefone

#### Aniversário
- Dispara no dia do aniversário
- Agendado automaticamente

### Action Nodes

#### Enviar Email
- Template selecionável
- Assunto personalizável
- Variáveis dinâmicas
- Botão de ação opcional

#### Aguardar (Delay)
- Dias e horas configuráveis
- Delay mínimo: 1 minuto
- Delay máximo: 30 dias

#### Condição (If/Else)
- Campos disponíveis:
  - `orderTotal` - Valor do pedido
  - `orderCount` - Número de pedidos
  - `customerType` - Tipo de cliente
  - `productCategory` - Categoria
- Operadores:
  - `gt` - Maior que
  - `gte` - Maior ou igual
  - `lt` - Menor que
  - `lte` - Menor ou igual
  - `eq` - Igual
  - `neq` - Diferente

#### Atualizar Status
- Muda status do cliente
- Adiciona tags
- Atualiza campos customizados

---

## ⚡ MOTOR DE EXECUÇÃO

### Como Funciona

1. **Evento acontece** (ex: novo pedido)
2. **Sistema busca fluxos ativos** com trigger correspondente
3. **Executa cada nó** sequencialmente
4. **Registra logs** de execução
5. **Atualiza estatísticas**

### Execução de Nós

#### Trigger
```typescript
// Identifica o evento
// Carrega dados do contexto
// Passa para próximo nó
```

#### Email
```typescript
// Renderiza template com variáveis
// Aplica configurações SMTP
// Envia email via Nodemailer
// Registra envio
```

#### Delay
```typescript
// Agenda execução futura
// Usa cron job ou queue
// Continua após delay
```

#### Condition
```typescript
// Avalia condição
// Segue caminho true ou false
// Passa dados para próximo nó
```

### Variáveis Disponíveis

```javascript
{
  customer: {
    name: string,
    email: string,
    phone: string,
    totalSpent: number,
    orderCount: number
  },
  order: {
    id: string,
    number: number,
    total: number,
    items: Array<Product>,
    status: string
  },
  trigger: {
    type: string,
    timestamp: Date,
    data: any
  }
}
```

---

## 🛡️ ANTI-SPAM

### Headers Implementados

```typescript
{
  'X-Mailer': 'SushiWorld Email System',
  'X-Priority': '3',
  'X-MSMail-Priority': 'Normal',
  'Importance': 'Normal',
  'List-Unsubscribe': '<mailto:unsubscribe@sushiworld.com>',
  'Precedence': 'bulk',
  'Reply-To': 'noreply@sushiworld.com'
}
```

### Rate Limiting

```typescript
// Delay aleatório entre envios
const delay = random(minDelaySeconds, maxDelaySeconds);

// Máximo por hora
if (emailsThisHour >= maxEmailsPerHour) {
  waitUntilNextHour();
}

// Registrar envio
logEmailSend(email, timestamp);
```

### Boas Práticas

✅ **DO:**
- Usar domínio próprio (não Gmail pessoal)
- Configurar SPF, DKIM e DMARC
- Incluir link de descadastro
- Personalizar emails
- Testar antes de ativar

❌ **DON'T:**
- Enviar para listas compradas
- Usar CAPS LOCK no assunto
- Enviar muitos emails de uma vez
- Usar palavras spam (FREE, WIN, etc.)
- Esconder remetente real

---

## 🐛 TROUBLESHOOTING

### Erro: "EmailTemplate table does not exist"

**Solução:**
```bash
npx tsx scripts/create-email-tables.ts
```

### Erro: SMTP Connection Failed

**Causas comuns:**
1. Host ou porta incorretos
2. Credenciais inválidas
3. TLS mal configurado
4. Firewall bloqueando

**Soluções:**
1. Verificar configurações do provedor
2. Usar App Password (Gmail)
3. Testar porta 587 e 465
4. Desabilitar antivírus temporariamente

### Fluxo não executa

**Checklist:**
- [ ] Fluxo está **Ativo**?
- [ ] Tem pelo menos 1 **Trigger**?
- [ ] Todos os nós estão **conectados**?
- [ ] SMTP está **configurado**?
- [ ] Evento realmente **aconteceu**?

### Emails vão para SPAM

**Soluções:**
1. Configurar SPF/DKIM
2. Usar domínio próprio
3. Não usar palavras spam
4. Incluir link de descadastro
5. Pedir para adicionar nos contatos

---

## 📊 ESTATÍSTICAS

### Métricas Disponíveis

- **Total de Execuções:** Quantas vezes o fluxo rodou
- **Taxa de Sucesso:** % de execuções bem-sucedidas
- **Falhas:** Número de execuções com erro
- **Emails Enviados:** Total de emails disparados
- **Taxa de Abertura:** % de emails abertos (se configurado)
- **Taxa de Cliques:** % de cliques em links

### Logs

Cada execução gera um log com:
```typescript
{
  id: string,
  automationId: string,
  userId: string | null,
  email: string,
  trigger: string,
  nodeId: string,
  status: 'SUCCESS' | 'FAILED' | 'PENDING',
  errorMessage: string | null,
  executedAt: Date
}
```

---

## 🎓 PRÓXIMOS PASSOS

### Funcionalidades Futuras

- [ ] **Editor WYSIWYG** para templates
- [ ] **Testes A/B** de emails
- [ ] **Segmentação** de audiência
- [ ] **Webhooks** para eventos externos
- [ ] **Integrações** (SendGrid, Mailchimp)
- [ ] **Relatórios avançados**
- [ ] **Machine Learning** para melhor timing
- [ ] **Templates pré-prontos**

### Melhorias Planejadas

- [ ] Performance otimizada para 10k+ fluxos
- [ ] Versionamento de fluxos
- [ ] Rollback de alterações
- [ ] Comentários nos nós
- [ ] Grupos e pastas de fluxos
- [ ] Permissões por usuário

---

## 📝 NOTAS IMPORTANTES

### Segurança

- Senhas SMTP são armazenadas em texto (considere criptografar)
- Apenas usuários admin podem acessar
- Logs mantêm histórico completo
- Rate limiting evita abuso

### Performance

- Fluxos executam em background
- Delays usam scheduling
- Emails em fila para envio
- Cache de templates

### Backup

- Faça backup regular do banco
- Exporte fluxos importantes
- Teste restauração periodicamente

---

## 🤝 SUPORTE

**Dúvidas?**
- Veja [EMAIL-MARKETING.md](./EMAIL-MARKETING.md)
- Consulte logs no banco de dados
- Verifique console do navegador

**Encontrou um bug?**
- Abra um issue no repositório
- Inclua steps to reproduce
- Adicione screenshots se possível

---

**Desenvolvido com ❤️ usando Next.js 15, ReactFlow e Supabase**

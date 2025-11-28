# Sistema de Email Marketing - SushiWorld

Sistema completo de automação de email marketing com editor visual de fluxos estilo n8n/Zapier.

## 🚀 Funcionalidades

### 1. Editor Visual de Fluxos
- Interface drag-and-drop para criar automações de email
- Tipos de nós disponíveis:
  - **Gatilhos (Triggers)**:
    - Novo Pedido
    - Pedido Cancelado
    - Carrinho Abandonado
    - Usuário Registrado
    - Aniversário
  - **Ações**:
    - Enviar Email
    - Aguardar (Delay)
    - Condição (If/Else)
    - Atualizar Status

### 2. Configurações SMTP
- Formulário completo para configurar servidor SMTP
- Campos disponíveis:
  - Host (ex: smtp.hostinger.com)
  - Porta (587, 465)
  - Usuário
  - Senha
  - TLS/STARTTLS
  - Nome do remetente padrão
  - Email do remetente padrão
- Botão de teste de conexão antes de salvar

### 3. Templates de Email
- Criação e gerenciamento de templates HTML
- Variáveis dinâmicas (nome do cliente, pedido, etc.)
- Pré-visualização de emails
- Botões personalizáveis com cores

## 📁 Estrutura de Arquivos

### Páginas
- `/admin/marketing/email` - Página principal com lista de automações e templates
- `/admin/marketing/email/builder/[id]` - Editor visual de fluxos
- `/admin/marketing/email/settings` - Configurações SMTP

### Componentes
- `src/components/admin/email-marketing/FlowEditor.tsx` - Editor ReactFlow
- `src/components/admin/email-marketing/NodePalette.tsx` - Paleta de componentes
- `src/components/admin/email-marketing/FlowBuilderContent.tsx` - Container do builder
- `src/components/admin/email-marketing/SMTPSettingsForm.tsx` - Formulário SMTP
- `src/components/admin/email-marketing/nodes/` - Componentes de nós visuais

### APIs
- `POST /api/admin/marketing/email/automations` - Criar automação
- `GET/PUT/DELETE /api/admin/marketing/email/automations/[id]` - CRUD de automações
- `GET/POST /api/admin/marketing/email/settings` - Configurações SMTP
- `POST /api/admin/marketing/email/test-smtp` - Testar conexão SMTP
- `GET/POST /api/admin/marketing/email/templates` - CRUD de templates

### Scripts
- `scripts/create-email-tables.ts` - Cria tabelas no banco de dados
- `scripts/test-email-marketing.ts` - Testa funcionalidades

## 🗄️ Banco de Dados

### Tabelas Criadas
- `EmailAutomation` - Automações de email com fluxos
- `EmailAutomationLog` - Logs de execução das automações
- `EmailTemplate` - Templates de email HTML
- `SmtpSettings` - Configurações do servidor SMTP

## 🎯 Como Usar

### 1. Primeira Configuração
1. Acesse `/admin/marketing/email/settings`
2. Configure o servidor SMTP:
   - Host: smtp.hostinger.com (ou seu provedor)
   - Porta: 587 (STARTTLS) ou 465 (SSL)
   - Usuário: seu-email@dominio.com
   - Senha: sua-senha-smtp
3. Clique em "Testar Conexão" para validar
4. Se o teste passar, clique em "Salvar"

### 2. Criar uma Automação
1. Acesse `/admin/marketing/email`
2. Clique em "Nova Automação"
3. No editor visual:
   - Arraste um gatilho (trigger) da paleta lateral
   - Arraste uma ação de "Enviar Email"
   - Conecte os nós clicando e arrastando entre eles
4. Configure cada nó clicando nele
5. Clique em "Salvar Automação"
6. Ative a automação quando estiver pronta

### 3. Criar um Template de Email
1. Acesse `/admin/marketing/email`
2. Vá para a aba "Templates"
3. Clique em "Novo Template"
4. Preencha:
   - Nome do template
   - Assunto do email
   - Conteúdo HTML
   - Conteúdo texto (fallback)
5. Configure botão (opcional)
6. Salve o template

### 4. Testar o Sistema
Execute o script de teste:
```bash
npx tsx scripts/test-email-marketing.ts
```

## 🔧 Troubleshooting

### Erro: "EmailTemplate table does not exist"
Execute o script de criação de tabelas:
```bash
npx tsx scripts/create-email-tables.ts
```

### Erro ao conectar ao SMTP
- Verifique se o host e porta estão corretos
- Confira se o usuário e senha são válidos
- Alguns provedores exigem "senha de aplicativo" em vez da senha normal
- Verifique se TLS está habilitado/desabilitado conforme necessário

### Emails não estão sendo enviados
1. Verifique se a automação está ativa (isDraft = false, isActive = true)
2. Confira os logs em `EmailAutomationLog`
3. Verifique se o SMTP está configurado corretamente
4. Teste a conexão SMTP na página de configurações

## 📊 Exemplos de Fluxos

### Fluxo de Boas-vindas
```
[Usuário Registrado] → [Enviar Email "Bem-vindo"]
```

### Fluxo de Carrinho Abandonado
```
[Carrinho Abandonado] → [Aguardar 24h] → [Enviar Email "Volte!"]
```

### Fluxo Condicional
```
[Novo Pedido] → [Condição: Valor > 50€]
  ├─ Sim → [Enviar Email "Obrigado VIP"]
  └─ Não → [Enviar Email "Obrigado"]
```

## 🎨 Personalização

### Cores dos Nós
- Triggers: Verde (#10B981), Vermelho (#EF4444), Laranja (#F59E0B), Azul (#3B82F6), Roxo (#8B5CF6)
- Ações: Azul (#3B82F6), Laranja (#F59E0B), Roxo (#8B5CF6), Verde (#14B8A6)

### Variáveis nos Templates
Use variáveis nos templates para personalização:
- `{{customerName}}` - Nome do cliente
- `{{orderNumber}}` - Número do pedido
- `{{orderTotal}}` - Total do pedido
- `{{productName}}` - Nome do produto

## 📝 Notas Importantes

- O sistema usa Nodemailer para envio de emails
- Os fluxos são armazenados como JSON no banco de dados
- As automações podem ser salvas como rascunho antes de ativá-las
- Há validação para garantir que todo fluxo tenha pelo menos um trigger
- Os logs de execução são armazenados para auditoria

## 🔐 Segurança

- Senhas SMTP são armazenadas no banco (considere criptografia futura)
- Apenas usuários com permissão de marketing podem acessar
- Logs de execução incluem informações de quem criou a automação

## 🚀 Próximos Passos

Funcionalidades futuras que podem ser implementadas:
- [ ] Editor WYSIWYG para templates de email
- [ ] Testes A/B de emails
- [ ] Segmentação de audiência
- [ ] Relatórios de performance (taxa de abertura, cliques)
- [ ] Integração com provedores de email (SendGrid, Mailgun)
- [ ] Agendamento de envios
- [ ] Limite de taxa (rate limiting) para evitar spam

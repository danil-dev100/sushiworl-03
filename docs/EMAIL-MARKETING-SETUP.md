# 📧 Setup de Email Marketing - SushiWorld

Este guia explica como configurar e popular o sistema de email marketing com templates e fluxos pré-configurados.

## 🎯 O que será criado

### 📨 Templates de Email (8 templates)

1. **Boas-vindas - Primeira Compra**
   - Enviado após primeiro pedido
   - Cupom BEMVINDO10 (10% OFF)

2. **Carrinho Abandonado - 1h**
   - Lembrete de itens no carrinho
   - Enviado 1h após abandono

3. **Recuperação - 7 dias sem comprar**
   - Cupom VOLTE15 (15% OFF)
   - Válido por 3 dias

4. **Recuperação - 15 dias sem comprar**
   - Cupom VOLTEVIP20 (20% OFF + frete grátis)
   - Válido por 5 dias

5. **Recuperação - 30 dias sem comprar**
   - Cupom RETORNO25 (25% OFF + frete grátis + brinde)
   - Válido por 7 dias

6. **Pedido Confirmado**
   - Confirmação imediata do pedido
   - Resumo completo

7. **Agradecimento Pós-Pedido**
   - Solicitação de avaliação
   - Cupom OBRIGADO10 (10% OFF)

8. **Aniversário do Cliente**
   - Cupom ANIVERSARIO30 (30% OFF + sobremesa + frete grátis)
   - Válido apenas no dia

### 🔄 Fluxos de Automação (9 fluxos)

1. **Jornada: Primeira Compra**
   - Email de boas-vindas imediato
   - Email de agradecimento após 24h

2. **Jornada: Carrinho Abandonado**
   - Email 1: Lembrete após 1h
   - Email 2: Urgência após 24h (se não comprou)
   - Email 3: 10% OFF após 48h (última chance)

3. **Jornada: Recuperação 7 Dias**
   - Email automático com 15% OFF

4. **Jornada: Recuperação 15 Dias**
   - Email automático com 20% OFF + frete grátis

5. **Jornada: Recuperação 30 Dias**
   - Email automático com 25% OFF + frete + brinde

6. **Jornada: Confirmação de Pedido**
   - Email imediato de confirmação

7. **Jornada: Avaliação Pós-Pedido**
   - Aguarda 3 dias após entrega
   - Solicita avaliação + cupom 10%

8. **Jornada: Aniversário**
   - Email às 9h no dia do aniversário
   - 30% OFF + sobremesa grátis

9. **Jornada: Cliente VIP**
   - Ativado no 5º pedido
   - Benefícios: 15% permanente, frete grátis, prioridade

## 🚀 Como Executar

### Opção 1: Executar seeds individualmente

```bash
# 1. Popular templates
npx tsx prisma/seed-email-templates.ts

# 2. Popular fluxos
npx tsx prisma/seed-email-flows.ts
```

### Opção 2: Executar tudo de uma vez

```bash
# Criar script combinado
npx tsx prisma/seed-email-templates.ts && npx tsx prisma/seed-email-flows.ts
```

### Opção 3: Via Node

```bash
# Templates
node --loader ts-node/esm prisma/seed-email-templates.ts

# Fluxos
node --loader ts-node/esm prisma/seed-email-flows.ts
```

## ✅ Verificar se funcionou

Após executar os seeds:

1. Acesse `/admin/marketing/email-marketing`
2. Você deve ver 9 fluxos listados
3. Acesse `/admin/marketing/email/templates` (se existir rota)
4. Você deve ver 8 templates

Ou verifique direto no banco:

```sql
SELECT COUNT(*) FROM "EmailTemplate";  -- Deve retornar 8
SELECT COUNT(*) FROM "EmailAutomation"; -- Deve retornar 9
```

## 📝 Personalização

### Variáveis Disponíveis nos Templates

Os templates suportam variáveis dinâmicas:

- `{{customerName}}` - Nome do cliente
- `{{customerEmail}}` - Email do cliente
- `{{orderNumber}}` - Número do pedido
- `{{orderId}}` - ID do pedido
- `{{orderTotal}}` - Valor total do pedido
- `{{orderItems}}` - Lista de itens do pedido
- `{{deliveryAddress}}` - Endereço de entrega
- `{{cartItems}}` - Itens no carrinho
- `{{cartTotal}}` - Total do carrinho
- `{{buttonUrl}}` - URL do botão de ação
- `{{ratingUrl}}` - URL para avaliação

### Modificar Templates

1. Acesse o admin
2. Vá em Marketing > Email Marketing > Templates
3. Edite o template desejado
4. As alterações serão aplicadas nos próximos envios

### Ativar/Desativar Fluxos

Por padrão, todos os fluxos são criados como **inativos** (`isActive: false`).

Para ativar:
1. Acesse `/admin/marketing/email-marketing`
2. Clique no botão de Play do fluxo desejado
3. O fluxo começará a executar automaticamente

## 🎨 Cores e Estilo

Todos os templates usam a identidade visual do SushiWorld:

- Cor principal: `#FF6B00` (laranja)
- Cor de fundo: `#f5f1e9` (bege claro)
- Cor de destaque: `#fef6f0` (bege mais claro)
- Fonte: Arial, sans-serif

## ⚙️ Configurar SMTP

Antes de ativar os fluxos, configure o SMTP:

1. Acesse `/admin/marketing/email/settings`
2. Configure:
   - Servidor SMTP (ex: smtp.gmail.com)
   - Porta (ex: 587)
   - Usuário (seu email)
   - Senha (senha de app se usar Gmail)
   - TLS: Ativado
3. Clique em "Testar Conexão"
4. Se sucesso, salve as configurações

### Gmail App Password

Se usar Gmail, você precisa criar uma senha de app:

1. Acesse https://myaccount.google.com/security
2. Ative verificação em 2 etapas
3. Gere uma senha de app
4. Use essa senha no SMTP

## 🧪 Testar Fluxos

Para testar um fluxo:

1. Abra o builder do fluxo
2. Clique em "Testar Fluxo"
3. Insira seu email
4. Você receberá o email de teste

## 📊 Métricas

Cada fluxo rastreia:
- Total de execuções
- Taxa de sucesso
- Taxa de falha
- Logs detalhados

Acesse as métricas em:
`/admin/marketing/email-marketing`

## 🔧 Troubleshooting

### Templates não aparecem

```bash
# Verificar no banco
npx prisma studio
# Checar tabela EmailTemplate
```

### Fluxos não executam

1. Verifique se está ativo (`isActive: true`)
2. Verifique configuração SMTP
3. Cheque logs em `EmailAutomationLog`

### Erro ao executar seed

```bash
# Regenerar Prisma Client
npx prisma generate

# Tentar novamente
npx tsx prisma/seed-email-templates.ts
```

## 📚 Próximos Passos

1. ✅ Executar seeds
2. ✅ Configurar SMTP
3. ✅ Testar envio
4. ✅ Ativar fluxos desejados
5. ✅ Monitorar métricas
6. 🎨 Personalizar templates (opcional)
7. 🔄 Criar novos fluxos (opcional)

## 🎉 Pronto!

Agora você tem um sistema completo de email marketing com:
- 8 templates profissionais
- 9 fluxos de automação configurados
- Jornada do cliente completa
- Sistema de recuperação de vendas
- Programa de fidelidade

Boas vendas! 🍣

# Guia Completo de Webhooks - SushiWorld

## 📋 Índice
1. [O que são Webhooks?](#o-que-são-webhooks)
2. [Tipos de Webhooks](#tipos-de-webhooks)
3. [Como Configurar](#como-configurar)
4. [Webhooks INBOUND (Receber)](#webhooks-inbound-receber)
5. [Webhooks OUTBOUND (Enviar)](#webhooks-outbound-enviar)
6. [Eventos Disponíveis](#eventos-disponíveis)
7. [Segurança e Validação](#segurança-e-validação)
8. [Testes e Monitoramento](#testes-e-monitoramento)

---

## O que são Webhooks?

Webhooks são notificações HTTP automáticas enviadas quando eventos específicos ocorrem no sistema. São úteis para:
- Integração com plataformas externas (iFood, Rappi, etc.)
- Automação de processos
- Sincronização de dados em tempo real
- Notificações para sistemas externos

---

## Tipos de Webhooks

### 🔵 **INBOUND (Receber)**
Webhooks que você **recebe** de plataformas externas quando eventos ocorrem lá.

**Exemplo de uso:**
- Receber novos pedidos do iFood
- Receber cancelamentos de parceiros
- Receber atualizações de pagamento

### 🟠 **OUTBOUND (Enviar)**
Webhooks que você **envia** para plataformas externas quando eventos ocorrem no SushiWorld.

**Exemplo de uso:**
- Notificar sistema de estoque quando pedido é criado
- Enviar dados para CRM quando cliente faz pedido
- Notificar sistema de contabilidade sobre vendas

---

## Como Configurar

### Acesso ao Painel
1. Acesse: `admin/marketing/webhooks`
2. Escolha a aba **"Receber Webhooks"** ou **"Enviar Webhooks"**

### Criar um Novo Webhook

1. Clique em **"Adicionar Webhook de Entrada"** ou **"Adicionar Webhook de Saída"**
2. Preencha os campos:
   - **Nome**: Identificação do webhook (ex: "iFood", "Sistema de Estoque")
   - **URL**: Endpoint que vai receber/enviar os dados
   - **Método HTTP**: POST, GET, PUT, ou PATCH (geralmente POST)
   - **Secret**: Chave secreta para validação (opcional mas recomendado)
   - **Eventos**: Selecione quais eventos ativam este webhook
   - **Status**: Ativo/Inativo

3. Clique em **"Criar Webhook"**

---

## Webhooks INBOUND (Receber)

### Endpoint Público
```
POST https://seu-dominio.com/api/webhooks
```

### Formato da Requisição
```json
{
  "event": "order.created",
  "timestamp": "2025-01-25T21:00:00Z",
  "data": {
    "orderId": "12345",
    "customerName": "João Silva",
    "total": 45.90
  }
}
```

### Headers Requeridos
```
Content-Type: application/json
X-Webhook-Signature: [HMAC SHA256 signature, se secret configurado]
```

### Validação de Assinatura
Se você configurou um **secret**, o sistema valida a assinatura HMAC SHA256:

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', 'SEU_SECRET')
  .update(JSON.stringify(body))
  .digest('hex');
```

### Configurar em Plataformas Externas

#### iFood
1. Acesse o painel do iFood
2. Vá em **Configurações > Webhooks**
3. Adicione: `https://seu-dominio.com/api/webhooks`
4. Configure o secret que você definiu no SushiWorld

#### Rappi
1. Acesse o painel do Rappi
2. Vá em **Integrações > Webhooks**
3. Adicione a URL do webhook

---

## Webhooks OUTBOUND (Enviar)

### Quando são Disparados
Webhooks OUTBOUND são automaticamente enviados quando:
- ✅ Um novo pedido é criado (`order.created`)
- ✅ Um pedido é confirmado (`order.confirmed`)
- ✅ Um pedido é cancelado (`order.cancelled`)
- ✅ Status de pedido muda
- ✅ Pagamento é confirmado

### Formato Enviado
```json
{
  "event": "order.created",
  "timestamp": "2025-01-25T21:00:00Z",
  "data": {
    "orderId": "abc123",
    "orderNumber": 1001,
    "customerName": "João Silva",
    "customerEmail": "joao@example.com",
    "total": 45.90,
    "items": [
      {
        "name": "Sushi Combo",
        "quantity": 2,
        "price": 20.00
      }
    ]
  }
}
```

### Headers Enviados
```
Content-Type: application/json
User-Agent: SushiWorld-Webhook/1.0
X-Webhook-Signature: [HMAC SHA256, se configurado]
```

### Validar Assinatura Recebida
Se você configurou um secret, valide no endpoint destino:

```javascript
const crypto = require('crypto');
const receivedSignature = req.headers['x-webhook-signature'];
const expectedSignature = crypto
  .createHmac('sha256', 'SEU_SECRET')
  .update(JSON.stringify(req.body))
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## Eventos Disponíveis

| Evento | Descrição | Quando Dispara |
|--------|-----------|----------------|
| `order.created` | Pedido Criado | Novo pedido é feito pelo cliente |
| `order.confirmed` | Pedido Confirmado | Admin aceita o pedido |
| `order.cancelled` | Pedido Cancelado | Pedido é cancelado |
| `order.preparing` | Pedido em Preparo | Status muda para "preparando" |
| `order.delivering` | Pedido em Entrega | Pedido sai para entrega |
| `order.delivered` | Pedido Entregue | Pedido é marcado como entregue |
| `payment.confirmed` | Pagamento Confirmado | Pagamento é confirmado |
| `customer.created` | Cliente Cadastrado | Novo cliente se registra |

---

## Segurança e Validação

### Boas Práticas

1. **Sempre use HTTPS**: URLs devem começar com `https://`
2. **Configure um Secret**: Protege contra requisições falsas
3. **Valide assinaturas**: Sempre verifique o header `X-Webhook-Signature`
4. **Limite de taxa**: Configure rate limiting no seu endpoint
5. **Responda rápido**: O webhook deve retornar resposta em < 5 segundos

### Validação de IP (Opcional)
Para maior segurança, você pode validar IPs de origem:
```javascript
const allowedIPs = ['SEU_IP_SERVIDOR'];
const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
if (!allowedIPs.includes(clientIP)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## Testes e Monitoramento

### Testar um Webhook

1. Acesse a página de webhooks
2. Encontre o webhook que deseja testar
3. Clique no botão **▶️ Play** (Testar webhook)
4. Verifique o resultado na tabela de logs

### Payload de Teste
```json
{
  "event": "test",
  "timestamp": "2025-01-25T21:00:00Z",
  "data": {
    "message": "Teste de webhook do SushiWorld",
    "webhookId": "abc123",
    "webhookName": "Meu Webhook"
  }
}
```

### Monitoramento

#### Visualizar Logs
- Acesse: `admin/marketing/webhooks`
- Role até **"Status dos Últimos Disparos"**
- Veja os últimos 50 disparos com:
  - ✅ Status (Sucesso/Falha)
  - ⏱️ Duração em ms
  - 📊 Código HTTP
  - ❌ Mensagens de erro

#### Métricas Disponíveis
Cada webhook mostra:
- **Sucesso**: Total de disparos bem-sucedidos
- **Falhas**: Total de disparos com erro
- **Último disparo**: Data/hora do último uso
- **Taxa de sucesso**: Percentual de sucesso

### Troubleshooting

| Problema | Solução |
|----------|---------|
| Webhook não dispara | Verifique se está **Ativo** e o evento está selecionado |
| Erro 401/403 | Verifique a assinatura e secret |
| Erro 404 | URL do webhook está incorreta |
| Erro 500 | Problema no endpoint destino |
| Timeout | Endpoint demora > 30s para responder |

---

## Exemplos Práticos

### Exemplo 1: Sistema de Estoque
**Cenário**: Atualizar estoque quando pedido é criado

1. Configure webhook OUTBOUND
2. Evento: `order.created`
3. URL: `https://seu-sistema-estoque.com/api/orders`
4. Seu endpoint processa e atualiza o estoque

### Exemplo 2: CRM Automation
**Cenário**: Adicionar cliente ao CRM quando faz primeiro pedido

1. Configure webhook OUTBOUND
2. Eventos: `order.created`, `customer.created`
3. URL: `https://seu-crm.com/api/customers`
4. CRM recebe dados e cria/atualiza cliente

### Exemplo 3: Receber Pedidos iFood
**Cenário**: Receber pedidos do iFood no SushiWorld

1. Configure webhook INBOUND
2. Nome: "iFood"
3. Eventos: `order.created`
4. Secret: gere no iFood
5. Configure no painel do iFood a URL: `https://seu-dominio.com/api/webhooks`

---

## Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@sushiworld.com
- 📱 WhatsApp: +351 XXX XXX XXX
- 📚 Documentação: [docs.sushiworld.com](https://docs.sushiworld.com)

---

**Última atualização**: 25/01/2025
**Versão**: 1.0

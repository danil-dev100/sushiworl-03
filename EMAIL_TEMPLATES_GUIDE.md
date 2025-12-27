# 📧 Guia de Templates de Email

Sistema de variáveis dinâmicas para templates de email.

## 🎯 Como Funciona

Os templates suportam variáveis no formato `{{variavel}}` que são substituídas automaticamente pelos valores reais antes do envio.

### Exemplo Simples

```html
Olá {{customer_name}},

Seu pedido #{{order_id}} no valor de {{order_total}} foi confirmado!

Obrigado,
{{store_name}}
```

Será renderizado como:

```html
Olá João Silva,

Seu pedido #clx123abc no valor de €25.50 foi confirmado!

Obrigado,
SushiWorld
```

---

## 📝 Variáveis Disponíveis

### 👤 Cliente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{customer_name}}` | Nome do cliente | João Silva |
| `{{customer_email}}` | Email do cliente | joao@example.com |
| `{{customer_phone}}` | Telefone do cliente | +351 912 345 678 |

### 🛒 Pedido

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{order_id}}` | ID único do pedido | clx123abc |
| `{{order_number}}` | Número do pedido | #12345 |
| `{{order_date}}` | Data e hora formatada | 25 de dezembro de 2024 às 18:30 |
| `{{order_status}}` | Status do pedido | Confirmado |
| `{{payment_method}}` | Forma de pagamento | MBWay |
| `{{payment_status}}` | Status do pagamento | Pago |
| `{{order_items}}` | Lista de produtos (HTML) | Tabela formatada |
| `{{order_subtotal}}` | Subtotal | €25.50 |
| `{{order_discount}}` | Desconto aplicado | €2.00 |
| `{{order_total}}` | Valor total | €23.50 |

### 🚚 Entrega

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{delivery_address}}` | Endereço completo | Rua Example, 123, 1000-000 Lisboa |
| `{{delivery_type}}` | Tipo de entrega | Entrega / Levantamento |
| `{{delivery_time_estimate}}` | Tempo estimado | 30-45 minutos |
| `{{delivery_fee}}` | Taxa de entrega | €2.50 |

### 🏪 Loja

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{store_name}}` | Nome da loja | SushiWorld |
| `{{store_logo_url}}` | URL do logo | https://... |
| `{{store_whatsapp}}` | WhatsApp | +351 912 345 678 |
| `{{store_instagram}}` | Instagram | @sushiworld |
| `{{store_support_email}}` | Email de suporte | pedidos@sushiworld.pt |

### 🖼️ Mídia

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{hero_image_url}}` | Imagem principal | https://... |
| `{{promo_gif_url}}` | GIF promocional | https://... |
| `{{product_image_url}}` | Imagem do produto | https://... |

### 🔗 Outros

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{current_year}}` | Ano atual (automático) | 2024 |
| `{{tracking_url}}` | URL de rastreamento | https://... |
| `{{unsubscribe_url}}` | URL para descadastrar | https://... |

---

## 💻 Como Usar no Código

### 1. Importar a Função

```typescript
import { renderEmailTemplate, formatOrderVariables } from '@/lib/email-template-renderer';
```

### 2. Preparar Variáveis

#### Opção A: Manualmente

```typescript
const variables = {
  customer_name: 'João Silva',
  order_id: 'clx123abc',
  order_total: '€25.50',
  store_name: 'SushiWorld',
};
```

#### Opção B: Automaticamente (a partir de um pedido)

```typescript
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: { orderItems: true },
});

const settings = await prisma.settings.findFirst();

const variables = formatOrderVariables(order, settings);
```

### 3. Renderizar Template

```typescript
const templateHtml = `
  <h1>Olá {{customer_name}}!</h1>
  <p>Seu pedido {{order_id}} no valor de {{order_total}} foi confirmado.</p>
`;

const renderedHtml = renderEmailTemplate(templateHtml, variables);
```

### 4. Enviar Email

```typescript
await sendEmail({
  to: order.customerEmail,
  subject: 'Pedido Confirmado - {{order_number}}',
  html: renderedHtml,
});
```

---

## ✅ Validação de Templates

Você pode validar se um template contém variáveis válidas:

```typescript
import { validateTemplateVariables } from '@/lib/email-template-renderer';

const template = 'Olá {{customer_name}}, seu pedido {{invalid_var}} foi confirmado.';

const validation = validateTemplateVariables(template);

console.log(validation);
// {
//   valid: [{ key: 'customer_name', position: 5 }],
//   invalid: [{ key: 'invalid_var', position: 32 }]
// }
```

---

## 🎨 Template Pronto de Exemplo

Veja um template completo em:
- `src/lib/email-templates/order-confirmed.html`

Este template inclui:
- ✅ Design responsivo
- ✅ Todas as variáveis do pedido
- ✅ Tabela de produtos formatada
- ✅ Informações de entrega
- ✅ Links de contato

---

## 🔧 Personalização Avançada

### Fallback para Variáveis Inexistentes

Por padrão, variáveis inexistentes são substituídas por string vazia. Você pode personalizar:

```typescript
const html = renderEmailTemplate(template, variables, {
  fallbackValue: 'N/A',  // Valor padrão
  preserveUnknown: true  // Manter {{variavel}} se não existir
});
```

### Adicionar Variáveis Customizadas

```typescript
const customVariables = {
  ...formatOrderVariables(order, settings),
  promo_code: 'DESCONTO10',
  referral_link: 'https://sushiworld.pt/ref/abc123',
};

const html = renderEmailTemplate(template, customVariables);
```

---

## 🚨 Segurança

✅ **Seguro:**
- Apenas substituição de texto
- Não executa código
- Não permite acesso a objetos globais
- Escapa automaticamente HTML perigoso

❌ **NÃO suporta:**
- Lógica condicional (if/else)
- Loops (for/while)
- Funções JavaScript
- Acesso a variáveis globais

---

## 📚 Exemplos de Uso

### Email de Confirmação de Pedido

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Pedido Confirmado!</h1>
  <p>Olá {{customer_name}},</p>
  <p>Seu pedido #{{order_number}} foi confirmado!</p>

  <h2>Detalhes:</h2>
  {{order_items}}

  <p><strong>Total: {{order_total}}</strong></p>

  <p>Previsão de entrega: {{delivery_time_estimate}}</p>
  <p>Endereço: {{delivery_address}}</p>

  <p>Obrigado,<br>{{store_name}}</p>
</body>
</html>
```

### Email de Promoção

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Promoção Especial, {{customer_name}}! 🎉</h1>

  <img src="{{promo_gif_url}}" alt="Promoção">

  <p>Use o código <strong>{{promo_code}}</strong> e ganhe desconto!</p>

  <a href="{{tracking_url}}">Ver ofertas</a>

  <hr>
  <p style="font-size: 12px;">
    © {{current_year}} {{store_name}}<br>
    <a href="{{unsubscribe_url}}">Descadastrar</a>
  </p>
</body>
</html>
```

---

## 🎯 Checklist de Boas Práticas

- ✅ Sempre teste o template com dados reais
- ✅ Use `validateTemplateVariables()` para verificar variáveis
- ✅ Forneça valores padrão para variáveis opcionais
- ✅ Mantenha templates simples e legíveis
- ✅ Use HTML semântico e acessível
- ✅ Teste em diferentes clientes de email (Gmail, Outlook, etc.)
- ✅ Inclua sempre link de descadastramento
- ✅ Use imagens hospedadas externamente (não anexadas)

---

## 📞 Suporte

Se você encontrar problemas ou tiver dúvidas:
1. Verifique a lista de variáveis disponíveis
2. Use `validateTemplateVariables()` para debugar
3. Consulte os exemplos em `src/lib/email-templates/`

---

**Desenvolvido com ❤️ por Claude Code**

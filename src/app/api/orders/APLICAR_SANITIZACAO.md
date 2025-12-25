# ✅ INSTRUÇÕES PARA APLICAR SANITIZAÇÃO NA API DE PEDIDOS

## Arquivo: src/app/api/orders/route.ts

### 1. Adicionar imports no topo do arquivo (após as linhas 1-6):

```typescript
import { validateEmail, sanitizeEmail } from '@/lib/email-validation';
import { sanitize, validate } from '@/lib/input-sanitization';
```

### 2. Substituir a validação básica (linha 28-34) por:

```typescript
// ✅ SANITIZAR E VALIDAR INPUTS
const sanitizedCustomerName = sanitize.name(customerName);
const sanitizedCustomerSurname = customerSurname ? sanitize.name(customerSurname) : '';
const sanitizedCustomerEmail = sanitizeEmail(customerEmail);
const sanitizedCustomerPhone = sanitize.phone(customerPhone);
const sanitizedAddress = sanitize.address(address);
const sanitizedNif = nif ? sanitize.nif(nif) : null;
const sanitizedObservations = observations ? sanitize.observations(observations) : null;

// Validação básica
if (!sanitizedCustomerName || !sanitizedCustomerEmail || !sanitizedCustomerPhone || !sanitizedAddress || !items || items.length === 0) {
  return NextResponse.json(
    { error: 'Dados incompletos para criar o pedido.' },
    { status: 400 }
  );
}

// ✅ VALIDAR EMAIL
const emailValidation = validateEmail(sanitizedCustomerEmail);
if (!emailValidation.valid) {
  return NextResponse.json(
    { error: emailValidation.error || 'Email inválido' },
    { status: 400 }
  );
}

// ✅ VALIDAR VALORES MONETÁRIOS
if (!validate.isSafeNumber(subtotal) || !validate.isSafeNumber(deliveryFee)) {
  return NextResponse.json(
    { error: 'Valores monetários inválidos' },
    { status: 400 }
  );
}

const sanitizedSubtotal = sanitize.monetaryValue(subtotal);
const sanitizedDeliveryFee = sanitize.monetaryValue(deliveryFee);
```

### 3. Substituir a linha 233 (criação do pedido) por:

```typescript
const order = await prisma.order.create({
  data: {
    customerName: `${sanitizedCustomerName} ${sanitizedCustomerSurname}`.trim(),
    customerEmail: sanitizedCustomerEmail,
    customerPhone: sanitizedCustomerPhone,
    deliveryAddress: {
      fullAddress: sanitizedAddress,
      nif: sanitizedNif,
    },
    subtotal: itemsSubtotal,
    discount: discountAmount,
    vatAmount,
    total,
    deliveryFee: actualDeliveryFee,
    deliveryAreaId: deliveryAreaId,
    deliveryDecisionLog: deliveryDecisionLog || Prisma.JsonNull,
    observations: sanitizedObservations,
    paymentMethod: paymentMethod || 'CASH',
    status: 'PENDING',
    promotionId: validPromotionId,
    orderItems: {
      create: items.map((item: { productId: string; name: string; quantity: number; price: number; options?: any }) => ({
        productId: item.productId,
        name: sanitize.text(item.name, 200), // ✅ Sanitizar nome do produto
        quantity: Math.max(1, Math.min(100, parseInt(String(item.quantity)))), // ✅ Limitar quantidade (1-100)
        priceAtTime: sanitize.monetaryValue(item.price), // ✅ Sanitizar preço
        selectedOptions: item.options || Prisma.JsonNull,
      })),
    },
  },
  include: {
    orderItems: true,
  },
});
```

## IMPORTANTE

Após fazer essas alterações:
1. Teste a criação de pedidos
2. Verifique que emails inválidos são rejeitados
3. Confirme que caracteres especiais são removidos
4. Valide que valores monetários negativos são bloqueados

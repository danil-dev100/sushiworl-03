# 🧪 TESTE DE POLLING - DEBUG COMPLETO

## 📋 Instruções para Teste

### 1. Acesse a página
```
http://localhost:3000/admin/pedidos
```

### 2. Abra o Console (F12)
- Pressione F12
- Clique na aba "Console"
- Limpe o console (ícone 🚫)

### 3. Na aba "Hoje"
Verifique os logs:
```
🔄 [ClientWrapper] PROPS RECEBIDAS: {
  currentStatus: null,           ← DEVE ser null
  currentStatusType: "object",
  currentStatusIsNull: true,
  currentStatusIsPending: false,
  initialDataCount: X
}

📊 [ClientWrapper] DADOS DO HOOK: {
  pollingOrdersCount: Y,         ← Total de pedidos PENDING
  pollingIds: ["abc123", ...]
}

🔀 [ClientWrapper] MESCLANDO DADOS: {
  currentStatus: null,
  isPending: false,              ← DEVE ser false
  pollingCount: Y,
  serverCount: X
}

🔵 [ClientWrapper] ℹ️ USANDO SERVER para default (hoje): {
  serverCount: X,
  serverIds: ["xyz789", ...]
}
```

### 4. Clique em "Pendentes"
A URL deve mudar para:
```
http://localhost:3000/admin/pedidos?status=pending
```

E os logs devem mostrar:
```
🔄 [ClientWrapper] PROPS RECEBIDAS: {
  currentStatus: "pending",      ← ⚠️ DEVE ser "pending"
  currentStatusType: "string",
  currentStatusIsNull: false,
  currentStatusIsPending: true,  ← ⚠️ DEVE ser true
  initialDataCount: X
}

📊 [ClientWrapper] DADOS DO HOOK: {
  pollingOrdersCount: Y,         ← Total de pedidos PENDING
  pollingIds: ["abc123", ...]
}

🔀 [ClientWrapper] MESCLANDO DADOS: {
  currentStatus: "pending",
  isPending: true,               ← ⚠️ DEVE ser true
  pollingCount: Y,
  serverCount: X
}

🟢 [ClientWrapper] ✅ USANDO POLLING para Pendentes: {
  pollingCount: Y,               ← ⚠️ DEVE ter pedidos aqui
  pollingIds: ["abc123", ...]
}

🖥️ [OrdersPageContent] Renderizando: {
  ordersCount: Y,                ← ⚠️ DEVE mostrar pedidos
  ids: ["abc123", ...]
}
```

### 5. Verifique a Lista
- ✅ DEVE aparecer banner verde
- ✅ DEVE mostrar "Fonte de dados: POLLING"
- ✅ DEVE listar os pedidos
- ❌ NÃO deve estar vazia

## 🔍 Diagnóstico

### Se na aba "Pendentes" os logs mostram:
```
currentStatus: null  ← ❌ PROBLEMA!
isPending: false     ← ❌ PROBLEMA!
```

**CAUSA:** O `currentStatus` não está sendo passado corretamente do page.tsx

**SOLUÇÃO:** Verificar src/app/admin/pedidos/page.tsx linha ~210

### Se na aba "Pendentes" os logs mostram:
```
currentStatus: "pending"  ← ✅ OK
isPending: true           ← ✅ OK
pollingCount: 0           ← ❌ PROBLEMA!
```

**CAUSA:** O hook de polling não está retornando pedidos

**SOLUÇÃO:** Verificar /api/admin/orders/pending

### Se na aba "Pendentes" os logs mostram:
```
currentStatus: "pending"  ← ✅ OK
isPending: true           ← ✅ OK
pollingCount: 2           ← ✅ OK
USANDO POLLING            ← ✅ OK
ordersCount: 2            ← ✅ OK
```

**MAS a lista está vazia:**

**CAUSA:** Problema no OrdersTable ou componentes de UI

**SOLUÇÃO:** Verificar src/components/admin/orders/OrdersTable.tsx

## 📝 Me Envie

Copie e cole os logs do console aqui:

```
[COLE OS LOGS AQUI]
```

E envie um print da tela mostrando:
- Banner verde
- Aba "Pendentes" ativa
- Lista de pedidos (vazia ou com dados)

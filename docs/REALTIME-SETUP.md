# 🚀 SETUP REALTIME - SUPABASE

## ✅ IMPLEMENTAÇÃO CONCLUÍDA

Foi criado um sistema de atualização em tempo real usando **Supabase Realtime** (WebSocket).

### 📦 Arquivos Criados/Modificados

1. **NOVO:** `src/hooks/useOrdersRealtime.ts`
   - Hook que escuta INSERT/UPDATE na tabela `orders`
   - Notificações sonoras e visuais
   - Merge inteligente (sem duplicação)

2. **MODIFICADO:** `src/app/admin/pedidos/PedidosClientWrapper.tsx`
   - Usa `useOrdersRealtime` como fonte principal
   - `useOrderPolling` mantido como fallback silencioso
   - Filtra apenas PENDING para aba "Pendentes"

---

## ⚙️ CONFIGURAÇÃO NECESSÁRIA NO SUPABASE

### 1️⃣ Habilitar Realtime na Tabela `orders`

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Database** → **Replication**
3. Encontre a tabela `orders`
4. **ATIVE** o Realtime para a tabela

**Ou execute via SQL:**

```sql
-- Habilitar Realtime para a tabela orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

---

### 2️⃣ Configurar RLS (Row Level Security) - CRÍTICO! 🔒

**⚠️ IMPORTANTE:** O hook usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave pública).
Por isso, você **DEVE** configurar RLS para proteger dados sensíveis.

#### Opção A: Admin Pode Ver Todos os Pedidos (RECOMENDADO)

```sql
-- 1. Habilitar RLS na tabela orders (se ainda não estiver)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Admins podem SELECT todos os pedidos
CREATE POLICY "Admins podem ver todos os pedidos"
ON orders
FOR SELECT
TO authenticated
USING (
  -- Verifica se usuário é admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 3. Policy: Clientes podem ver APENAS seus próprios pedidos
CREATE POLICY "Clientes veem apenas seus pedidos"
ON orders
FOR SELECT
TO authenticated
USING (
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 4. Policy: Qualquer pessoa autenticada pode INSERT (criar pedido)
CREATE POLICY "Qualquer pessoa pode criar pedidos"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Policy: Apenas admins podem UPDATE
CREATE POLICY "Admins podem atualizar pedidos"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
```

#### Opção B: Sem Autenticação (CUIDADO - só para testes)

```sql
-- ⚠️ USAR APENAS EM DESENVOLVIMENTO LOCAL
-- NÃO USAR EM PRODUÇÃO!

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir SELECT público"
ON orders
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Permitir INSERT público"
ON orders
FOR INSERT
TO anon
WITH CHECK (true);
```

---

### 3️⃣ Verificar se ANON KEY Tem Permissões

1. Vá em **Settings** → **API**
2. Verifique que `anon` / `public` tem acesso à tabela `orders`
3. Se você configurou RLS corretamente, o Realtime vai funcionar automaticamente

---

## 🧪 COMO TESTAR

### Teste 1: Verificar Conexão

1. Acesse: `http://localhost:3000/admin/pedidos?status=pending`
2. Abra o Console (F12)
3. Procure por:
   ```
   [REALTIME] 🚀 Conectando ao Supabase Realtime...
   [REALTIME] Status da conexão: SUBSCRIBED
   [REALTIME] ✅ Conectado com sucesso!
   ```
4. O banner verde deve mostrar: **🟢 CONECTADO**

### Teste 2: Novo Pedido em Tempo Real

1. **Deixe a aba Pendentes aberta**
2. **Em outra aba/navegador**, crie um novo pedido
3. **EXPECTATIVA:** Pedido deve aparecer **INSTANTANEAMENTE** (sem F5)
4. Logs esperados:
   ```
   [REALTIME] 📨 Evento INSERT recebido
   [REALTIME] ➕ Adicionando pedido: abc123
   [REALTIME] 🆕 Novo pedido detectado: abc123
   [REALTIME] 🔊 Tocando som...
   ```

### Teste 3: Atualização de Status

1. Com pedido PENDING na tela
2. Aceite/Rejeite o pedido
3. **EXPECTATIVA:** Status muda instantaneamente, som para
4. Logs esperados:
   ```
   [REALTIME] 📨 Evento UPDATE recebido
   [REALTIME] 📝 Atualizando pedido: abc123
   [REALTIME] 🔇 Pedido aceito/rejeitado, verificando som...
   ```

---

## 🔍 TROUBLESHOOTING

### ❌ "Conexão: 🔴 DESCONECTADO"

**Causa:** Realtime não habilitado na tabela ou RLS bloqueando.

**Solução:**
1. Execute o SQL da seção 1️⃣
2. Verifique RLS (seção 2️⃣)
3. Confira logs no console:
   ```
   [REALTIME] Status da conexão: CHANNEL_ERROR
   ```

### ❌ Pedidos não aparecem

**Causa:** RLS bloqueando o SELECT.

**Solução:**
1. Execute SQL da seção 2️⃣
2. No Supabase Dashboard → **Database** → **Policies**
3. Verifique se existe policy de SELECT para `orders`

### ❌ Duplicação de pedidos

**Causa:** Polling e Realtime adicionando o mesmo pedido.

**Solução:**
Não deve acontecer! O merge usa ID único. Se acontecer, me avise.

---

## 📊 FLUXO COMPLETO

```
1. [CLIENT] Abre /admin/pedidos?status=pending
2. [SERVER] Renderiza initialData com pedidos do banco
3. [CLIENT] useOrdersRealtime conecta ao Supabase
4. [SUPABASE] WebSocket estabelecido → Status: SUBSCRIBED
5. [CLIENTE EXTERNO] Cria novo pedido
6. [SUPABASE] Dispara evento INSERT via WebSocket
7. [CLIENT] Hook recebe payload.new
8. [CLIENT] Adiciona pedido ao state (sem duplicar)
9. [CLIENT] Dispara som, toast, browser notification
10. [UI] Atualiza INSTANTANEAMENTE (sem polling, sem F5)
```

---

## 🔐 SEGURANÇA - CHECKLIST FINAL

- [ ] RLS habilitado na tabela `orders`
- [ ] Policy de SELECT criada (admins ou público)
- [ ] Policy de INSERT criada
- [ ] Policy de UPDATE criada (apenas admins)
- [ ] **NUNCA** expor `service_role` key no cliente
- [ ] Usar apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Testar com diferentes usuários (admin vs cliente)

---

## 🎯 BENEFÍCIOS

✅ **Atualização instantânea** (0-100ms vs 3s do polling)
✅ **Sem refresh** (F5)
✅ **Sem duplicação** (merge inteligente)
✅ **Compatível com Supabase Free** (10.000 conexões simultâneas)
✅ **Polling como fallback** (se WebSocket cair)
✅ **Seguro** (RLS protege dados sensíveis)

---

## 📝 PRÓXIMOS PASSOS

1. **AGORA:** Configure RLS no Supabase (seção 2️⃣)
2. **TESTE:** Crie pedido e veja aparecer instantaneamente
3. **DEPOIS:** Remova logs de debug do código
4. **DEPLOY:** Faça commit e push para Vercel

---

**Data:** 2025-12-14
**Autor:** Claude Sonnet 4.5

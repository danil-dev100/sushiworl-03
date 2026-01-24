# 🔴 IMPORTANTE - Configuração do Banco de Dados

## ✅ Problema Resolvido Temporariamente

Os endpoints `/api/admin/orders/pending` e `/api/admin/dashboard` agora **funcionam corretamente**.

**Solução aplicada:** Os campos `isTest` e `isOnline` foram temporariamente comentados no schema do Prisma para que o sistema funcione mesmo sem esses campos no banco de dados.

## ⚠️ Funcionalidade Limitada

Sem os campos no banco, as seguintes funcionalidades **não estão disponíveis**:

1. **`isTest`** na tabela `Order` - Pedidos de teste não são filtrados do dashboard (todos aparecem nas métricas)
2. **`isOnline`** na tabela `Settings` - Toggle online/offline do restaurante não funciona

## ✅ Solução

Execute os seguintes arquivos SQL **no Supabase SQL Editor**:

### 1. Adicionar campo `isTest` à tabela Order

Arquivo: `ADD-ISTEST-COLUMN.sql`

```sql
-- Adicionar coluna isTest à tabela Order
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;

-- Verificar se foi criada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Order' AND column_name = 'isTest';
```

### 2. Adicionar campo `isOnline` à tabela Settings

Arquivo: `ADD-ISONLINE-COLUMN.sql`

```sql
-- Adicionar coluna isOnline à tabela Settings
ALTER TABLE "Settings"
ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT true;

-- Verificar se foi criada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Settings' AND column_name = 'isOnline';
```

## 📝 Como Executar

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole o SQL do arquivo `ADD-ISTEST-COLUMN.sql`
4. Clique em **Run** ou pressione `Ctrl + Enter`
5. Repita para `ADD-ISONLINE-COLUMN.sql`

## 🔄 Após Executar os SQLs

Depois de executar os SQLs no Supabase, você precisa:

1. **Descomentar os campos no schema** em `prisma/schema.prisma`:
   - Linha 259: `isTest          Boolean  @default(false)` (remover o `//`)
   - Linha 853: `isOnline      Boolean  @default(true)` (remover o `//`)

2. **Regenerar o Prisma Client**:

   ```bash
   npx prisma generate
   ```

3. **Descomentar os filtros `isTest`** nos seguintes arquivos:
   - `src/app/api/admin/dashboard/route.ts` (linhas comentadas com `// isTest: false`)
   - `src/app/api/admin/dashboard/charts/route.ts` (linhas comentadas com `// isTest: false`)

4. **Reiniciar o servidor de desenvolvimento**:

   ```bash
   npm run dev
   ```

## ⚠️ Sintomas Antes da Correção

~~- Dashboard fica em carregamento infinito~~
~~- Erro 500 ao acessar `/api/admin/dashboard`~~
~~- Erro 500 ao acessar `/api/admin/orders/pending`~~
~~- Console mostra erro: "column 'isTest' does not exist"~~

## ✅ Status Atual (Após Correção Temporária)

- ✅ Dashboard carrega dados reais
- ✅ Pedidos aparecem no painel admin
- ✅ Gráficos exibem informações do banco
- ✅ Não há erros 500 nos endpoints
- ⚠️ Pedidos de teste NÃO são filtrados (aparecem nas métricas)
- ⚠️ Toggle online/offline do restaurante NÃO funciona

---

**Última atualização:** 2025-12-15

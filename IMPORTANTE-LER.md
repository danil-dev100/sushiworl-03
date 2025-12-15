# 🔴 IMPORTANTE - Configuração do Banco de Dados

## Problema Atual

Os endpoints `/api/admin/orders/pending` e `/api/admin/dashboard` podem estar retornando erro **500 (Internal Server Error)** porque os seguintes campos ainda não existem fisicamente no banco de dados Supabase:

1. **`isTest`** na tabela `Order`
2. **`isOnline`** na tabela `Settings`

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

1. **Descomentar os filtros `isTest`** nos seguintes arquivos:
   - `src/app/api/admin/dashboard/route.ts` (linhas comentadas com `// isTest: false`)
   - `src/app/api/admin/dashboard/charts/route.ts` (linhas comentadas com `// isTest: false`)

2. **Reiniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## ⚠️ Sintomas de que o SQL ainda não foi executado

- Dashboard fica em carregamento infinito
- Erro 500 ao acessar `/api/admin/dashboard`
- Erro 500 ao acessar `/api/admin/orders/pending`
- Console mostra erro: "column 'isTest' does not exist"

## ✅ Confirmação de que funcionou

- Dashboard carrega dados reais
- Pedidos aparecem no painel admin
- Gráficos exibem informações do banco
- Não há erros 500 no console

---

**Última atualização:** 2025-12-15

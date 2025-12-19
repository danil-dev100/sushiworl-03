# 🚨 HOTFIX - Aplicar Migration do Banco de Dados

## ❌ Erro Atual

```
Application error: a server-side exception has occurred
Digest: 905235614
```

**Causa:** O código está tentando acessar os campos `priority` e `deliveryDecisionLog` que ainda não existem no banco de dados.

---

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Via Prisma (Recomendado)

```bash
# 1. Aplicar schema ao banco de dados
npx prisma db push

# 2. Regenerar Prisma Client
npx prisma generate

# 3. Reiniciar aplicação
vercel --prod
```

### Opção 2: Via SQL Direto (Se Prisma não funcionar)

1. Acesse o painel do seu banco de dados (Vercel Postgres/Supabase/etc)

2. Execute o SQL em [`migrations/add_priority_and_decision_log.sql`](migrations/add_priority_and_decision_log.sql):

```sql
-- Adicionar campo priority
ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

-- Adicionar campo deliveryDecisionLog
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "deliveryDecisionLog" JSONB;

-- Criar índice
CREATE INDEX IF NOT EXISTS "DeliveryArea_priority_idx"
ON "DeliveryArea"("priority" DESC);
```

3. Após executar o SQL, faça redeploy no Vercel:

```bash
git commit --allow-empty -m "chore: trigger redeploy após migration"
git push
```

---

## 🔍 VERIFICAR SE MIGRATION FOI APLICADA

### Via Prisma Studio:

```bash
npx prisma studio
```

Verifique se:
- Tabela `DeliveryArea` tem coluna `priority`
- Tabela `Order` tem coluna `deliveryDecisionLog`

### Via SQL:

```sql
-- Verificar coluna priority
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'DeliveryArea' AND column_name = 'priority';

-- Verificar coluna deliveryDecisionLog
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Order' AND column_name = 'deliveryDecisionLog';
```

**Resultado esperado:**
- `priority` | `integer` | `0`
- `deliveryDecisionLog` | `jsonb` | `NULL`

---

## 📝 PASSO-A-PASSO COMPLETO (Vercel)

### 1. Configurar DATABASE_URL localmente

Crie/edite `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/database?sslmode=require"
```

### 2. Aplicar Migration

```bash
npx prisma db push
```

**Saída esperada:**
```
✔ Generated Prisma Client
The following migration(s) have been applied:
  - Added required column priority to DeliveryArea
  - Added column deliveryDecisionLog to Order
```

### 3. Commit do Schema Atualizado

```bash
git add prisma/schema.prisma
git commit -m "chore: confirmar schema com priority e deliveryDecisionLog"
git push
```

### 4. Aplicar no Banco de Produção

#### Via Vercel CLI:

```bash
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npx prisma db push
```

#### Via Painel Vercel:

1. Vá em **Storage** → Seu banco de dados
2. Acesse **Query**
3. Cole o SQL do arquivo [`migrations/add_priority_and_decision_log.sql`](migrations/add_priority_and_decision_log.sql)
4. Execute

### 5. Redeploy da Aplicação

Vercel detecta mudanças automaticamente, mas para forçar:

```bash
vercel --prod
```

---

## 🧪 TESTAR APÓS MIGRATION

1. Acesse `/admin/configuracoes/areas-entrega`
2. Verifique que a página carrega sem erros
3. Crie uma nova área e defina prioridade
4. Use o **Simulador de Endereço** para testar
5. Faça um pedido de teste e verifique que `deliveryDecisionLog` foi salvo

---

## 🚨 ROLLBACK (Se necessário)

```sql
-- Remover campos adicionados
ALTER TABLE "DeliveryArea" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "deliveryDecisionLog";

-- Remover índice
DROP INDEX IF EXISTS "DeliveryArea_priority_idx";
```

Depois:

```bash
git revert HEAD
git push
```

---

## 📞 SUPORTE

Se o erro persistir:

1. Verifique logs da Vercel: `vercel logs`
2. Confirme que DATABASE_URL está configurado em Production
3. Teste localmente primeiro: `npm run dev`
4. Verifique Prisma Client: `npx prisma validate`

---

## ✅ CHECKLIST

- [ ] DATABASE_URL configurado
- [ ] `npx prisma db push` executado com sucesso
- [ ] Campos `priority` e `deliveryDecisionLog` existem no banco
- [ ] Redeploy realizado
- [ ] Aplicação carrega sem erros
- [ ] Simulador de endereço funciona
- [ ] Pedido de teste salva deliveryDecisionLog

---

**Tempo estimado:** 5-10 minutos
**Risco:** Baixo (campos têm defaults seguros)

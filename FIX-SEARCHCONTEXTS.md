# FIX: Erro DeliveryArea.searchContexts

## Problema
O campo `searchContexts` está no schema do Prisma mas não existe no banco de dados, causando erro na página de áreas de entrega.

## Solução Rápida (RECOMENDADA)

### Método 1: Manual (Mais Simples)

1. **Pare o servidor dev** (Ctrl+C no terminal onde está rodando)
2. **Aguarde alguns segundos** para o processo liberar os arquivos
3. **Regenere o Prisma Client:**
   ```bash
   npx prisma generate
   ```
4. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

### Método 2: Script Automatizado

Execute o script que faz todo o processo:
```bash
node scripts/force-prisma-generate.js
```
(O script vai pausar e pedir para você parar o servidor antes de continuar)

## Solução Permanente (Execute quando possível)

Depois que a aplicação estiver funcionando, você pode adicionar a coluna ao banco de dados:

### Opção 1: Via Supabase Dashboard (Mais Fácil)
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute o script:
```sql
ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "searchContexts" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

### Opção 2: Via Script Node.js
1. Instale o pacote `pg` (se ainda não tiver):
```bash
npm install pg
```

2. Execute o script:
```bash
node scripts/run-migration.js
```

### Opção 3: Via Prisma (se o pooler permitir)
```bash
npx prisma db push
```

## Depois de Adicionar a Coluna

1. **Descomente o campo no schema:**
   - Abra `prisma/schema.prisma`
   - Procure por `searchContexts` (linha ~327)
   - Remova os `//` dos comentários

2. **Regenere o Prisma Client:**
```bash
npx prisma generate
```

3. **Reinicie o servidor:**
```bash
npm run dev
```

## Status Atual
✅ Campo comentado no schema (aplicação funciona sem o campo)
⏳ Aguardando adição da coluna no banco de dados
📝 Scripts de migration criados em `scripts/`

## Arquivos Relacionados
- `prisma/schema.prisma` - Schema com campo comentado
- `scripts/add-search-contexts-column.sql` - SQL para adicionar coluna
- `scripts/run-migration.js` - Script Node.js para executar migration

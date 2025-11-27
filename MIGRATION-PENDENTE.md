# ⚠️ MIGRATION PENDENTE - CompanySettings

## Status Atual

O modelo `CompanySettings` foi adicionado ao schema do Prisma, mas a migration ainda **NÃO foi executada** no banco de dados.

## O que precisa ser feito

### 1. Parar todos os servidores Next.js e processos Node

```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill node
```

### 2. Executar a migration

```bash
npx prisma migrate dev --name add_company_settings
```

### 3. Verificar se funcionou

```bash
npx prisma studio
```

Você deverá ver a tabela `CompanySettings` no Prisma Studio.

### 4. Remover os comentários @ts-ignore

Após a migration ser bem-sucedida, remova os comentários `@ts-ignore` do arquivo:
- `src/app/api/admin/settings/printer/route.ts`

## Problemas Conhecidos

### Erro: EPERM operation not permitted

Se você receber este erro ao tentar executar `prisma generate`:

```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp' -> 'query_engine-windows.dll.node'
```

**Solução:**
1. Pare TODOS os servidores Next.js
2. Feche o VSCode
3. Reabra o VSCode
4. Execute novamente: `npx prisma generate`

### Erro: companySettings does not exist

Este é o erro atual porque a migration não foi executada ainda. Normal!

## Após a Migration

O sistema de configurações de impressão estará **100% funcional**:

✅ Editor com drag-and-drop
✅ Preview em tempo real
✅ Salvamento no banco de dados
✅ API funcionando completamente

## Acesso

Após executar a migration, acesse:

```
http://localhost:3000/admin/configuracoes/impressora
```

---

**Criado em:** 27/11/2024
**Commit relacionado:** fix: Corrige erros de importação e compatibilidade com Prisma

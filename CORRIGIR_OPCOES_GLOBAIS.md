# 🔧 Correção: Opções Globais Não Salvam

## 📋 Problema Identificado

As opções globais mostram mensagem de sucesso mas não aparecem ao recarregar porque **as tabelas não existem no banco de dados Supabase**.

---

## ✅ Solução: Executar SQL no Supabase

### 1️⃣ Acessar Supabase SQL Editor

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `sushiworld_3`
3. No menu lateral esquerdo, clique em **"SQL Editor"**
4. Clique em **"New query"** (Nova consulta)

### 2️⃣ Copiar e Executar o SQL

Copie **TODO** o conteúdo do arquivo abaixo e cole no editor SQL:

📄 **Arquivo**: `prisma/migrations/create_global_options_tables.sql`

Ou copie daqui:

```sql
-- ========================================
-- CRIAR TABELAS DE OPÇÕES GLOBAIS
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- Criar ENUM para tipo de opção (se não existir)
DO $$ BEGIN
    CREATE TYPE "OptionType" AS ENUM ('REQUIRED', 'OPTIONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar ENUM para onde exibir (se não existir)
DO $$ BEGIN
    CREATE TYPE "DisplayAt" AS ENUM ('SITE', 'CART');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar ENUM para tipo de atribuição (se não existir)
DO $$ BEGIN
    CREATE TYPE "AssignmentType" AS ENUM ('SITE_WIDE', 'CATEGORY', 'PRODUCT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela GlobalOption (se não existir)
CREATE TABLE IF NOT EXISTS "GlobalOption" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" "OptionType" NOT NULL DEFAULT 'OPTIONAL',
    "description" VARCHAR(150),
    "displayAt" "DisplayAt" NOT NULL DEFAULT 'CART',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalOption_pkey" PRIMARY KEY ("id")
);

-- Criar tabela GlobalOptionChoice (se não existir)
CREATE TABLE IF NOT EXISTS "GlobalOptionChoice" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalOptionChoice_pkey" PRIMARY KEY ("id")
);

-- Criar tabela GlobalOptionAssignment (se não existir)
CREATE TABLE IF NOT EXISTS "GlobalOptionAssignment" (
    "id" TEXT NOT NULL,
    "globalOptionId" TEXT NOT NULL,
    "assignmentType" "AssignmentType" NOT NULL,
    "targetId" TEXT,
    "minSelection" INTEGER NOT NULL DEFAULT 0,
    "maxSelection" INTEGER NOT NULL DEFAULT 1,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalOptionAssignment_pkey" PRIMARY KEY ("id")
);

-- Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS "GlobalOption_isActive_idx" ON "GlobalOption"("isActive");
CREATE INDEX IF NOT EXISTS "GlobalOptionChoice_optionId_idx" ON "GlobalOptionChoice"("optionId");
CREATE INDEX IF NOT EXISTS "GlobalOptionAssignment_globalOptionId_idx" ON "GlobalOptionAssignment"("globalOptionId");
CREATE INDEX IF NOT EXISTS "GlobalOptionAssignment_assignmentType_idx" ON "GlobalOptionAssignment"("assignmentType");
CREATE INDEX IF NOT EXISTS "GlobalOptionAssignment_targetId_idx" ON "GlobalOptionAssignment"("targetId");

-- Criar chaves estrangeiras (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'GlobalOptionChoice_optionId_fkey'
    ) THEN
        ALTER TABLE "GlobalOptionChoice"
        ADD CONSTRAINT "GlobalOptionChoice_optionId_fkey"
        FOREIGN KEY ("optionId")
        REFERENCES "GlobalOption"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'GlobalOptionAssignment_globalOptionId_fkey'
    ) THEN
        ALTER TABLE "GlobalOptionAssignment"
        ADD CONSTRAINT "GlobalOptionAssignment_globalOptionId_fkey"
        FOREIGN KEY ("globalOptionId")
        REFERENCES "GlobalOption"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Criar constraint UNIQUE para assignments (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'GlobalOptionAssignment_globalOptionId_assignmentType_targetId_key'
    ) THEN
        ALTER TABLE "GlobalOptionAssignment"
        ADD CONSTRAINT "GlobalOptionAssignment_globalOptionId_assignmentType_targetId_key"
        UNIQUE ("globalOptionId", "assignmentType", "targetId");
    END IF;
END $$;

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Verificar se as tabelas foram criadas
SELECT
    'GlobalOption' as table_name,
    COUNT(*) as total_records
FROM "GlobalOption"
UNION ALL
SELECT
    'GlobalOptionChoice',
    COUNT(*)
FROM "GlobalOptionChoice"
UNION ALL
SELECT
    'GlobalOptionAssignment',
    COUNT(*)
FROM "GlobalOptionAssignment";

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Tabelas de Opções Globais criadas/verificadas com sucesso!';
END $$;
```

### 3️⃣ Executar a Query

1. Cole todo o SQL no editor
2. Clique em **"RUN"** (Executar) no canto inferior direito
3. Aguarde a execução (deve levar 2-5 segundos)

### 4️⃣ Verificar Resultado

Você deve ver uma mensagem similar a:

```
✅ Success. No rows returned

E uma tabela mostrando:
table_name                | total_records
--------------------------|---------------
GlobalOption             | 0
GlobalOptionChoice       | 0
GlobalOptionAssignment   | 0
```

Isso significa que as tabelas foram criadas com sucesso!

---

## 🧪 Testar

Após executar o SQL:

1. **Volte ao admin**: `http://localhost:3000/admin/cardapio/opcoes`
2. **Clique em "Nova Opção"**
3. **Preencha**:
   - Nome: `Braseado`
   - Descrição: `Quer brasear o sushi? (aquecido)`
   - Tipo: `Opcional`
   - Exibir em: `Site (Popup)`
   - Escolhas:
     - `Sim` (€0.00) - Marcar como Padrão
     - `Não` (€0.00)
4. **Clique em "Criar"**
5. **Recarregue a página** (F5)
6. ✅ **A opção deve aparecer na lista!**

---

## 🎯 O Que Foi Corrigido

### Problema Original:
- Opções eram criadas mas não apareciam ao recarregar
- Tabelas `GlobalOption`, `GlobalOptionChoice` e `GlobalOptionAssignment` **não existiam** no banco de dados

### Solução:
- ✅ Criadas as 3 tabelas necessárias
- ✅ Criados os ENUMs (`OptionType`, `DisplayAt`, `AssignmentType`)
- ✅ Criados índices para performance
- ✅ Criadas chaves estrangeiras com `CASCADE DELETE`
- ✅ Criada constraint UNIQUE para evitar atribuições duplicadas

---

## 📊 Estrutura Criada

### Tabela: `GlobalOption`
Armazena as opções globais reutilizáveis.

**Campos:**
- `id`: Identificador único
- `name`: Nome da opção (ex: "Braseado")
- `type`: REQUIRED ou OPTIONAL
- `description`: Texto explicativo
- `displayAt`: SITE (popup) ou CART (descrição)
- `isPaid`: Se cobra valor adicional
- `basePrice`: Preço base da opção
- `isActive`: Se está ativa
- `sortOrder`: Ordem de exibição

### Tabela: `GlobalOptionChoice`
Armazena as escolhas de cada opção.

**Campos:**
- `id`: Identificador único
- `optionId`: Relacionamento com GlobalOption
- `name`: Nome da escolha (ex: "Sim", "Não")
- `price`: Preço adicional
- `isDefault`: Se é a escolha padrão
- `isActive`: Se está ativa
- `sortOrder`: Ordem de exibição

### Tabela: `GlobalOptionAssignment`
Armazena onde a opção será aplicada.

**Campos:**
- `id`: Identificador único
- `globalOptionId`: Relacionamento com GlobalOption
- `assignmentType`: SITE_WIDE, CATEGORY ou PRODUCT
- `targetId`: ID da categoria ou produto (null se SITE_WIDE)
- `minSelection`: Mínimo de escolhas
- `maxSelection`: Máximo de escolhas
- `allowMultiple`: Permitir múltiplas escolhas
- `sortOrder`: Ordem de exibição

---

## ❓ Dúvidas?

- Se aparecer erro "relation already exists" = tabelas já existem (tudo OK!)
- Se aparecer erro de permissão = verifique se está usando o projeto correto no Supabase
- Se ainda não funcionar = verifique se `DATABASE_URL` está configurada corretamente no `.env.local`

---

**Feito isso, as opções globais devem funcionar perfeitamente! 🎉**

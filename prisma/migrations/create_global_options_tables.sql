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

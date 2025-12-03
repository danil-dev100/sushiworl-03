-- ============================================
-- SCRIPT SQL PARA CRIAR SISTEMA DE OPÇÕES GLOBAIS
-- Execute este script no Supabase SQL Editor
-- ============================================
--
-- IMPORTANTE: Este script cria 3 tabelas e 1 enum
-- Tempo estimado de execução: 5-10 segundos
--
-- PASSO A PASSO:
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole TODO este script
-- 5. Clique em "Run" ou pressione Ctrl+Enter
-- 6. Aguarde a mensagem de sucesso
--
-- ============================================

-- 1. Criar enum para tipos de atribuição
CREATE TYPE "AssignmentType" AS ENUM ('SITE_WIDE', 'CATEGORY', 'PRODUCT');

-- 2. Criar tabela de opções globais (biblioteca reutilizável)
CREATE TABLE "GlobalOption" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalOption_pkey" PRIMARY KEY ("id")
);

-- Índice para buscar opções ativas
CREATE INDEX "GlobalOption_isActive_idx" ON "GlobalOption"("isActive");

-- 3. Criar tabela de escolhas das opções globais
CREATE TABLE "GlobalOptionChoice" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalOptionChoice_pkey" PRIMARY KEY ("id")
);

-- Índice para buscar escolhas por opção
CREATE INDEX "GlobalOptionChoice_optionId_idx" ON "GlobalOptionChoice"("optionId");

-- 4. Criar tabela de atribuições (onde aplicar as opções)
CREATE TABLE "GlobalOptionAssignment" (
    "id" TEXT NOT NULL,
    "globalOptionId" TEXT NOT NULL,
    "assignmentType" "AssignmentType" NOT NULL,
    "targetId" TEXT,  -- ID da categoria ou produto (null se SITE_WIDE)
    "minSelection" INTEGER NOT NULL DEFAULT 0,
    "maxSelection" INTEGER NOT NULL DEFAULT 1,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalOptionAssignment_pkey" PRIMARY KEY ("id")
);

-- Índices para buscar atribuições
CREATE INDEX "GlobalOptionAssignment_globalOptionId_idx" ON "GlobalOptionAssignment"("globalOptionId");
CREATE INDEX "GlobalOptionAssignment_assignmentType_idx" ON "GlobalOptionAssignment"("assignmentType");
CREATE INDEX "GlobalOptionAssignment_targetId_idx" ON "GlobalOptionAssignment"("targetId");

-- Constraint UNIQUE para evitar duplicatas
CREATE UNIQUE INDEX "GlobalOptionAssignment_globalOptionId_assignmentType_targetId_key"
    ON "GlobalOptionAssignment"("globalOptionId", "assignmentType", "targetId");

-- 5. Adicionar Foreign Keys com CASCADE
ALTER TABLE "GlobalOptionChoice"
    ADD CONSTRAINT "GlobalOptionChoice_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "GlobalOption"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "GlobalOptionAssignment"
    ADD CONSTRAINT "GlobalOptionAssignment_globalOptionId_fkey"
    FOREIGN KEY ("globalOptionId") REFERENCES "GlobalOption"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- 6. Mensagem de sucesso
SELECT
    '✅ Tabelas de Opções Globais criadas com sucesso!' AS status,
    '🎯 Próximo passo: Execute o script de teste' AS proxima_acao,
    'npx tsx scripts/create-test-option.ts' AS comando;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
--
-- O QUE FOI CRIADO:
-- ✅ Enum: AssignmentType (SITE_WIDE, CATEGORY, PRODUCT)
-- ✅ Tabela: GlobalOption (biblioteca de opções)
-- ✅ Tabela: GlobalOptionChoice (escolhas de cada opção)
-- ✅ Tabela: GlobalOptionAssignment (onde aplicar)
-- ✅ 5 Índices para performance
-- ✅ 1 Constraint UNIQUE para evitar duplicatas
-- ✅ 2 Foreign Keys com CASCADE
--
-- PRÓXIMOS PASSOS:
-- 1. No terminal do projeto, execute:
--    npx tsx scripts/create-test-option.ts
--
-- 2. Acesse o admin:
--    http://localhost:3000/admin/opcoes
--
-- 3. Veja a opção "Braseado" criada automaticamente
--
-- 4. Teste no cardápio:
--    http://localhost:3000/cardapio
--    Clique em "Adicionar" em qualquer produto
--    A opção "Braseado" deve aparecer no popup
--
-- ============================================

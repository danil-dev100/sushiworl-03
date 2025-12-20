-- Migration: Add checkoutAdditionalItems, additionalItems and printSettings to Settings
-- Date: 2025-12-20
-- Description: Adiciona campos para gerenciar itens adicionais do carrinho, checkout e configurações de impressão

-- 1. Adicionar campo printSettings à tabela Settings
ALTER TABLE "Settings"
ADD COLUMN IF NOT EXISTS "printSettings" JSONB;

-- 2. Adicionar campo additionalItems à tabela Settings
ALTER TABLE "Settings"
ADD COLUMN IF NOT EXISTS "additionalItems" JSONB;

-- 3. Adicionar campo checkoutAdditionalItems à tabela Settings
ALTER TABLE "Settings"
ADD COLUMN IF NOT EXISTS "checkoutAdditionalItems" JSONB;

-- 4. Comentários para documentação
COMMENT ON COLUMN "Settings"."printSettings" IS 'Configurações de layout de impressão do recibo: {layout: [], footerMessage: ""}';
COMMENT ON COLUMN "Settings"."additionalItems" IS 'Array JSON de itens opcionais que aparecem no carrinho: [{id, name, price, isActive}]';
COMMENT ON COLUMN "Settings"."checkoutAdditionalItems" IS 'Array JSON de itens opcionais que aparecem no checkout: [{id, name, price, isActive}]';

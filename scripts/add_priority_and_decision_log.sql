-- Migration: Add priority and deliveryDecisionLog fields
-- Date: 2025-12-19
-- Description: Adiciona campo priority para resolver áreas sobrepostas e deliveryDecisionLog para auditoria

-- 1. Adicionar campo priority à tabela DeliveryArea
ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

-- 2. Adicionar campo deliveryDecisionLog à tabela Order
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "deliveryDecisionLog" JSONB;

-- 3. Criar índice na prioridade para queries mais rápidas
CREATE INDEX IF NOT EXISTS "DeliveryArea_priority_idx" ON "DeliveryArea"("priority" DESC);

-- 4. Comentários para documentação
COMMENT ON COLUMN "DeliveryArea"."priority" IS 'Prioridade para resolver conflitos em áreas sobrepostas. Maior valor = maior prioridade.';
COMMENT ON COLUMN "Order"."deliveryDecisionLog" IS 'Log JSON da decisão de entrega: coordinates, displayName, confidence, method, matchedAreaName, priority, timestamp';

-- 5. Verificar se as colunas foram criadas com sucesso
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'DeliveryArea' AND column_name = 'priority'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Order' AND column_name = 'deliveryDecisionLog'
    ) THEN
        RAISE NOTICE 'Migration completed successfully!';
        RAISE NOTICE 'Added priority to DeliveryArea';
        RAISE NOTICE 'Added deliveryDecisionLog to Order';
    ELSE
        RAISE EXCEPTION 'Migration failed - columns not created';
    END IF;
END $$;

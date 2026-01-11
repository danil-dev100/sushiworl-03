-- ====================================================================
-- SCRIPT SQL: ATUALIZAR SCHEMA DE ÁREAS DE ENTREGA
-- ====================================================================
-- Este script adiciona:
-- 1. Modo de desenho por raio (POLYGON ou RADIUS)
-- 2. Campos para raio (centerLat, centerLng, radiusKm)
-- 3. Modo de preço por distância (pricePerKm)
-- 4. Novo tipo de entrega DISTANCE
-- ====================================================================

-- ====================================================================
-- 1. ADICIONAR NOVO TIPO DE ENTREGA: DISTANCE
-- ====================================================================

-- Verificar os tipos existentes
-- SELECT unnest(enum_range(NULL::DeliveryType));

-- Adicionar novo valor ao enum se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'DISTANCE'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DeliveryType')
    ) THEN
        ALTER TYPE "DeliveryType" ADD VALUE 'DISTANCE';
    END IF;
END
$$;

-- ====================================================================
-- 2. ADICIONAR COLUNAS PARA MODO DE DESENHO
-- ====================================================================

-- Adicionar coluna para modo de desenho (POLYGON ou RADIUS)
ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "drawMode" TEXT DEFAULT 'POLYGON' CHECK ("drawMode" IN ('POLYGON', 'RADIUS'));

-- ====================================================================
-- 3. ADICIONAR COLUNAS PARA RAIO
-- ====================================================================

-- Coordenadas do centro do círculo (apenas para modo RADIUS)
ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "centerLat" DOUBLE PRECISION;

ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "centerLng" DOUBLE PRECISION;

-- Raio em quilômetros (apenas para modo RADIUS)
ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "radiusKm" DOUBLE PRECISION;

-- ====================================================================
-- 4. ADICIONAR COLUNA PARA PREÇO POR KM
-- ====================================================================

-- Preço por quilômetro (apenas para deliveryType = DISTANCE)
ALTER TABLE "DeliveryArea"
ADD COLUMN IF NOT EXISTS "pricePerKm" DOUBLE PRECISION DEFAULT 0;

-- ====================================================================
-- 5. ADICIONAR ÍNDICES PARA PERFORMANCE
-- ====================================================================

-- Índice para busca por modo de desenho
CREATE INDEX IF NOT EXISTS "idx_delivery_area_draw_mode" ON "DeliveryArea"("drawMode");

-- Índice para busca por coordenadas (para cálculo de distância)
CREATE INDEX IF NOT EXISTS "idx_delivery_area_center" ON "DeliveryArea"("centerLat", "centerLng")
WHERE "centerLat" IS NOT NULL AND "centerLng" IS NOT NULL;

-- ====================================================================
-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ====================================================================

COMMENT ON COLUMN "DeliveryArea"."drawMode" IS 'Modo de desenho da área: POLYGON (polígono) ou RADIUS (círculo)';
COMMENT ON COLUMN "DeliveryArea"."centerLat" IS 'Latitude do centro do círculo (apenas para drawMode=RADIUS)';
COMMENT ON COLUMN "DeliveryArea"."centerLng" IS 'Longitude do centro do círculo (apenas para drawMode=RADIUS)';
COMMENT ON COLUMN "DeliveryArea"."radiusKm" IS 'Raio em quilômetros (apenas para drawMode=RADIUS)';
COMMENT ON COLUMN "DeliveryArea"."pricePerKm" IS 'Preço por quilômetro (apenas para deliveryType=DISTANCE)';

-- ====================================================================
-- CONCLUÍDO
-- ====================================================================
-- Execute este SQL no Supabase SQL Editor
--
-- Depois:
-- 1. O sistema permitirá 3 modos de cálculo de frete:
--    - FREE: Grátis (com ou sem valor mínimo)
--    - PAID: Valor fixo
--    - DISTANCE: Por quilômetro rodado
--
-- 2. O sistema permitirá 2 modos de desenho:
--    - POLYGON: Desenhar polígono no mapa (modo atual)
--    - RADIUS: Desenhar círculo com raio em km
--
-- Exemplo de uso:
-- - Área "Centro" com raio de 5km e frete grátis acima de €15
-- - Área "Periferia" com polígono e €0.50 por km
-- ====================================================================

-- Adicionar campos featuredOrder e bestSellerOrder à tabela Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bestSellerOrder" INTEGER;

-- Criar índices para melhorar performance das queries
CREATE INDEX IF NOT EXISTS "Product_featuredOrder_idx" ON "Product"("featuredOrder") WHERE "featuredOrder" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Product_bestSellerOrder_idx" ON "Product"("bestSellerOrder") WHERE "bestSellerOrder" IS NOT NULL;

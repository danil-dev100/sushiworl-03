-- =====================================================
-- SCRIPT PARA CORRIGIR ITENS ADICIONAIS
-- Execute no Supabase SQL Editor
-- Data: 2025-12-21
-- =====================================================

-- 1. Verificar dados atuais
SELECT
    id,
    "companyName",
    "additionalItems",
    "checkoutAdditionalItems",
    "openingHours"
FROM "Settings"
LIMIT 1;

-- 2. OPCIONAL: Limpar itens adicionais se quiser começar do zero
-- DESCOMENTE APENAS SE QUISER APAGAR TODOS OS ITENS

-- UPDATE "Settings"
-- SET
--     "additionalItems" = '[]'::jsonb,
--     "checkoutAdditionalItems" = '[]'::jsonb
-- WHERE id IS NOT NULL;

-- 3. Exemplo: Adicionar itens manualmente via SQL (se a interface não funcionar)
-- PERSONALIZE conforme necessário

UPDATE "Settings"
SET "additionalItems" = jsonb_build_array(
    jsonb_build_object(
        'id', '1',
        'name', 'Saco para Envio',
        'price', 0.50,
        'isActive', true,
        'isRequired', false
    ),
    jsonb_build_object(
        'id', '2',
        'name', 'Molho Extra',
        'price', 0.50,
        'isActive', true,
        'isRequired', false
    )
)
WHERE id IS NOT NULL;

-- 4. Exemplo: Itens do checkout
UPDATE "Settings"
SET "checkoutAdditionalItems" = jsonb_build_array(
    jsonb_build_object(
        'id', '1',
        'name', 'Gorjeta para Entregador',
        'price', 2.00,
        'isActive', true,
        'isRequired', false
    )
)
WHERE id IS NOT NULL;

-- 5. Verificar se foi atualizado
SELECT
    "additionalItems",
    "checkoutAdditionalItems"
FROM "Settings"
LIMIT 1;

-- =====================================================
-- EXPLICAÇÃO DOS CAMPOS:
-- =====================================================
-- id: Identificador único (pode ser número sequencial)
-- name: Nome do item que aparece para o cliente
-- price: Preço em euros (use ponto decimal, ex: 2.50)
-- isActive: true = aparece no site, false = escondido
-- isRequired: true = obrigatório (marcado e bloqueado)
--             false = opcional (cliente escolhe)
-- =====================================================

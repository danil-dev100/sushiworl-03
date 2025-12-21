-- Script para atualizar horários de funcionamento no Supabase
-- Atualiza de formato antigo (open/close) para novo formato (lunchOpen/dinnerOpen)
-- Data: 2025-12-21

-- IMPORTANTE: Execute este script no SQL Editor do Supabase

-- Atualizar horários de funcionamento com 2 períodos (almoço e jantar)
UPDATE "Settings"
SET "openingHours" = jsonb_build_object(
    'monday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'tuesday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'wednesday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'thursday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'friday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'saturday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    ),
    'sunday', jsonb_build_object(
        'lunchOpen', '12:00',
        'lunchClose', '15:00',
        'dinnerOpen', '19:00',
        'dinnerClose', '23:00',
        'closed', false
    )
)
WHERE id IS NOT NULL;

-- Verificar se foi atualizado corretamente
SELECT
    id,
    "openingHours"
FROM "Settings"
LIMIT 1;

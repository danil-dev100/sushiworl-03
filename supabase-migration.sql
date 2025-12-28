-- ============================================
-- PWA APP INSTALL TRACKING
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Criar ENUM para tipos de eventos
CREATE TYPE "AppInstallEvent" AS ENUM (
  'LINK_CLICKED',
  'APP_INSTALLED',
  'APP_OPENED'
);

-- Criar tabela AppInstallLog
CREATE TABLE "AppInstallLog" (
  "id" TEXT NOT NULL,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "userAgent" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "deviceType" TEXT,
  "eventType" "AppInstallEvent" NOT NULL DEFAULT 'LINK_CLICKED',
  "isConverted" BOOLEAN NOT NULL DEFAULT false,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "installedAt" TIMESTAMP(3),

  CONSTRAINT "AppInstallLog_pkey" PRIMARY KEY ("id")
);

-- Criar índices para melhor performance
CREATE INDEX "AppInstallLog_utmSource_utmMedium_idx" ON "AppInstallLog"("utmSource", "utmMedium");
CREATE INDEX "AppInstallLog_eventType_idx" ON "AppInstallLog"("eventType");
CREATE INDEX "AppInstallLog_clickedAt_idx" ON "AppInstallLog"("clickedAt");

-- Comentários para documentação
COMMENT ON TABLE "AppInstallLog" IS 'Tracking anônimo de instalações do PWA';
COMMENT ON COLUMN "AppInstallLog"."utmSource" IS 'Origem da campanha (ex: qr, banner, email)';
COMMENT ON COLUMN "AppInstallLog"."utmMedium" IS 'Meio da campanha (ex: android_app, ios_app)';
COMMENT ON COLUMN "AppInstallLog"."utmCampaign" IS 'Nome da campanha (ex: promo_natal)';
COMMENT ON COLUMN "AppInstallLog"."userAgent" IS 'User-Agent do navegador (para detectar SO/Browser)';
COMMENT ON COLUMN "AppInstallLog"."ipHash" IS 'Hash SHA-256 do IP (NUNCA o IP real)';
COMMENT ON COLUMN "AppInstallLog"."deviceType" IS 'Tipo de dispositivo: android, ios, desktop, unknown';
COMMENT ON COLUMN "AppInstallLog"."eventType" IS 'Tipo de evento: LINK_CLICKED, APP_INSTALLED, APP_OPENED';
COMMENT ON COLUMN "AppInstallLog"."isConverted" IS 'Se o usuário realmente instalou o app';
COMMENT ON COLUMN "AppInstallLog"."clickedAt" IS 'Quando o link foi clicado';
COMMENT ON COLUMN "AppInstallLog"."installedAt" IS 'Quando o app foi instalado (null se não instalou)';

-- ============================================
-- FUNÇÕES AUXILIARES (OPCIONAL)
-- ============================================

-- Função para gerar estatísticas agregadas
CREATE OR REPLACE FUNCTION get_app_install_stats(
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  total_clicks BIGINT,
  total_installs BIGINT,
  conversion_rate NUMERIC,
  by_device JSONB,
  by_utm_source JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICKED') AS clicks,
      COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED') AS installs
    FROM "AppInstallLog"
    WHERE
      (start_date IS NULL OR "clickedAt" >= start_date)
      AND (end_date IS NULL OR "clickedAt" <= end_date)
  ),
  device_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'device', "deviceType",
        'count', cnt
      )
    ) AS devices
    FROM (
      SELECT "deviceType", COUNT(*) AS cnt
      FROM "AppInstallLog"
      WHERE
        (start_date IS NULL OR "clickedAt" >= start_date)
        AND (end_date IS NULL OR "clickedAt" <= end_date)
      GROUP BY "deviceType"
    ) d
  ),
  utm_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'source', "utmSource",
        'count', cnt
      )
    ) AS sources
    FROM (
      SELECT "utmSource", COUNT(*) AS cnt
      FROM "AppInstallLog"
      WHERE
        "utmSource" IS NOT NULL
        AND (start_date IS NULL OR "clickedAt" >= start_date)
        AND (end_date IS NULL OR "clickedAt" <= end_date)
      GROUP BY "utmSource"
    ) u
  )
  SELECT
    s.clicks,
    s.installs,
    CASE
      WHEN s.clicks > 0 THEN ROUND((s.installs::NUMERIC / s.clicks::NUMERIC) * 100, 2)
      ELSE 0
    END,
    COALESCE(d.devices, '[]'::jsonb),
    COALESCE(u.sources, '[]'::jsonb)
  FROM stats s
  CROSS JOIN device_stats d
  CROSS JOIN utm_stats u;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT * FROM get_app_install_stats();
-- SELECT * FROM get_app_install_stats('2024-01-01', '2024-12-31');

-- ============================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ============================================

-- Habilitar RLS na tabela
ALTER TABLE "AppInstallLog" ENABLE ROW LEVEL SECURITY;

-- Política: Permitir INSERT público (para tracking)
CREATE POLICY "Allow public insert" ON "AppInstallLog"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política: Permitir SELECT apenas para admins autenticados
-- NOTA: Ajuste conforme seu sistema de autenticação
CREATE POLICY "Allow admin select" ON "AppInstallLog"
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- LIMPEZA AUTOMÁTICA (OPCIONAL)
-- ============================================

-- Função para limpar logs antigos (>90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_app_install_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM "AppInstallLog"
  WHERE "clickedAt" < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (requer pg_cron extension)
-- SELECT cron.schedule('cleanup-app-logs', '0 2 * * 0', 'SELECT cleanup_old_app_install_logs()');

-- ============================================
-- VIEWS ÚTEIS (OPCIONAL)
-- ============================================

-- View: Resumo diário de instalações
CREATE OR REPLACE VIEW "daily_install_summary" AS
SELECT
  DATE("clickedAt") AS date,
  COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICKED') AS clicks,
  COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED') AS installs,
  COUNT(DISTINCT "ipHash") AS unique_users,
  ROUND(
    (COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED')::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICKED'), 0)::NUMERIC) * 100,
    2
  ) AS conversion_rate
FROM "AppInstallLog"
GROUP BY DATE("clickedAt")
ORDER BY date DESC;

-- View: Top 10 campanhas por conversão
CREATE OR REPLACE VIEW "top_campaigns" AS
SELECT
  "utmCampaign",
  "utmSource",
  "utmMedium",
  COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICKED') AS clicks,
  COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED') AS installs,
  ROUND(
    (COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED')::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICKED'), 0)::NUMERIC) * 100,
    2
  ) AS conversion_rate
FROM "AppInstallLog"
WHERE "utmCampaign" IS NOT NULL
GROUP BY "utmCampaign", "utmSource", "utmMedium"
ORDER BY installs DESC
LIMIT 10;

-- ============================================
-- GRANTS DE PERMISSÃO (OPCIONAL)
-- ============================================

-- Permitir que serviço anônimo insira dados (para tracking público)
GRANT INSERT ON "AppInstallLog" TO anon;

-- Permitir que usuários autenticados leiam dados
GRANT SELECT ON "AppInstallLog" TO authenticated;

-- Permitir que admins façam tudo
-- GRANT ALL ON "AppInstallLog" TO service_role;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'AppInstallLog';

-- Verificar se os índices foram criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'AppInstallLog';

-- ============================================
-- DADOS DE TESTE (OPCIONAL - REMOVER EM PRODUÇÃO)
-- ============================================

-- Inserir alguns dados de teste
INSERT INTO "AppInstallLog" (
  "id",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "userAgent",
  "ipHash",
  "deviceType",
  "eventType",
  "isConverted"
) VALUES
  (
    'test_' || gen_random_uuid()::text,
    'qr',
    'android_app',
    'test_campaign',
    'Mozilla/5.0 (Linux; Android 10) Chrome/91.0',
    encode(sha256('192.168.1.1'::bytea), 'hex'),
    'android',
    'LINK_CLICKED',
    false
  ),
  (
    'test_' || gen_random_uuid()::text,
    'qr',
    'android_app',
    'test_campaign',
    'Mozilla/5.0 (Linux; Android 10) Chrome/91.0',
    encode(sha256('192.168.1.1'::bytea), 'hex'),
    'android',
    'APP_INSTALLED',
    true
  );

-- Verificar dados de teste
SELECT * FROM "AppInstallLog";

-- Testar view
SELECT * FROM "daily_install_summary";

-- Testar função
SELECT * FROM get_app_install_stats();

-- ============================================
-- LIMPEZA DE DADOS DE TESTE
-- ============================================

-- REMOVER DADOS DE TESTE ANTES DE IR PARA PRODUÇÃO!
-- DELETE FROM "AppInstallLog" WHERE "id" LIKE 'test_%';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

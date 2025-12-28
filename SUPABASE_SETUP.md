# 🗄️ Configuração do Supabase - PWA Tracking

## 📋 Passo a Passo Rápido

### 1️⃣ Acessar o Supabase SQL Editor

1. Abra seu projeto no Supabase: https://app.supabase.com
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**

### 2️⃣ Executar a Migração

#### **Opção A: Migração Completa (Recomendado)**
Copie e cole TODO o conteúdo do arquivo `supabase-migration.sql` e clique em **RUN**.

Isso criará:
- ✅ Tabela `AppInstallLog`
- ✅ Enum `AppInstallEvent`
- ✅ 3 índices de performance
- ✅ Função auxiliar `get_app_install_stats()`
- ✅ Views úteis (`daily_install_summary`, `top_campaigns`)
- ✅ Políticas RLS (Row Level Security)

#### **Opção B: Migração Mínima (Apenas Essencial)**
Se preferir apenas o básico, execute este SQL:

```sql
-- Criar ENUM
CREATE TYPE "AppInstallEvent" AS ENUM (
  'LINK_CLICKED',
  'APP_INSTALLED',
  'APP_OPENED'
);

-- Criar tabela
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

-- Criar índices
CREATE INDEX "AppInstallLog_utmSource_utmMedium_idx" ON "AppInstallLog"("utmSource", "utmMedium");
CREATE INDEX "AppInstallLog_eventType_idx" ON "AppInstallLog"("eventType");
CREATE INDEX "AppInstallLog_clickedAt_idx" ON "AppInstallLog"("clickedAt");

-- Permitir INSERT público (para tracking)
ALTER TABLE "AppInstallLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON "AppInstallLog"
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow admin select" ON "AppInstallLog"
  FOR SELECT
  TO authenticated
  USING (true);
```

### 3️⃣ Verificar Criação

Execute este SQL para verificar se tudo foi criado:

```sql
-- Verificar tabela
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'AppInstallLog';

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'AppInstallLog';
```

Você deve ver **11 colunas** e **4 índices** (1 primary key + 3 criados).

### 4️⃣ Testar com Dados de Exemplo

Execute para inserir um registro de teste:

```sql
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
) VALUES (
  'test_' || gen_random_uuid()::text,
  'qr',
  'android_app',
  'test_campaign',
  'Mozilla/5.0 (Linux; Android 10) Chrome/91.0',
  encode(sha256('192.168.1.1'::bytea), 'hex'),
  'android',
  'LINK_CLICKED',
  false
);

-- Verificar
SELECT * FROM "AppInstallLog";
```

### 5️⃣ Limpar Dados de Teste

Antes de ir para produção, remova os dados de teste:

```sql
DELETE FROM "AppInstallLog" WHERE "id" LIKE 'test_%';
```

---

## 🔧 Configuração das Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```bash
# Database URL (copie do Supabase → Settings → Database)
DATABASE_URL="postgresql://postgres:[SUA-SENHA]@[SEU-HOST]:5432/postgres?pgbouncer=true"

# Salt para hash de IP (gere uma string aleatória única)
HASH_SALT="sua-chave-secreta-muito-aleatoria-aqui-123456"

# URL do app
NEXT_PUBLIC_APP_URL="https://seudominio.com"
```

**Como gerar HASH_SALT seguro:**
```bash
# No terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Usar Função de Estatísticas (Opcional)

Se você executou a migração completa, pode usar a função auxiliar:

```sql
-- Estatísticas de todos os tempos
SELECT * FROM get_app_install_stats();

-- Estatísticas de um período específico
SELECT * FROM get_app_install_stats(
  '2024-12-01'::TIMESTAMP,
  '2024-12-31'::TIMESTAMP
);
```

Resultado exemplo:
```
total_clicks | total_installs | conversion_rate | by_device | by_utm_source
-------------|----------------|-----------------|-----------|---------------
100          | 35             | 35.00           | [...]     | [...]
```

---

## 📈 Views Úteis (Se Instalou Migração Completa)

### Resumo Diário
```sql
SELECT * FROM "daily_install_summary"
ORDER BY date DESC
LIMIT 7;
```

### Top 10 Campanhas
```sql
SELECT * FROM "top_campaigns";
```

---

## 🔒 Segurança - RLS (Row Level Security)

As políticas RLS já foram criadas:

✅ **INSERT público**: Qualquer pessoa pode registrar eventos (necessário para tracking)
✅ **SELECT autenticado**: Apenas admins logados podem ver os dados

### Testar Permissões

```sql
-- Como usuário público (anon)
SET ROLE anon;
SELECT * FROM "AppInstallLog";  -- Deve falhar

-- Como usuário autenticado
SET ROLE authenticated;
SELECT * FROM "AppInstallLog";  -- Deve funcionar

-- Voltar ao normal
RESET ROLE;
```

---

## 🧹 Limpeza Automática (Opcional)

Para deletar automaticamente logs com mais de 90 dias:

### 1. Instalar pg_cron extension
No Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. Agendar limpeza semanal
```sql
SELECT cron.schedule(
  'cleanup-app-logs',
  '0 2 * * 0',  -- Todo domingo às 2h da manhã
  'SELECT cleanup_old_app_install_logs()'
);
```

### 3. Verificar jobs agendados
```sql
SELECT * FROM cron.job;
```

### 4. Remover job (se necessário)
```sql
SELECT cron.unschedule('cleanup-app-logs');
```

---

## 🔍 Queries Úteis

### Total de cliques hoje
```sql
SELECT COUNT(*)
FROM "AppInstallLog"
WHERE "eventType" = 'LINK_CLICKED'
  AND DATE("clickedAt") = CURRENT_DATE;
```

### Taxa de conversão por campanha
```sql
SELECT
  "utmCampaign",
  COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICKED') AS clicks,
  COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED') AS installs,
  ROUND(
    (COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED')::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICKED'), 0)) * 100,
    2
  ) AS conversion_rate
FROM "AppInstallLog"
WHERE "utmCampaign" IS NOT NULL
GROUP BY "utmCampaign"
ORDER BY installs DESC;
```

### Dispositivos mais usados
```sql
SELECT
  "deviceType",
  COUNT(*) AS total,
  ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM "AppInstallLog")) * 100, 2) AS percentage
FROM "AppInstallLog"
GROUP BY "deviceType"
ORDER BY total DESC;
```

### Timeline de instalações (últimos 7 dias)
```sql
SELECT
  DATE("clickedAt") AS date,
  COUNT(*) FILTER (WHERE "eventType" = 'APP_INSTALLED') AS installs
FROM "AppInstallLog"
WHERE "clickedAt" >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE("clickedAt")
ORDER BY date DESC;
```

---

## ⚠️ Troubleshooting

### Erro: "type AppInstallEvent already exists"
```sql
-- Deletar tipo existente
DROP TYPE IF EXISTS "AppInstallEvent" CASCADE;
-- Depois execute novamente o CREATE TYPE
```

### Erro: "relation AppInstallLog already exists"
```sql
-- Deletar tabela existente (CUIDADO: apaga dados!)
DROP TABLE IF EXISTS "AppInstallLog" CASCADE;
-- Depois execute novamente o CREATE TABLE
```

### Limpar tudo e recomeçar
```sql
-- ATENÇÃO: Isso apaga TODOS os dados!
DROP TABLE IF EXISTS "AppInstallLog" CASCADE;
DROP TYPE IF EXISTS "AppInstallEvent" CASCADE;
DROP FUNCTION IF EXISTS get_app_install_stats CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_app_install_logs CASCADE;
DROP VIEW IF EXISTS "daily_install_summary" CASCADE;
DROP VIEW IF EXISTS "top_campaigns" CASCADE;

-- Depois execute novamente a migração
```

---

## ✅ Checklist de Verificação

Antes de ir para produção, verifique:

- [ ] Tabela `AppInstallLog` criada com sucesso
- [ ] 3 índices criados (utmSource/Medium, eventType, clickedAt)
- [ ] RLS habilitado na tabela
- [ ] Políticas INSERT (public) e SELECT (authenticated) criadas
- [ ] Dados de teste removidos
- [ ] `.env.local` configurado com DATABASE_URL e HASH_SALT
- [ ] Função `get_app_install_stats()` funcionando (opcional)
- [ ] Views criadas e funcionando (opcional)
- [ ] Limpeza automática agendada (opcional)

---

## 📞 Suporte

**Problemas com Supabase?**
- Documentação: https://supabase.com/docs
- Discord: https://discord.supabase.com

**Problemas com a migração?**
- Verificar logs do Supabase SQL Editor
- Executar queries de verificação acima
- Revisar políticas RLS

---

**Criado com ❤️ por Claude Code**

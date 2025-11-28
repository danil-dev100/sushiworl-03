-- Script para criar tabelas de Email Marketing no Supabase

-- EmailAutomation
CREATE TABLE IF NOT EXISTS "EmailAutomation" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "flow" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDraft" BOOLEAN NOT NULL DEFAULT true,
  "totalExecutions" INTEGER NOT NULL DEFAULT 0,
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- EmailAutomationLog
CREATE TABLE IF NOT EXISTS "EmailAutomationLog" (
  "id" TEXT PRIMARY KEY,
  "automationId" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "errorMessage" TEXT,
  "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailAutomationLog_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "EmailAutomation"("id") ON DELETE CASCADE
);

-- EmailTemplate
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "htmlContent" TEXT NOT NULL,
  "textContent" TEXT,
  "fromName" TEXT NOT NULL DEFAULT 'SushiWorld',
  "fromEmail" TEXT NOT NULL DEFAULT 'pedidosushiworld@gmail.com',
  "buttonText" TEXT,
  "buttonUrl" TEXT,
  "buttonColor" TEXT DEFAULT '#FF6B00',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- SmtpSettings
CREATE TABLE IF NOT EXISTS "SmtpSettings" (
  "id" TEXT PRIMARY KEY,
  "smtpServer" TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  "smtpPort" INTEGER NOT NULL DEFAULT 587,
  "smtpUser" TEXT,
  "smtpPassword" TEXT,
  "useTls" BOOLEAN NOT NULL DEFAULT true,
  "defaultFromName" TEXT NOT NULL DEFAULT 'SushiWorld',
  "defaultFromEmail" TEXT NOT NULL DEFAULT 'pedidosushiworld@gmail.com',
  "minDelaySeconds" INTEGER NOT NULL DEFAULT 60,
  "maxDelaySeconds" INTEGER NOT NULL DEFAULT 300,
  "maxEmailsPerHour" INTEGER NOT NULL DEFAULT 100,
  "emailRetentionDays" INTEGER NOT NULL DEFAULT 30,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS "EmailAutomationLog_automationId_idx" ON "EmailAutomationLog"("automationId");
CREATE INDEX IF NOT EXISTS "EmailAutomationLog_executedAt_idx" ON "EmailAutomationLog"("executedAt");

-- Mensagem de sucesso
SELECT 'Tabelas de Email Marketing criadas com sucesso!' as message;

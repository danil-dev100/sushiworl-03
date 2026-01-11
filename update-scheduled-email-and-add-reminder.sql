-- ====================================================================
-- SCRIPT SQL: ATUALIZAR EMAIL DE AGENDAMENTO E ADICIONAR LEMBRETE
-- ====================================================================
-- Este script:
-- 1. Atualiza o template "Agendamento Confirmado" com botão correto
-- 2. Adiciona template "Lembrete de Pedido Agendado"
-- 3. NÃO altera o fluxo (você configurará manualmente no builder)
-- ====================================================================

-- ====================================================================
-- 1. ATUALIZAR TEMPLATE "AGENDAMENTO CONFIRMADO"
-- ====================================================================

UPDATE "EmailTemplate"
SET
  "htmlContent" = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f1e9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1e9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #FF6B00; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">📅 Pedido Agendado!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Ótima escolha! Seu pedido <strong style="color: #FF6B00;">#{{orderNumber}}</strong> foi agendado com sucesso e será preparado fresquinho no horário escolhido.
              </p>

              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0;">
                <p style="color: #2e7d32; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                  📆 Data e Hora Agendada:
                </p>
                <p style="color: #1b5e20; font-size: 24px; font-weight: bold; margin: 0;">
                  {{scheduledDate}} às {{scheduledTime}}
                </p>
              </div>

              <div style="background-color: #f5f1e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #333333; margin: 0 0 15px 0;">Resumo do Pedido:</h3>
                <p style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0;">
                  {{orderItems}}
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                <p style="color: #FF6B00; font-size: 20px; font-weight: bold; margin: 0;">
                  Total: €{{orderTotal}}
                </p>
              </div>

              <div style="background-color: #fef6f0; border-left: 4px solid #FF6B00; padding: 15px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; margin: 0;">
                  📍 <strong>Endereço de Entrega:</strong><br>
                  {{deliveryAddress}}
                </p>
              </div>

              <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>ℹ️ Importante:</strong><br>
                  • Seu pedido será preparado no horário agendado<br>
                  • Você receberá um email de lembrete antes do horário<br>
                  • Em caso de cancelamento, entre em contato conosco
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://sushiworld.pt" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">
                      Fazer Novo Pedido
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                Estamos ansiosos para preparar seu pedido! 🍣
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f5f1e9; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2026 SushiWorld
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  "buttonText" = 'Fazer Novo Pedido',
  "buttonUrl" = 'https://sushiworld.pt',
  "updatedAt" = NOW()
WHERE name = 'Agendamento Confirmado';

-- ====================================================================
-- 2. CRIAR TEMPLATE "LEMBRETE DE PEDIDO AGENDADO"
-- ====================================================================

-- Deletar se já existir
DELETE FROM "EmailTemplate" WHERE name = 'Lembrete de Pedido Agendado';

-- Inserir novo template
INSERT INTO "EmailTemplate" (
  id,
  name,
  subject,
  "htmlContent",
  "textContent",
  "fromName",
  "fromEmail",
  "buttonText",
  "buttonUrl",
  "buttonColor",
  "createdAt",
  "updatedAt"
)
VALUES (
  'scheduled_reminder_' || gen_random_uuid()::text,
  'Lembrete de Pedido Agendado',
  '⏰ Lembrete: Seu Pedido Será Entregue em Breve! #{{orderNumber}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f1e9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1e9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #4caf50; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">⏰ Lembrete do Seu Pedido!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Este é um lembrete amigável de que seu pedido <strong style="color: #FF6B00;">#{{orderNumber}}</strong> será entregue em breve!
              </p>

              <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0;">
                <p style="color: #2e7d32; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                  📆 Horário de Entrega:
                </p>
                <p style="color: #1b5e20; font-size: 24px; font-weight: bold; margin: 0;">
                  {{scheduledDate}} às {{scheduledTime}}
                </p>
              </div>

              <div style="background-color: #f5f1e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #333333; margin: 0 0 15px 0;">Resumo do Seu Pedido:</h3>
                <p style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0;">
                  {{orderItems}}
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                <p style="color: #FF6B00; font-size: 20px; font-weight: bold; margin: 0;">
                  Total: €{{orderTotal}}
                </p>
              </div>

              <div style="background-color: #fef6f0; border-left: 4px solid #FF6B00; padding: 15px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; margin: 0;">
                  📍 <strong>Endereço de Entrega:</strong><br>
                  {{deliveryAddress}}
                </p>
              </div>

              <div style="background-color: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #1565c0; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>✨ Tudo Pronto!</strong><br>
                  Estamos preparando tudo para que seu pedido chegue fresquinho e delicioso no horário agendado. Fique atento! 🍱
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://sushiworld.pt" style="display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">
                      Fazer Novo Pedido
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                Obrigado pela preferência! 🍣
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f5f1e9; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2026 SushiWorld | Este é um lembrete automático
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Lembrete: Seu pedido será entregue em breve no horário agendado!',
  'SushiWorld',
  'pedidosushiworld@gmail.com',
  'Fazer Novo Pedido',
  'https://sushiworld.pt',
  '#4caf50',
  NOW(),
  NOW()
);

-- ====================================================================
-- CONCLUÍDO
-- ====================================================================
-- Execute este SQL no Supabase SQL Editor
--
-- Depois, no construtor de fluxos:
-- 1. Abra o fluxo "Jornada: Pedido Agendado"
-- 2. Adicione um nó de DELAY após o primeiro email
-- 3. Configure o delay (exemplo: aguardar até 1 hora antes do horário agendado)
-- 4. Adicione o nó de EMAIL com o template "Lembrete de Pedido Agendado"
-- 5. Conecte: Trigger -> Email Confirmação -> Delay -> Email Lembrete
-- ====================================================================

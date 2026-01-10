-- ====================================================================
-- SCRIPT SQL: FLUXO DE EMAIL PARA PEDIDOS AGENDADOS
-- ====================================================================
-- Este script adiciona:
-- 1. Templates de email para agendamento confirmado e cancelado
-- 2. Fluxo automático de email marketing para pedidos agendados
--
-- INSTRUÇÕES:
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Verifique em /admin/marketing/email-marketing se o fluxo aparece
-- ====================================================================

-- ====================================================================
-- 1. INSERIR TEMPLATES DE EMAIL
-- ====================================================================

-- Template: Agendamento Confirmado
INSERT INTO "EmailTemplate" (id, name, subject, "htmlContent", "textContent", "fromName", "fromEmail", "buttonText", "buttonUrl", "buttonColor", "createdAt", "updatedAt")
VALUES (
  'scheduled_confirmed_' || gen_random_uuid()::text,
  'Agendamento Confirmado',
  '📅 Pedido Agendado com Sucesso! #{{orderNumber}}',
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
                  • Você receberá uma notificação quando começarmos a preparar<br>
                  • Em caso de cancelamento, entre em contato conosco
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">
                      Ver Meu Pedido
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
                © 2025 SushiWorld
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Seu pedido foi agendado! Preparamos tudo fresquinho no horário escolhido.',
  'SushiWorld',
  'pedidosushiworld@gmail.com',
  'Ver Meu Pedido',
  'https://sushiworld.pt/pedidos/{{orderId}}',
  '#FF6B00',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  "htmlContent" = EXCLUDED."htmlContent",
  "textContent" = EXCLUDED."textContent",
  "buttonText" = EXCLUDED."buttonText",
  "buttonUrl" = EXCLUDED."buttonUrl",
  "buttonColor" = EXCLUDED."buttonColor",
  "updatedAt" = NOW();

-- Template: Agendamento Cancelado
INSERT INTO "EmailTemplate" (id, name, subject, "htmlContent", "textContent", "fromName", "fromEmail", "buttonText", "buttonUrl", "buttonColor", "createdAt", "updatedAt")
VALUES (
  'scheduled_cancelled_' || gen_random_uuid()::text,
  'Agendamento Cancelado',
  '❌ Pedido Agendado Cancelado #{{orderNumber}}',
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
            <td style="background-color: #d32f2f; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">❌ Pedido Cancelado</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Lamentamos informar que seu pedido agendado <strong style="color: #d32f2f;">#{{orderNumber}}</strong> foi cancelado.
              </p>

              <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 20px; margin: 20px 0;">
                <p style="color: #c62828; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                  📅 Pedido Agendado Para:
                </p>
                <p style="color: #b71c1c; font-size: 20px; font-weight: bold; margin: 0;">
                  {{scheduledDate}} às {{scheduledTime}}
                </p>
              </div>

              <div style="background-color: #f5f1e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                  <strong>Motivo do cancelamento:</strong>
                </p>
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  {{cancellationReason}}
                </p>
              </div>

              <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>ℹ️ Sobre o reembolso:</strong><br>
                  • Se você já pagou, o reembolso será processado em até 7 dias úteis<br>
                  • O valor será devolvido na mesma forma de pagamento utilizada<br>
                  • Para dúvidas, entre em contato conosco
                </p>
              </div>

              <div style="background-color: #fef6f0; border-left: 4px solid #FF6B00; padding: 20px; margin: 20px 0;">
                <p style="color: #FF6B00; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                  🎁 Não desista de nós!
                </p>
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  Use o cupom <strong style="color: #FF6B00;">VOLTE10</strong> e ganhe 10% de desconto no seu próximo pedido!
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">
                      Fazer Novo Pedido
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                Para dúvidas, responda este email ou entre em contato conosco.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f5f1e9; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 SushiWorld
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Seu pedido agendado foi cancelado. Entre em contato para mais informações.',
  'SushiWorld',
  'pedidosushiworld@gmail.com',
  'Fazer Novo Pedido',
  'https://sushiworld.pt',
  '#FF6B00',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  "htmlContent" = EXCLUDED."htmlContent",
  "textContent" = EXCLUDED."textContent",
  "buttonText" = EXCLUDED."buttonText",
  "buttonUrl" = EXCLUDED."buttonUrl",
  "buttonColor" = EXCLUDED."buttonColor",
  "updatedAt" = NOW();

-- ====================================================================
-- 2. CRIAR FLUXO AUTOMÁTICO DE EMAIL PARA PEDIDOS AGENDADOS
-- ====================================================================

-- Primeiro, obter o ID do template "Agendamento Confirmado"
DO $$
DECLARE
  v_template_id TEXT;
  v_automation_id TEXT;
BEGIN
  -- Buscar ID do template
  SELECT id INTO v_template_id FROM "EmailTemplate" WHERE name = 'Agendamento Confirmado' LIMIT 1;

  -- Gerar ID para a automação
  v_automation_id := 'scheduled_flow_' || gen_random_uuid()::text;

  -- Inserir fluxo automático
  INSERT INTO "EmailAutomation" (
    id,
    name,
    description,
    flow,
    "isActive",
    "isDraft",
    "totalExecutions",
    "successCount",
    "failureCount",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    v_automation_id,
    'Jornada: Pedido Agendado',
    'Email automático de confirmação enviado imediatamente após o cliente agendar um pedido',
    jsonb_build_object(
      'nodes', jsonb_build_array(
        jsonb_build_object(
          'id', 'trigger_1',
          'type', 'trigger',
          'position', jsonb_build_object('x', 100, 'y', 100),
          'data', jsonb_build_object(
            'event', 'order_scheduled',
            'label', 'Pedido Agendado',
            'description', 'Dispara quando cliente agenda um pedido'
          )
        ),
        jsonb_build_object(
          'id', 'email_1',
          'type', 'email',
          'position', jsonb_build_object('x', 300, 'y', 100),
          'data', jsonb_build_object(
            'templateId', v_template_id,
            'templateName', 'Agendamento Confirmado',
            'subject', '📅 Pedido Agendado com Sucesso! #{{orderNumber}}',
            'delay', 0,
            'delayUnit', 'minutes'
          )
        )
      ),
      'connections', jsonb_build_array(
        jsonb_build_object(
          'source', 'trigger_1',
          'target', 'email_1'
        )
      )
    ),
    true,  -- isActive
    false, -- isDraft
    0,     -- totalExecutions
    0,     -- successCount
    0,     -- failureCount
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Fluxo criado com sucesso! ID: %', v_automation_id;
END $$;

-- ====================================================================
-- 3. VERIFICAÇÃO
-- ====================================================================

-- Verificar se os templates foram criados
SELECT
  name,
  subject,
  "buttonText",
  "createdAt"
FROM "EmailTemplate"
WHERE name IN ('Agendamento Confirmado', 'Agendamento Cancelado')
ORDER BY name;

-- Verificar se o fluxo foi criado
SELECT
  id,
  name,
  description,
  "isActive",
  "isDraft",
  "createdAt"
FROM "EmailAutomation"
WHERE name = 'Jornada: Pedido Agendado';

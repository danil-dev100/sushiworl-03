import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'Boas-vindas - Primeira Compra',
    subject: 'Bem-vindo ao SushiWorld! 🍣',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao SushiWorld</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f1e9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1e9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #FF6B00; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🍣 SushiWorld</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Olá, {{customerName}}!</h2>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Obrigado por fazer seu primeiro pedido no SushiWorld! Estamos muito felizes em ter você conosco. 🎉
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Seu pedido <strong>#{{orderNumber}}</strong> foi confirmado e está sendo preparado com todo carinho por nossa equipe.
              </p>

              <div style="background-color: #fef6f0; border-left: 4px solid #FF6B00; padding: 20px; margin: 20px 0;">
                <p style="color: #FF6B00; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">🎁 Presente Especial!</p>
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  Na sua próxima compra, use o cupom <strong style="color: #FF6B00;">BEMVINDO10</strong> e ganhe 10% de desconto!
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

              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Dúvidas? Entre em contato conosco respondendo este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f1e9; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 SushiWorld. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    textContent: 'Olá {{customerName}}! Obrigado por fazer seu primeiro pedido no SushiWorld!',
    buttonText: 'Ver Meu Pedido',
    buttonUrl: 'https://sushiworld.pt/pedidos/{{orderId}}',
    buttonColor: '#FF6B00',
  },

  {
    name: 'Carrinho Abandonado - 1h',
    subject: 'Você esqueceu algo delicioso! 🍱',
    htmlContent: `
<!DOCTYPE html>
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
              <h1 style="color: #ffffff; margin: 0;">🍱 Seu Carrinho Está Esperando!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Olá! Notamos que você deixou alguns itens deliciosos no carrinho.
              </p>

              <div style="background-color: #fef6f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #333333; margin: 0 0 15px 0;">Seus Itens:</h3>
                <p style="color: #666666; font-size: 14px; margin: 0;">
                  {{cartItems}}
                </p>
                <p style="color: #FF6B00; font-size: 20px; font-weight: bold; margin: 15px 0 0 0;">
                  Total: €{{cartTotal}}
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">
                      Finalizar Pedido
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; text-align: center;">
                ⏰ Seus itens estão reservados por mais 24 horas
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
</html>
    `,
    textContent: 'Você esqueceu itens no carrinho! Finalize seu pedido agora.',
    buttonText: 'Finalizar Pedido',
    buttonUrl: 'https://sushiworld.pt/carrinho',
    buttonColor: '#FF6B00',
  },

  {
    name: 'Recuperação - 7 dias sem comprar',
    subject: 'Sentimos sua falta! 😢 Volte com 15% OFF',
    htmlContent: `
<!DOCTYPE html>
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
              <h1 style="color: #ffffff; margin: 0;">😢 Sentimos Sua Falta!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #666666; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Faz 7 dias que você não faz um pedido conosco. Preparamos uma oferta especial só para você!
              </p>

              <div style="background-color: #fef6f0; border: 3px dashed #FF6B00; border-radius: 12px; padding: 30px; margin: 30px 0;">
                <p style="color: #FF6B00; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🎁 CUPOM EXCLUSIVO</p>
                <p style="color: #333333; font-size: 32px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">
                  VOLTE15
                </p>
                <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">
                  15% de desconto em qualquer pedido
                </p>
                <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                  Válido por 3 dias
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 4px; font-size: 18px; font-weight: bold;">
                      Fazer Pedido Agora
                    </a>
                  </td>
                </tr>
              </table>
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
</html>
    `,
    textContent: 'Sentimos sua falta! Volte com 15% OFF usando o cupom VOLTE15',
    buttonText: 'Fazer Pedido Agora',
    buttonUrl: 'https://sushiworld.pt',
    buttonColor: '#FF6B00',
  },

  {
    name: 'Recuperação - 15 dias sem comprar',
    subject: 'Última chance! 20% OFF esperando por você 🎁',
    htmlContent: `
<!DOCTYPE html>
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
              <h1 style="color: #ffffff; margin: 0;">🎁 Oferta Especial de Retorno!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #666666; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Faz 15 dias que você não nos visita. Queremos MUITO você de volta! Por isso, preparamos um desconto especial:
              </p>

              <div style="background-color: #fef6f0; border: 3px dashed #FF6B00; border-radius: 12px; padding: 30px; margin: 30px 0;">
                <p style="color: #FF6B00; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">💎 CUPOM VIP</p>
                <p style="color: #333333; font-size: 36px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">
                  VOLTEVIP20
                </p>
                <p style="color: #FF6B00; font-size: 20px; font-weight: bold; margin: 10px 0;">
                  20% DE DESCONTO
                </p>
                <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">
                  + Frete grátis em pedidos acima de €20
                </p>
                <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                  Válido por 5 dias
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 4px; font-size: 18px; font-weight: bold;">
                      Resgatar Oferta
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; margin: 20px 0 0 0;">
                ⏰ Esta oferta expira em breve!
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
</html>
    `,
    textContent: 'Última chance! Volte com 20% OFF usando VOLTEVIP20',
    buttonText: 'Resgatar Oferta',
    buttonUrl: 'https://sushiworld.pt',
    buttonColor: '#FF6B00',
  },

  {
    name: 'Recuperação - 30 dias sem comprar',
    subject: 'Voltou! 25% OFF + Surpresa Especial 🎉',
    htmlContent: `
<!DOCTYPE html>
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
              <h1 style="color: #ffffff; margin: 0;">🎉 Bem-Vindo de Volta!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #666666; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Faz tempo que você não nos visita! Queremos celebrar seu retorno com uma oferta IMPERDÍVEL:
              </p>

              <div style="background-color: #fef6f0; border: 4px solid #FF6B00; border-radius: 12px; padding: 30px; margin: 30px 0;">
                <p style="color: #FF6B00; font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">👑 OFERTA EXCLUSIVA DE RETORNO</p>
                <p style="color: #333333; font-size: 40px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">
                  RETORNO25
                </p>
                <p style="color: #FF6B00; font-size: 24px; font-weight: bold; margin: 10px 0;">
                  25% DE DESCONTO
                </p>
                <p style="color: #666666; font-size: 16px; margin: 15px 0;">
                  + Frete GRÁTIS<br>
                  + Refrigerante de brinde
                </p>
                <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                  Válido por 7 dias
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 20px 60px; border-radius: 4px; font-size: 20px; font-weight: bold;">
                      Fazer Pedido Agora
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #FF6B00; font-size: 16px; font-weight: bold; margin: 20px 0 0 0;">
                ⏰ Não perca! Oferta válida por tempo limitado
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
</html>
    `,
    textContent: 'Bem-vindo de volta! 25% OFF + frete grátis + brinde. Use: RETORNO25',
    buttonText: 'Fazer Pedido Agora',
    buttonUrl: 'https://sushiworld.pt',
    buttonColor: '#FF6B00',
  },

  {
    name: 'Pedido Confirmado',
    subject: 'Pedido #{{orderNumber}} Confirmado! 🎉',
    htmlContent: `
<!DOCTYPE html>
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
              <h1 style="color: #ffffff; margin: 0;">✅ Pedido Confirmado!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Seu pedido <strong style="color: #FF6B00;">#{{orderNumber}}</strong> foi confirmado e está sendo preparado com todo cuidado!
              </p>

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

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">
                      Acompanhar Pedido
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                Tempo estimado de entrega: 30-45 minutos
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
</html>
    `,
    textContent: 'Seu pedido foi confirmado! Acompanhe o status em tempo real.',
    buttonText: 'Acompanhar Pedido',
    buttonUrl: 'https://sushiworld.pt/pedidos/{{orderId}}',
    buttonColor: '#FF6B00',
  },

  {
    name: 'Agradecimento Pós-Pedido',
    subject: 'Obrigado pelo seu pedido! ⭐ Avalie-nos',
    htmlContent: `
<!DOCTYPE html>
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
              <h1 style="color: #ffffff; margin: 0;">⭐ Obrigado!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #666666; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá {{customerName}},
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Esperamos que tenha aproveitado seu pedido! Sua opinião é muito importante para nós.
              </p>

              <div style="margin: 30px 0;">
                <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 0 0 20px 0;">
                  Como foi sua experiência?
                </p>
                <table width="100%" cellpadding="10" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="{{ratingUrl}}&stars=5" style="text-decoration: none; font-size: 40px;">⭐⭐⭐⭐⭐</a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="{{ratingUrl}}&stars=4" style="text-decoration: none; font-size: 40px;">⭐⭐⭐⭐</a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="{{ratingUrl}}&stars=3" style="text-decoration: none; font-size: 40px;">⭐⭐⭐</a>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #fef6f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="color: #FF6B00; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                  🎁 Presentinho para você!
                </p>
                <p style="color: #666666; font-size: 14px; margin: 0;">
                  Use o cupom <strong style="color: #FF6B00;">OBRIGADO10</strong> na sua próxima compra e ganhe 10% de desconto!
                </p>
              </div>

              <p style="color: #999999; font-size: 14px; margin: 30px 0 0 0;">
                Obrigado por escolher o SushiWorld! 🍣
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
</html>
    `,
    textContent: 'Obrigado pelo seu pedido! Avalie sua experiência e ganhe 10% de desconto.',
    buttonText: 'Avaliar Experiência',
    buttonUrl: 'https://sushiworld.pt/avaliar/{{orderId}}',
    buttonColor: '#FF6B00',
  },

  {
    name: 'Aniversário do Cliente',
    subject: '🎂 Feliz Aniversário! Presente Especial Esperando',
    htmlContent: `
<!DOCTYPE html>
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
              <h1 style="color: #ffffff; margin: 0; font-size: 36px;">🎂 Feliz Aniversário!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #666666; font-size: 20px; line-height: 1.6; margin: 0 0 20px 0;">
                Parabéns, {{customerName}}! 🎉
              </p>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Hoje é um dia especial e queremos celebrar com você!
              </p>

              <div style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZlZjZmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+OiTwvdGV4dD48L3N2Zz4='); background-size: cover; border: 4px solid #FF6B00; border-radius: 12px; padding: 40px; margin: 30px 0;">
                <p style="color: #FF6B00; font-size: 22px; font-weight: bold; margin: 0 0 15px 0;">🎁 SEU PRESENTE DE ANIVERSÁRIO</p>
                <p style="color: #333333; font-size: 42px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">
                  ANIVERSARIO30
                </p>
                <p style="color: #FF6B00; font-size: 26px; font-weight: bold; margin: 10px 0;">
                  30% DE DESCONTO
                </p>
                <p style="color: #666666; font-size: 16px; margin: 15px 0;">
                  + Sobremesa grátis<br>
                  + Frete grátis
                </p>
                <p style="color: #999999; font-size: 13px; margin: 10px 0 0 0;">
                  Válido apenas hoje!
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{buttonUrl}}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; padding: 20px 60px; border-radius: 4px; font-size: 20px; font-weight: bold;">
                      Resgatar Presente
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 16px; margin: 30px 0 0 0;">
                Que seu dia seja tão especial quanto você é para nós! 🎊
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
</html>
    `,
    textContent: 'Feliz Aniversário! Ganhe 30% OFF + sobremesa + frete grátis. Use: ANIVERSARIO30',
    buttonText: 'Resgatar Presente',
    buttonUrl: 'https://sushiworld.pt',
    buttonColor: '#FF6B00',
  },
];

async function main() {
  console.log('🌱 Iniciando seed de templates de email...');

  for (const template of emailTemplates) {
    // Verificar se já existe
    const existing = await prisma.emailTemplate.findFirst({
      where: { name: template.name }
    });

    if (existing) {
      // Atualizar
      const updated = await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: template
      });
      console.log(`✅ Template atualizado: ${updated.name}`);
    } else {
      // Criar
      const created = await prisma.emailTemplate.create({
        data: template
      });
      console.log(`✅ Template criado: ${created.name}`);
    }
  }

  console.log('\n🎉 Seed de templates concluído com sucesso!');
  console.log(`📧 Total de templates: ${emailTemplates.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

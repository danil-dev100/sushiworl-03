import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  createdAt: Date;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SushiWorld <pedidos@sushiworld.pt>',
      to: [order.customerEmail],
      subject: `Confirmação do Pedido #${order.id}`,
      html: generateOrderConfirmationHTML(order),
    });

    if (error) {
      console.error('Erro ao enviar e-mail:', error);
      return false;
    }

    console.log('E-mail enviado com sucesso:', data);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return false;
  }
}

function generateOrderConfirmationHTML(order: Order): string {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">€${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmação do Pedido</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f97316; margin: 0;">🍣 SushiWorld</h1>
        <p style="margin: 5px 0;">Sushi fresco e delicioso</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #1f2937;">Pedido Confirmado! 🎉</h2>
        <p>Olá <strong>${order.customerName}</strong>,</p>
        <p>Seu pedido foi confirmado e está sendo preparado com todo o cuidado. Aqui estão os detalhes:</p>
      </div>

      <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f97316; color: white;">
              <th style="padding: 12px; text-align: left;">Produto</th>
              <th style="padding: 12px; text-align: center;">Quantidade</th>
              <th style="padding: 12px; text-align: right;">Preço</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
          <tfoot>
            <tr style="background: #f8f9fa; font-weight: bold;">
              <td colspan="2" style="padding: 15px; text-align: right;">Total:</td>
              <td style="padding: 15px; text-align: right; color: #f97316;">€${order.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #065f46;">Informações de Entrega</h3>
        <p><strong>Número do Pedido:</strong> #${order.id}</p>
        <p><strong>Data do Pedido:</strong> ${order.createdAt.toLocaleDateString('pt-PT')}</p>
        <p><strong>Entrega:</strong> Em até 30 minutos em Santa Iria</p>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #6b7280;">
        <p>Obrigado por escolher SushiWorld!</p>
        <p>Para dúvidas, entre em contato: <a href="mailto:pedidos@sushiworld.pt" style="color: #f97316;">pedidos@sushiworld.pt</a></p>
      </div>
    </body>
    </html>
  `;
}
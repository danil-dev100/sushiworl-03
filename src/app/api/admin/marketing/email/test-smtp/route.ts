import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      smtpServer,
      smtpPort,
      smtpUser,
      smtpPassword,
      useTls,
      defaultFromName,
      defaultFromEmail,
    } = body;

    // Criar transporter do Nodemailer
    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      secure: smtpPort === 465, // true para 465, false para outras portas
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: useTls
        ? {
            rejectUnauthorized: false, // Útil para desenvolvimento
          }
        : undefined,
    });

    // Verificar conexão
    await transporter.verify();

    // Enviar email de teste
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      to: smtpUser, // Envia para o próprio usuário como teste
      subject: 'Teste de Configuração SMTP - SushiWorld',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B00;">✅ Conexão SMTP Bem-Sucedida!</h2>
          <p>Parabéns! Sua configuração SMTP está funcionando corretamente.</p>
          <p><strong>Servidor:</strong> ${smtpServer}:${smtpPort}</p>
          <p><strong>Usuário:</strong> ${smtpUser}</p>
          <p><strong>TLS:</strong> ${useTls ? 'Ativado' : 'Desativado'}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Este é um email de teste enviado pelo sistema de Email Marketing do SushiWorld.
          </p>
        </div>
      `,
      text: `Conexão SMTP bem-sucedida!\n\nServidor: ${smtpServer}:${smtpPort}\nUsuário: ${smtpUser}\n\nEste é um email de teste do SushiWorld.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Conexão bem-sucedida! Email de teste enviado.',
    });
  } catch (error: any) {
    console.error('Erro ao testar SMTP:', error);

    let errorMessage = 'Erro ao conectar ao servidor SMTP';

    if (error.code === 'EAUTH') {
      errorMessage = 'Autenticação falhou. Verifique usuário e senha.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Não foi possível conectar ao servidor. Verifique host e porta.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 400 }
    );
  }
}

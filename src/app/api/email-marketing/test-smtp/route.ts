import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import nodemailer from 'nodemailer';

// POST /api/email-marketing/test-smtp - Testar conexão SMTP
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      smtpServer,
      smtpPort,
      smtpUser,
      smtpPassword,
      useTls,
      to,
      subject,
      html,
    } = body;

    // Validações
    if (!smtpServer?.trim() || !smtpPort?.trim() || !smtpUser?.trim() || !smtpPassword?.trim()) {
      return NextResponse.json(
        { error: 'Todos os campos SMTP são obrigatórios' },
        { status: 400 }
      );
    }

    if (!to?.trim()) {
      return NextResponse.json(
        { error: 'Destinatário é obrigatório' },
        { status: 400 }
      );
    }

    // Criar transporter
    const transporter = nodemailer.createTransporter({
      host: smtpServer.trim(),
      port: parseInt(smtpPort.trim()),
      secure: smtpPort.trim() === '465', // true para 465, false para outras portas
      auth: {
        user: smtpUser.trim(),
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false, // Para desenvolvimento - em produção, use true
      },
      // Configurações adicionais de segurança
      requireTLS: useTls,
      // Headers anti-spam
      dkim: {
        domainName: process.env.DKIM_DOMAIN || 'sushiworld.com',
        keySelector: process.env.DKIM_SELECTOR || 'default',
        privateKey: process.env.DKIM_PRIVATE_KEY || '',
      },
    });

    try {
      // Verificar conexão
      await transporter.verify();

      // Se passou na verificação, enviar email de teste
      const mailOptions = {
        from: `"${session.user.name || 'SushiWorld'}" <${smtpUser.trim()}>`,
        to: to.trim(),
        subject: subject || 'Teste de Configuração SMTP - SushiWorld',
        html: html || `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #FF6B00;">✅ Teste de SMTP - SushiWorld</h2>
            <p>Se você recebeu este email, suas configurações SMTP estão funcionando corretamente!</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Configurações testadas:</strong><br>
              Servidor: ${smtpServer}<br>
              Porta: ${smtpPort}<br>
              TLS: ${useTls ? 'Sim' : 'Não'}<br>
              Usuário: ${smtpUser}<br>
              Enviado em: ${new Date().toLocaleString('pt-BR')}
            </div>
            <p style="color: #666; font-size: 12px;">
              Este é um email de teste automático enviado pelo sistema de Email Marketing do SushiWorld.
            </p>
          </div>
        `,
        // Headers anti-spam
        headers: {
          'X-Mailer': 'SushiWorld Email Marketing System',
          'List-Unsubscribe': `<mailto:${smtpUser}?subject=unsubscribe>`,
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          // SPF/DKIM/DMARC headers serão adicionados automaticamente se configurados
        },
      };

      const info = await transporter.sendMail(mailOptions);

      // Registrar log do teste
      console.log('Email de teste enviado:', {
        messageId: info.messageId,
        envelope: info.envelope,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return NextResponse.json({
        success: true,
        message: '✅ Conexão SMTP estabelecida e email de teste enviado com sucesso!',
        details: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
        }
      });

    } catch (error: any) {
      console.error('Erro no teste SMTP:', error);

      let errorMessage = 'Erro desconhecido na conexão SMTP';

      if (error.code === 'EAUTH') {
        errorMessage = 'Erro de autenticação. Verifique usuário e senha.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Conexão recusada. Verifique servidor e porta.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Timeout na conexão. Verifique servidor.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return NextResponse.json(
        {
          success: false,
          message: `❌ ${errorMessage}`,
          error: error.code || 'UNKNOWN_ERROR'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao testar SMTP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

export interface EmailConfig {
  smtpServer: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  useTls: boolean;
  fromName: string;
  fromEmail: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  async initialize() {
    if (this.transporter) return;

    try {
      // Buscar configuração do banco
      const smtpSettings = await prisma.smtpSettings.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      if (!smtpSettings) {
        throw new Error('Configuração SMTP não encontrada. Configure o SMTP primeiro.');
      }

      this.config = {
        smtpServer: smtpSettings.smtpServer,
        smtpPort: smtpSettings.smtpPort,
        smtpUser: smtpSettings.smtpUser!,
        smtpPassword: smtpSettings.smtpPassword!,
        useTls: smtpSettings.useTls,
        fromName: smtpSettings.defaultFromName,
        fromEmail: smtpSettings.defaultFromEmail,
      };

      // Criar transporter com timeouts aumentados para Vercel
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpServer,
        port: this.config.smtpPort,
        secure: this.config.useTls && this.config.smtpPort === 465, // true para 465, false para outros
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPassword,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
        // Timeouts aumentados para ambiente serverless
        connectionTimeout: 30000, // 30 segundos
        greetingTimeout: 30000, // 30 segundos
        socketTimeout: 60000, // 60 segundos
      });

      // Verificar conexão (com timeout)
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao verificar conexão SMTP')), 25000)
      );

      await Promise.race([verifyPromise, timeoutPromise]);

    } catch (error) {
      console.error('Erro ao inicializar serviço de email:', error);
      throw error;
    }
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter || !this.config) {
        await this.initialize();
      }

      if (!this.transporter || !this.config) {
        throw new Error('Serviço de email não inicializado');
      }

      // Headers anti-spam e melhores práticas
      // IMPORTANTE: Não definir Content-Type manualmente, deixar nodemailer gerenciar
      const defaultHeaders = {
        'X-Mailer': 'SushiWorld Email Service',
        'X-Priority': '3', // Normal priority
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:${this.config.fromEmail}?subject=unsubscribe>`,
        'Precedence': 'bulk',
        'Return-Path': this.config.fromEmail,
        // Anti-spam headers
        'X-Spam-Score': '0',
        'X-Spam-Status': 'No',
        'X-Spam-Flag': 'NO',
        // Custom headers
        'X-Auto-Response-Suppress': 'All',
      };

      // Mesclar headers personalizados
      const headers = { ...defaultHeaders, ...emailData.headers };

      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        replyTo: emailData.replyTo || this.config.fromEmail,
        headers,
        // DKIM será configurado no servidor de email
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };

    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      if (!this.transporter) {
        throw new Error('Transporter não inicializado');
      }

      await this.transporter.verify();

      return {
        success: true,
        message: 'Conexão SMTP estabelecida com sucesso!',
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro na conexão SMTP',
      };
    }
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.sendEmail({
        to,
        subject: 'Teste de Configuração SMTP - SushiWorld',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B00;">✅ Teste de SMTP - SushiWorld</h2>
            <p>Se você recebeu este email, suas configurações SMTP estão funcionando corretamente!</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Configurações testadas:</strong><br>
              Servidor: ${this.config?.smtpServer}<br>
              Porta: ${this.config?.smtpPort}<br>
              TLS: ${this.config?.useTls ? 'Sim' : 'Não'}<br>
              Remetente: ${this.config?.fromName} &lt;${this.config?.fromEmail}&gt;
            </div>
            <p style="color: #666; font-size: 12px;">
              Este é um email de teste automático enviado pelo sistema de Email Marketing do SushiWorld.
            </p>
          </div>
        `,
      });

      if (result.success) {
        return {
          success: true,
          message: 'Email de teste enviado com sucesso!',
        };
      } else {
        return {
          success: false,
          message: result.error || 'Erro ao enviar email de teste',
        };
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao enviar email de teste',
      };
    }
  }

  // Método para obter configuração atual
  getConfig(): EmailConfig | null {
    return this.config;
  }
}

// Instância singleton
export const emailService = new EmailService();




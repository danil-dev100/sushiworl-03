import { prisma } from '@/lib/db';

// Código de país padrão (Portugal)
const DEFAULT_COUNTRY_CODE = '351';

/**
 * Normaliza número de telefone para formato internacional
 * Suporta números portugueses (+351) como padrão
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos exceto o +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Se já tem + no início, verifica se está correto
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove zeros à esquerda
  cleaned = cleaned.replace(/^0+/, '');

  // Se começa com o código do país sem +, adiciona o +
  if (cleaned.startsWith('351') || cleaned.startsWith('55') || cleaned.startsWith('34')) {
    return '+' + cleaned;
  }

  // Números portugueses (9 dígitos começando com 9)
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return '+351' + cleaned;
  }

  // Números portugueses com indicativo de área (fixos)
  if (cleaned.length === 9 && (cleaned.startsWith('2') || cleaned.startsWith('3'))) {
    return '+351' + cleaned;
  }

  // Fallback: adiciona código de Portugal
  return '+' + DEFAULT_COUNTRY_CODE + cleaned;
}

/**
 * Valida se um número de telefone está no formato correto
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Deve ter pelo menos 10 dígitos (código do país + número)
  const digitsOnly = normalized.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Interface para configurações de SMS
 */
export interface SmsSettings {
  provider: 'twilio' | 'd7';
  twilioAccountSid?: string | null;
  twilioAuthToken?: string | null;
  d7ApiKey?: string | null;
  fromNumber: string;
  maxSmsPerHour: number;
  isActive: boolean;
}

/**
 * Resultado do envio de SMS
 */
export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia SMS via Twilio
 */
async function sendTwilioSMS(
  settings: SmsSettings,
  to: string,
  message: string
): Promise<SmsSendResult> {
  try {
    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
      return { success: false, error: 'Credenciais do Twilio não configuradas' };
    }

    const twilio = require('twilio');
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);

    const smsMessage = await client.messages.create({
      body: message,
      from: settings.fromNumber,
      to: to,
    });

    return {
      success: true,
      messageId: smsMessage.sid,
    };
  } catch (error: any) {
    console.error('[Twilio] Erro:', error);

    // Erros específicos do Twilio
    if (error.code === 21211) {
      return { success: false, error: 'Número de destino inválido' };
    }
    if (error.code === 21608) {
      return { success: false, error: 'Número de origem não verificado ou inválido' };
    }
    if (error.code === 20003) {
      return { success: false, error: 'Credenciais do Twilio inválidas' };
    }
    if (error.code === 21610) {
      return { success: false, error: 'Número bloqueado ou optou por não receber SMS' };
    }

    return {
      success: false,
      error: error.message || 'Erro ao enviar SMS via Twilio',
    };
  }
}

/**
 * Envia SMS via D7 Networks
 */
async function sendD7SMS(
  settings: SmsSettings,
  to: string,
  message: string
): Promise<SmsSendResult> {
  try {
    if (!settings.d7ApiKey) {
      return { success: false, error: 'API Key do D7 não configurada' };
    }

    const axios = require('axios');

    const response = await axios.post(
      'https://api.d7networks.com/messages/v1/send',
      {
        messages: [
          {
            channel: 'sms',
            recipients: [to],
            content: message,
            msg_type: 'text',
            data_coding: 'text',
          },
        ],
        message_globals: {
          originator: settings.fromNumber,
          report_url: '', // Webhook para status de entrega (opcional)
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.d7ApiKey}`,
        },
        timeout: 30000,
      }
    );

    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        messageId: response.data?.request_id || 'sent',
      };
    }

    return {
      success: false,
      error: response.data?.message || 'Erro ao enviar SMS via D7',
    };
  } catch (error: any) {
    console.error('[D7] Erro:', error);

    if (error.response?.status === 401) {
      return { success: false, error: 'API Key do D7 inválida' };
    }
    if (error.response?.status === 400) {
      return {
        success: false,
        error: error.response.data?.message || 'Dados inválidos',
      };
    }
    if (error.response?.status === 402) {
      return { success: false, error: 'Saldo insuficiente na conta D7' };
    }

    return {
      success: false,
      error: error.message || 'Erro ao enviar SMS via D7',
    };
  }
}

/**
 * Serviço principal de SMS
 */
export class SmsService {
  private settings: SmsSettings | null = null;
  private smsCountThisHour: number = 0;
  private hourStartTime: Date = new Date();

  /**
   * Inicializa o serviço carregando as configurações do banco
   */
  async initialize(): Promise<boolean> {
    const dbSettings = await prisma.smsSettings.findFirst();

    if (!dbSettings) {
      console.warn('[SMS] Configurações não encontradas no banco de dados');
      return false;
    }

    this.settings = {
      provider: dbSettings.provider as 'twilio' | 'd7',
      twilioAccountSid: dbSettings.twilioAccountSid,
      twilioAuthToken: dbSettings.twilioAuthToken,
      d7ApiKey: dbSettings.d7ApiKey,
      fromNumber: dbSettings.fromNumber || '',
      maxSmsPerHour: dbSettings.maxSmsPerHour,
      isActive: dbSettings.isActive,
    };

    return true;
  }

  /**
   * Verifica se o rate limit foi atingido
   */
  private checkRateLimit(): boolean {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Reset contador se passou uma hora
    if (this.hourStartTime < hourAgo) {
      this.smsCountThisHour = 0;
      this.hourStartTime = now;
    }

    if (!this.settings) return false;

    return this.smsCountThisHour < this.settings.maxSmsPerHour;
  }

  /**
   * Envia um SMS
   */
  async send(
    to: string,
    message: string,
    options?: {
      campaignId?: string;
      automationId?: string;
      userId?: string;
    }
  ): Promise<SmsSendResult> {
    // Inicializa se necessário
    if (!this.settings) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Configurações de SMS não encontradas' };
      }
    }

    if (!this.settings!.isActive) {
      return { success: false, error: 'SMS está desativado' };
    }

    if (!this.settings!.fromNumber) {
      return { success: false, error: 'Número de origem não configurado' };
    }

    // Verifica rate limit
    if (!this.checkRateLimit()) {
      return {
        success: false,
        error: `Limite de ${this.settings!.maxSmsPerHour} SMS por hora atingido`,
      };
    }

    // Normaliza o número de telefone
    const normalizedPhone = normalizePhoneNumber(to);

    if (!isValidPhoneNumber(normalizedPhone)) {
      return { success: false, error: 'Número de telefone inválido' };
    }

    let result: SmsSendResult;

    // Envia baseado no provedor
    if (this.settings!.provider === 'twilio') {
      result = await sendTwilioSMS(this.settings!, normalizedPhone, message);
    } else if (this.settings!.provider === 'd7') {
      result = await sendD7SMS(this.settings!, normalizedPhone, message);
    } else {
      return { success: false, error: 'Provedor de SMS inválido' };
    }

    // Incrementa contador se sucesso
    if (result.success) {
      this.smsCountThisHour++;
    }

    // Registrar log se for de campanha
    if (options?.campaignId) {
      await prisma.smsCampaignLog.create({
        data: {
          campaignId: options.campaignId,
          phoneNumber: normalizedPhone,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.error || null,
          providerMessageId: result.messageId || null,
        },
      });

      // Atualizar contadores da campanha
      if (result.success) {
        await prisma.smsCampaign.update({
          where: { id: options.campaignId },
          data: { sentCount: { increment: 1 } },
        });
      } else {
        await prisma.smsCampaign.update({
          where: { id: options.campaignId },
          data: { failedCount: { increment: 1 } },
        });
      }
    }

    // Registrar log se for de automação
    if (options?.automationId) {
      await prisma.smsAutomationLog.create({
        data: {
          automationId: options.automationId,
          userId: options.userId || null,
          phoneNumber: normalizedPhone,
          message,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.error || null,
          providerMessageId: result.messageId || null,
        },
      });
    }

    return result;
  }

  /**
   * Testa a conexão com o provedor de SMS
   */
  async testConnection(testNumber: string): Promise<SmsSendResult> {
    const testMessage = 'Teste de SMS - SushiWorld. Se você recebeu esta mensagem, o SMS está funcionando corretamente!';
    return this.send(testNumber, testMessage);
  }

  /**
   * Retorna as configurações atuais
   */
  getSettings(): SmsSettings | null {
    return this.settings;
  }
}

// Instância singleton
export const smsService = new SmsService();

/**
 * Substitui variáveis na mensagem
 */
export function replaceMessageVariables(
  message: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = message;

  // Variáveis no formato {NOME} ou {{nome}}
  for (const [key, value] of Object.entries(variables)) {
    const regex1 = new RegExp(`\\{${key}\\}`, 'gi');
    const regex2 = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    const replacement = String(value || '');
    result = result.replace(regex1, replacement);
    result = result.replace(regex2, replacement);
  }

  return result;
}

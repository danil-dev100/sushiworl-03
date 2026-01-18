import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação
const sendSmsSchema = z.object({
  to: z.string().min(1, 'Número de destino é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  campaignId: z.string().optional(),
  automationId: z.string().optional(),
  userId: z.string().optional(),
});

// Função principal para enviar SMS (exportada para uso interno)
export async function sendSMS(params: {
  to: string;
  message: string;
  campaignId?: string;
  automationId?: string;
  userId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, message, campaignId, automationId, userId } = params;

  // Validar formato do número
  if (!to.startsWith('+')) {
    return { success: false, error: 'Número deve estar no formato internacional (começando com +)' };
  }

  // Buscar configurações de SMS
  const settings = await prisma.smsSettings.findFirst();

  if (!settings) {
    return { success: false, error: 'Configurações de SMS não encontradas' };
  }

  if (!settings.isActive) {
    return { success: false, error: 'SMS está desativado' };
  }

  if (!settings.fromNumber) {
    return { success: false, error: 'Número de origem não configurado' };
  }

  let result: { success: boolean; messageId?: string; error?: string };

  // Enviar SMS baseado no provedor
  if (settings.provider === 'twilio') {
    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
      return { success: false, error: 'Credenciais do Twilio não configuradas' };
    }

    result = await sendTwilioSMS({
      accountSid: settings.twilioAccountSid,
      authToken: settings.twilioAuthToken,
      from: settings.fromNumber,
      to,
      message,
    });
  } else if (settings.provider === 'd7') {
    if (!settings.d7ApiKey) {
      return { success: false, error: 'API Key do D7 não configurada' };
    }

    result = await sendD7SMS({
      apiKey: settings.d7ApiKey,
      from: settings.fromNumber,
      to,
      message,
    });
  } else {
    return { success: false, error: 'Provedor de SMS inválido' };
  }

  // Registrar log se for de campanha
  if (campaignId) {
    await prisma.smsCampaignLog.create({
      data: {
        campaignId,
        phoneNumber: to,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error || null,
        providerMessageId: result.messageId || null,
      },
    });

    // Atualizar contadores da campanha
    if (result.success) {
      await prisma.smsCampaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
      });
    } else {
      await prisma.smsCampaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      });
    }
  }

  // Registrar log se for de automação
  if (automationId) {
    await prisma.smsAutomationLog.create({
      data: {
        automationId,
        userId: userId || null,
        phoneNumber: to,
        message,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error || null,
        providerMessageId: result.messageId || null,
      },
    });
  }

  return result;
}

// POST - Enviar SMS (API route)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validar dados
    const validationResult = sendSmsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const result = await sendSMS(validationResult.data);

    if (result.success) {
      console.log('[SMS Send] SMS enviado com sucesso:', {
        to: validationResult.data.to,
        messageId: result.messageId,
      });

      return NextResponse.json({
        success: true,
        message: 'SMS enviado com sucesso!',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar SMS' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[SMS Send] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar SMS' },
      { status: 500 }
    );
  }
}

// Função para enviar SMS via Twilio
async function sendTwilioSMS({
  accountSid,
  authToken,
  from,
  to,
  message,
}: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    const smsMessage = await client.messages.create({
      body: message,
      from: from,
      to: to,
    });

    return {
      success: true,
      messageId: smsMessage.sid,
    };
  } catch (error: any) {
    console.error('[Twilio] Erro:', error);

    if (error.code === 21211) {
      return { success: false, error: 'Número de destino inválido' };
    }
    if (error.code === 21608) {
      return { success: false, error: 'Número de origem não verificado ou inválido' };
    }
    if (error.code === 20003) {
      return { success: false, error: 'Credenciais do Twilio inválidas' };
    }

    return {
      success: false,
      error: error.message || 'Erro ao enviar SMS via Twilio',
    };
  }
}

// Função para enviar SMS via D7 Networks
async function sendD7SMS({
  apiKey,
  from,
  to,
  message,
}: {
  apiKey: string;
  from: string;
  to: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
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
          originator: from,
          report_url: '',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
      return { success: false, error: error.response.data?.message || 'Dados inválidos' };
    }

    return {
      success: false,
      error: error.message || 'Erro ao enviar SMS via D7',
    };
  }
}

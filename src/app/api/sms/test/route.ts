import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação
const testSmsSchema = z.object({
  to: z.string().min(1, 'Número de destino é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
});

// POST - Enviar SMS de teste
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
    const validationResult = testSmsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { to, message } = validationResult.data;

    // Validar formato do número
    if (!to.startsWith('+')) {
      return NextResponse.json(
        { error: 'Número deve estar no formato internacional (começando com +)' },
        { status: 400 }
      );
    }

    // Buscar configurações de SMS
    const settings = await prisma.smsSettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: 'Configurações de SMS não encontradas. Configure primeiro.' },
        { status: 400 }
      );
    }

    if (!settings.isActive) {
      return NextResponse.json(
        { error: 'SMS está desativado. Ative nas configurações.' },
        { status: 400 }
      );
    }

    if (!settings.fromNumber) {
      return NextResponse.json(
        { error: 'Número de origem não configurado.' },
        { status: 400 }
      );
    }

    let result;

    // Enviar SMS baseado no provedor
    if (settings.provider === 'twilio') {
      if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
        return NextResponse.json(
          { error: 'Credenciais do Twilio não configuradas.' },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: 'API Key do D7 não configurada.' },
          { status: 400 }
        );
      }

      result = await sendD7SMS({
        apiKey: settings.d7ApiKey,
        from: settings.fromNumber,
        to,
        message,
      });
    } else {
      return NextResponse.json(
        { error: 'Provedor de SMS inválido.' },
        { status: 400 }
      );
    }

    if (result.success) {
      console.log('[SMS Test] SMS de teste enviado com sucesso:', {
        to,
        provider: settings.provider,
        messageId: result.messageId,
      });

      return NextResponse.json({
        success: true,
        message: 'SMS de teste enviado com sucesso!',
        messageId: result.messageId,
      });
    } else {
      console.error('[SMS Test] Erro ao enviar SMS:', result.error);
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar SMS' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[SMS Test] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar SMS de teste' },
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
    // Usar Twilio SDK
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

    // Tratar erros específicos do Twilio
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
          report_url: '', // Webhook opcional para status
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

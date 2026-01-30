import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import axios from 'axios';

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

    let { to, message } = validationResult.data;

    // Limpar número (remover espaços e caracteres especiais)
    to = to.replace(/[\s\-\(\)]/g, '');

    // Se não começar com +, adicionar +351 (Portugal) automaticamente
    if (!to.startsWith('+')) {
      // Se começar com 00, substituir por +
      if (to.startsWith('00')) {
        to = '+' + to.substring(2);
      }
      // Se começar com 9 (número português), adicionar +351
      else if (to.startsWith('9')) {
        to = '+351' + to;
      }
      // Outros casos, tentar adicionar +351
      else {
        to = '+351' + to;
      }
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

    let result;

    // Enviar SMS baseado no provedor
    if (settings.provider === 'twilio') {
      // Twilio requer número de origem
      if (!settings.fromNumber) {
        return NextResponse.json(
          { error: 'Número de origem é obrigatório para Twilio.' },
          { status: 400 }
        );
      }

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

      // D7 Networks: fromNumber é opcional (pode ser Sender ID alfanumérico ou vazio)
      result = await sendD7SMS({
        apiKey: settings.d7ApiKey,
        from: settings.fromNumber || 'SMSINFO', // Fallback para Sender ID padrão se não configurado
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    console.log('[D7] Iniciando envio de SMS:', { to, from, messageLength: message.length });

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

    console.log('[D7] Resposta recebida:', { status: response.status, data: response.data });

    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        messageId: response.data?.request_id || 'sent',
      };
    }

    return {
      success: false,
      error: response.data?.message || response.data?.detail || 'Erro ao enviar SMS via D7',
    };
  } catch (error: any) {
    console.error('[D7] Erro completo:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    });

    // Erros específicos da API D7
    if (error.response?.status === 401) {
      return { success: false, error: 'API Key do D7 inválida ou expirada' };
    }
    if (error.response?.status === 400) {
      const detail = error.response.data?.detail || error.response.data?.message;
      return { success: false, error: detail || 'Dados inválidos na requisição' };
    }
    if (error.response?.status === 403) {
      return { success: false, error: 'Acesso negado - verifique suas permissões no D7' };
    }
    if (error.response?.status === 422) {
      return { success: false, error: 'Formato de número de telefone inválido' };
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return { success: false, error: 'Não foi possível conectar à API do D7' };
    }

    return {
      success: false,
      error: error.response?.data?.detail || error.response?.data?.message || error.message || 'Erro desconhecido ao enviar SMS',
    };
  }
}

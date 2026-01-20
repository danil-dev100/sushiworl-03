import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Enviar campanha
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Buscar campanha
    const campaign = await prisma.smsCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se pode enviar
    if (campaign.status === 'completed') {
      return NextResponse.json(
        { error: 'Esta campanha já foi enviada' },
        { status: 400 }
      );
    }

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Esta campanha já está em envio' },
        { status: 400 }
      );
    }

    // Verificar configurações de SMS
    const settings = await prisma.smsSettings.findFirst();
    if (!settings || !settings.isActive) {
      return NextResponse.json(
        { error: 'SMS não está configurado ou ativo' },
        { status: 400 }
      );
    }

    // Atualizar status para 'sending'
    await prisma.smsCampaign.update({
      where: { id },
      data: { status: 'sending' },
    });

    // Disparar envio em background
    sendCampaignInBackground(id, settings);

    return NextResponse.json({
      success: true,
      message: 'Campanha iniciada! Os SMS estão sendo enviados.',
    });
  } catch (error) {
    console.error('[SMS Campaign Send] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar campanha' },
      { status: 500 }
    );
  }
}

// Função para enviar campanha em background
async function sendCampaignInBackground(campaignId: string, settings: any) {
  try {
    // Buscar campanha
    const campaign = await prisma.smsCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return;

    const targetAudience = campaign.targetAudience as any;

    // Buscar clientes baseado no público-alvo
    const customers = await getTargetCustomers(targetAudience?.type || 'all');

    let sentCount = 0;
    let failedCount = 0;

    // Enviar SMS para cada cliente
    for (const customer of customers) {
      if (!customer.phone) continue;

      try {
        // Personalizar mensagem
        let personalizedMessage = campaign.message;
        personalizedMessage = personalizedMessage.replace(/{NOME}/g, customer.name || 'Cliente');

        // Enviar SMS
        const result = await sendSMS(settings, customer.phone, personalizedMessage);

        // Registrar log
        await prisma.smsCampaignLog.create({
          data: {
            campaignId,
            phoneNumber: customer.phone,
            status: result.success ? 'sent' : 'failed',
            providerMessageId: result.messageId,
            errorMessage: result.error,
            sentAt: new Date(),
          },
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }

        // Atualizar contagem parcial
        if ((sentCount + failedCount) % 10 === 0) {
          await prisma.smsCampaign.update({
            where: { id: campaignId },
            data: { sentCount, failedCount },
          });
        }

        // Aguardar um pouco entre envios para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failedCount++;
        console.error('[SMS Campaign] Erro ao enviar para:', customer.phone, error);
      }
    }

    // Atualizar campanha como concluída
    await prisma.smsCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'completed',
        sentCount,
        failedCount,
      },
    });

    console.log(`[SMS Campaign] Campanha ${campaignId} concluída: ${sentCount} enviados, ${failedCount} falhas`);
  } catch (error) {
    console.error('[SMS Campaign] Erro no envio em background:', error);
    await prisma.smsCampaign.update({
      where: { id: campaignId },
      data: { status: 'cancelled' },
    });
  }
}

// Função para buscar clientes baseado no público-alvo
async function getTargetCustomers(audienceType: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Base: usuários com role CUSTOMER e telefone
  let where: any = {
    role: 'CUSTOMER',
    phone: { not: null },
  };

  switch (audienceType) {
    case 'active':
      const activeOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      const activeIds = activeOrders.map(o => o.userId).filter(Boolean) as string[];
      if (activeIds.length > 0) {
        where.id = { in: activeIds };
      } else {
        return [];
      }
      break;

    case 'inactive':
      const recentOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: sixtyDaysAgo },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      const recentIds = recentOrders.map(o => o.userId).filter(Boolean) as string[];
      if (recentIds.length > 0) {
        where.id = { notIn: recentIds };
      }
      break;

    case 'new':
      where.createdAt = { gte: sevenDaysAgo };
      break;

    case 'all':
    default:
      break;
  }

  const customers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
    },
  });

  return customers;
}

// Função para enviar SMS
async function sendSMS(
  settings: any,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Formatar número
  let phone = to.replace(/\D/g, '');
  if (!phone.startsWith('+')) {
    if (phone.startsWith('55')) {
      phone = '+' + phone;
    } else {
      phone = '+55' + phone;
    }
  }

  if (settings.provider === 'twilio') {
    try {
      const twilio = require('twilio');
      const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);

      const smsMessage = await client.messages.create({
        body: message,
        from: settings.fromNumber,
        to: phone,
      });

      return { success: true, messageId: smsMessage.sid };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  } else if (settings.provider === 'd7') {
    try {
      const axios = require('axios');

      const response = await axios.post(
        'https://api.d7networks.com/messages/v1/send',
        {
          messages: [{
            channel: 'sms',
            recipients: [phone],
            content: message,
            msg_type: 'text',
            data_coding: 'text',
          }],
          message_globals: {
            originator: settings.fromNumber,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.d7ApiKey}`,
          },
          timeout: 30000,
        }
      );

      return { success: true, messageId: response.data?.request_id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: 'Provedor não configurado' };
}

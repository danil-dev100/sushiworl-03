import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Fórmula para evitar sobreposição de públicos:
 *
 * REGRA GERAL: Só envia para clientes que JÁ FIZERAM COMPRA (verificação obrigatória)
 *
 * Públicos usam intervalos exclusivos para garantir que nenhum cliente receba
 * mensagens duplicadas de segmentos diferentes.
 */

// Helper para calcular datas
function getDateRange(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

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
    const audienceType = targetAudience?.type || 'all';
    const contactListId = targetAudience?.contactListId || campaign.contactListId;
    const treatAsFirstPurchase = targetAudience?.treatAsFirstPurchase || false;

    // Buscar destinatários
    let recipients: { phone: string; name: string | null; isFirstPurchase?: boolean }[] = [];

    if (audienceType === 'list' && contactListId) {
      // Buscar da lista de contatos importada
      const listRecipients = await getContactListRecipients(contactListId);

      // Se tratAsFirstPurchase, marcar todos como primeira compra
      recipients = listRecipients.map(r => ({
        ...r,
        isFirstPurchase: treatAsFirstPurchase,
      }));

      // Atualizar contatos da lista para indicar que foram tratados como primeira compra
      if (treatAsFirstPurchase) {
        console.log(`[SMS Campaign] Lista ${contactListId} marcada como primeira compra para ${recipients.length} contatos`);
      }
    } else {
      // Buscar dos clientes do sistema
      recipients = await getTargetCustomers(audienceType);
    }

    let sentCount = 0;
    let failedCount = 0;

    // Enviar SMS para cada destinatário
    for (const recipient of recipients) {
      if (!recipient.phone) continue;

      try {
        // Personalizar mensagem
        let personalizedMessage = campaign.message;
        personalizedMessage = personalizedMessage.replace(/{NOME}/g, recipient.name || 'Cliente');

        // Enviar SMS
        const result = await sendSMS(settings, recipient.phone, personalizedMessage);

        // Registrar log
        await prisma.smsCampaignLog.create({
          data: {
            campaignId,
            phoneNumber: recipient.phone,
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
        console.error('[SMS Campaign] Erro ao enviar para:', recipient.phone, error);
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

// Função para buscar destinatários de uma lista de contatos importada
async function getContactListRecipients(listId: string): Promise<{ phone: string; name: string | null }[]> {
  const contacts = await prisma.smsContact.findMany({
    where: {
      listId,
      isValid: true,
      isOptedOut: false,
    },
    select: {
      phoneNumber: true,
      name: true,
    },
  });

  return contacts.map(c => ({
    phone: c.phoneNumber,
    name: c.name,
  }));
}

// Função para buscar clientes baseado no público-alvo
// IMPORTANTE: Todos os públicos garantem que o cliente JÁ FEZ PELO MENOS 1 COMPRA
async function getTargetCustomers(audienceType: string): Promise<{ phone: string; name: string | null }[]> {
  // Datas de referência
  const hours24 = getDateRange(1);
  const hours72 = getDateRange(3);
  const days7 = getDateRange(7);
  const days14 = getDateRange(14);
  const days21 = getDateRange(21);
  const days30 = getDateRange(30);
  const days45 = getDateRange(45);
  const days60 = getDateRange(60);

  let userIds: string[] = [];

  switch (audienceType) {
    case 'all': {
      // Todos os clientes que já fizeram pelo menos 1 pedido
      const orders = await prisma.order.findMany({
        where: { userId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      });
      userIds = orders.map(o => o.userId).filter(Boolean) as string[];
      break;
    }

    case 'active': {
      // Clientes que compraram nos últimos 30 dias
      const orders = await prisma.order.findMany({
        where: {
          userId: { not: null },
          createdAt: { gte: days30 },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      userIds = orders.map(o => o.userId).filter(Boolean) as string[];
      break;
    }

    case 'new': {
      // Clientes cadastrados nos últimos 7 dias que já fizeram pelo menos 1 pedido
      const newUsers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: days7 },
        },
        select: { id: true },
      });
      const newUserIds = newUsers.map(u => u.id);

      if (newUserIds.length > 0) {
        const orders = await prisma.order.findMany({
          where: {
            userId: { in: newUserIds },
          },
          select: { userId: true },
          distinct: ['userId'],
        });
        userIds = orders.map(o => o.userId).filter(Boolean) as string[];
      }
      break;
    }

    case 'first_purchase_24h': {
      // Primeira compra entre 24h e 72h atrás (exclusivo)
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _min: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const firstOrder = u._min.createdAt;
          if (!firstOrder) return false;
          return firstOrder <= hours24 && firstOrder > hours72;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    case 'first_purchase_72h': {
      // Primeira compra entre 72h e 7 dias atrás (exclusivo)
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _min: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const firstOrder = u._min.createdAt;
          if (!firstOrder) return false;
          return firstOrder <= hours72 && firstOrder > days7;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    case 'last_purchase_7d': {
      // Última compra entre 7 e 14 dias atrás (exclusivo)
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const lastOrder = u._max.createdAt;
          if (!lastOrder) return false;
          return lastOrder <= days7 && lastOrder > days14;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    case 'last_purchase_14d': {
      // Última compra entre 14 e 21 dias atrás (exclusivo)
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const lastOrder = u._max.createdAt;
          if (!lastOrder) return false;
          return lastOrder <= days14 && lastOrder > days21;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    case 'last_purchase_21d': {
      // Última compra entre 21 e 30 dias atrás (exclusivo)
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const lastOrder = u._max.createdAt;
          if (!lastOrder) return false;
          return lastOrder <= days21 && lastOrder > days30;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    case 'inactive_30d': {
      // Última compra entre 30 e 45 dias atrás (exclusivo)
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const lastOrder = u._max.createdAt;
          if (!lastOrder) return false;
          return lastOrder <= days30 && lastOrder > days45;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    case 'inactive_45d': {
      // Última compra entre 45 e 60 dias atrás (exclusivo)
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const lastOrder = u._max.createdAt;
          if (!lastOrder) return false;
          return lastOrder <= days45 && lastOrder > days60;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    case 'inactive_60d':
    case 'inactive': {
      // Última compra há 60+ dias
      const usersWithOrders = await prisma.order.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
        where: { userId: { not: null } },
      });

      userIds = usersWithOrders
        .filter(u => {
          const lastOrder = u._max.createdAt;
          if (!lastOrder) return false;
          return lastOrder <= days60;
        })
        .map(u => u.userId)
        .filter(Boolean) as string[];
      break;
    }

    default:
      return [];
  }

  if (userIds.length === 0) {
    return [];
  }

  // Buscar dados dos clientes (apenas com telefone)
  const customers = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      phone: { not: null },
    },
    select: {
      name: true,
      phone: true,
    },
  });

  return customers.map(c => ({
    phone: c.phone!,
    name: c.name,
  }));
}

// Função para enviar SMS usando o serviço centralizado
async function sendSMS(
  settings: any,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Importar o serviço de SMS
  const { normalizePhoneNumber } = await import('@/lib/sms-service');

  // Normalizar número (agora usa +351 como padrão para Portugal)
  const phone = normalizePhoneNumber(to);

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

      const payload: any = {
        messages: [{
          channel: 'sms',
          recipients: [phone],
          content: message,
          msg_type: 'text',
          data_coding: 'text',
        }],
      };

      // Adicionar originator apenas se configurado
      if (settings.fromNumber) {
        payload.message_globals = {
          originator: settings.fromNumber,
        };
      }

      const response = await axios.post(
        'https://api.d7networks.com/messages/v1/send',
        payload,
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

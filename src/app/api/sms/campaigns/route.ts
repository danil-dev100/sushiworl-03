import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação
const campaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  promotionId: z.string().nullable().optional(),
  targetAudience: z.object({
    type: z.enum(['all', 'active', 'inactive', 'new']),
    filters: z.record(z.any()).optional(),
  }).optional(),
  scheduledFor: z.string().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'sending']).optional(),
});

// GET - Listar campanhas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const campaigns = await prisma.smsCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Buscar promoções associadas
    const campaignsWithPromo = await Promise.all(
      campaigns.map(async (campaign) => {
        let promotion = null;
        const targetAudience = campaign.targetAudience as any;

        if (targetAudience?.promotionId) {
          promotion = await prisma.promotion.findUnique({
            where: { id: targetAudience.promotionId },
            select: {
              id: true,
              name: true,
              code: true,
              discountType: true,
              discountValue: true,
            },
          });
        }

        return {
          ...campaign,
          promotionId: targetAudience?.promotionId || null,
          promotion,
          // Mapear scheduledAt para scheduledFor para o frontend
          scheduledFor: campaign.scheduledAt,
          targetAudience: {
            type: targetAudience?.type || 'all',
            filters: targetAudience?.filters,
          },
        };
      })
    );

    return NextResponse.json({ campaigns: campaignsWithPromo });
  } catch (error) {
    console.error('[SMS Campaigns] Erro ao listar:', error);
    return NextResponse.json(
      { error: 'Erro ao listar campanhas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova campanha
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
    const validationResult = campaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, message, promotionId, targetAudience, scheduledFor, status } = validationResult.data;

    // Verificar se promoção existe (se informada)
    if (promotionId) {
      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
      });
      if (!promotion) {
        return NextResponse.json(
          { error: 'Promoção não encontrada' },
          { status: 400 }
        );
      }
    }

    const campaign = await prisma.smsCampaign.create({
      data: {
        name,
        message,
        status: status || 'draft',
        scheduledAt: scheduledFor ? new Date(scheduledFor) : undefined,
        targetAudience: {
          ...targetAudience,
          promotionId: promotionId || null,
        },
      },
    });

    // Se status for 'sending', iniciar envio
    if (status === 'sending') {
      // Disparar envio em background
      sendCampaignInBackground(campaign.id);
    }

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('[SMS Campaigns] Erro ao criar:', error);
    return NextResponse.json(
      { error: 'Erro ao criar campanha' },
      { status: 500 }
    );
  }
}

// Função para enviar campanha em background
async function sendCampaignInBackground(campaignId: string) {
  try {
    // Buscar campanha
    const campaign = await prisma.smsCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return;

    const targetAudience = campaign.targetAudience as any;

    // Buscar configurações de SMS
    const settings = await prisma.smsSettings.findFirst();
    if (!settings || !settings.isActive) {
      await prisma.smsCampaign.update({
        where: { id: campaignId },
        data: { status: 'cancelled' },
      });
      return;
    }

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

        // Aguardar um pouco entre envios para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failedCount++;
        console.error('[SMS Campaign] Erro ao enviar para:', customer.phone, error);
      }
    }

    // Atualizar campanha
    await prisma.smsCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'completed',
        sentCount,
        failedCount,
      },
    });
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
      // Clientes com pedidos nos últimos 30 dias
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
      // Clientes sem pedidos há mais de 60 dias
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
      // Clientes cadastrados nos últimos 7 dias
      where.createdAt = { gte: sevenDaysAgo };
      break;

    case 'all':
    default:
      // Todos os clientes com telefone
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

// Função para enviar SMS usando o serviço centralizado
async function sendSMS(
  settings: any,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Importar o serviço de SMS
  const { smsService, normalizePhoneNumber } = await import('@/lib/sms-service');

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

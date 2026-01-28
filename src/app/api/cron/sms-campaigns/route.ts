import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { smsService, replaceMessageVariables, normalizePhoneNumber } from '@/lib/sms-service';

/**
 * Cron job para processar campanhas SMS agendadas
 * Executa as campanhas que estão agendadas para o horário atual
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[SMS Cron] Verificando campanhas agendadas...');

    const now = new Date();

    // Buscar campanhas agendadas que devem ser enviadas agora
    // (status = 'scheduled' e scheduledAt <= agora)
    const scheduledCampaigns = await prisma.smsCampaign.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: now,
        },
      },
    });

    console.log(`[SMS Cron] Encontradas ${scheduledCampaigns.length} campanhas para enviar`);

    const results: Array<{ id: string; name: string; success: boolean; sent: number; failed: number }> = [];

    for (const campaign of scheduledCampaigns) {
      try {
        // Atualizar status para 'sending'
        await prisma.smsCampaign.update({
          where: { id: campaign.id },
          data: { status: 'sending' },
        });

        // Enviar a campanha
        const result = await sendCampaign(campaign);

        results.push({
          id: campaign.id,
          name: campaign.name,
          success: true,
          sent: result.sent,
          failed: result.failed,
        });

        console.log(`[SMS Cron] Campanha "${campaign.name}" concluída: ${result.sent} enviados, ${result.failed} falhas`);
      } catch (error) {
        console.error(`[SMS Cron] Erro ao enviar campanha ${campaign.id}:`, error);

        // Marcar como cancelada em caso de erro
        await prisma.smsCampaign.update({
          where: { id: campaign.id },
          data: { status: 'cancelled' },
        });

        results.push({
          id: campaign.id,
          name: campaign.name,
          success: false,
          sent: 0,
          failed: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: scheduledCampaigns.length,
      results,
    });
  } catch (error) {
    console.error('[SMS Cron] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar campanhas' }, { status: 500 });
  }
}

/**
 * Envia uma campanha para todos os destinatários
 */
async function sendCampaign(campaign: any): Promise<{ sent: number; failed: number }> {
  const targetAudience = campaign.targetAudience as any;
  const audienceType = targetAudience?.type || 'all';

  // Buscar clientes baseado no público-alvo
  const customers = await getTargetCustomers(audienceType);

  // Atualizar total de destinatários
  await prisma.smsCampaign.update({
    where: { id: campaign.id },
    data: { totalRecipients: customers.length },
  });

  let sentCount = 0;
  let failedCount = 0;

  // Enviar SMS para cada cliente
  for (const customer of customers) {
    if (!customer.phone) continue;

    try {
      // Personalizar mensagem
      const variables: Record<string, string | number | undefined> = {
        NOME: customer.name || 'Cliente',
        customerName: customer.name || 'Cliente',
      };

      // Adicionar variáveis de promoção se existirem
      if (targetAudience?.promotionId) {
        const promotion = await prisma.promotion.findUnique({
          where: { id: targetAudience.promotionId },
        });
        if (promotion) {
          variables.CUPOM = promotion.code;
          variables.DESCONTO = promotion.discountType === 'PERCENTAGE'
            ? `${promotion.discountValue}%`
            : `€${promotion.discountValue.toFixed(2)}`;
        }
      }

      const personalizedMessage = replaceMessageVariables(campaign.message, variables);

      // Enviar SMS
      const result = await smsService.send(customer.phone, personalizedMessage, {
        campaignId: campaign.id,
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Aguardar um pouco entre envios para rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      failedCount++;
      console.error(`[SMS Cron] Erro ao enviar para ${customer.phone}:`, error);
    }
  }

  // Atualizar campanha como concluída
  await prisma.smsCampaign.update({
    where: { id: campaign.id },
    data: {
      status: 'completed',
      sentCount,
      failedCount,
    },
  });

  return { sent: sentCount, failed: failedCount };
}

/**
 * Busca clientes baseado no tipo de audiência
 */
async function getTargetCustomers(audienceType: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
    },
  });
}

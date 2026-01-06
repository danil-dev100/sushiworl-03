import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Verificar configuração SMTP
    const smtpSettings = await prisma.smtpSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // 2. Verificar fluxos de email
    const flows = await prisma.emailAutomation.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        isDraft: true,
        flow: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Verificar logs de execução recentes
    const recentLogs = await prisma.emailAutomationLog.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' },
      select: {
        id: true,
        trigger: true,
        status: true,
        executedAt: true,
        automation: {
          select: {
            name: true
          }
        }
      }
    });

    // 4. Analisar cada fluxo
    const flowsAnalysis = flows.map(flow => {
      const flowData = flow.flow as any;
      const nodes = flowData?.nodes || [];
      const edges = flowData?.edges || [];

      const triggerNode = nodes.find((n: any) => n.type === 'trigger');
      const emailNodes = nodes.filter((n: any) => n.type === 'email');

      return {
        id: flow.id,
        name: flow.name,
        isActive: flow.isActive,
        isDraft: flow.isDraft,
        status: flow.isActive && !flow.isDraft ? '✅ ATIVO - Vai enviar emails' :
                flow.isDraft ? '⚠️ RASCUNHO - Não vai enviar' :
                '❌ INATIVO - Não vai enviar',
        triggerType: triggerNode?.data?.eventType || 'Não configurado',
        hasEmailNodes: emailNodes.length > 0,
        emailNodesCount: emailNodes.length,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        createdAt: flow.createdAt.toISOString(),
        updatedAt: flow.updatedAt.toISOString(),
      };
    });

    // 5. Verificar se há fluxos ativos para "order_created"
    const activeOrderFlows = flowsAnalysis.filter(f =>
      f.isActive &&
      !f.isDraft &&
      f.triggerType === 'order_created'
    );

    return NextResponse.json({
      smtp: {
        configured: !!smtpSettings,
        server: smtpSettings?.smtpServer || 'Não configurado',
        port: smtpSettings?.smtpPort || 'N/A',
        fromEmail: smtpSettings?.defaultFromEmail || 'N/A',
        fromName: smtpSettings?.defaultFromName || 'N/A',
      },
      flows: {
        total: flows.length,
        active: flows.filter(f => f.isActive && !f.isDraft).length,
        inactive: flows.filter(f => !f.isActive && !f.isDraft).length,
        drafts: flows.filter(f => f.isDraft).length,
        activeOrderCreatedFlows: activeOrderFlows.length,
        list: flowsAnalysis,
      },
      recentExecutions: recentLogs.map(log => ({
        automation: log.automation?.name || 'Desconhecido',
        trigger: log.trigger,
        status: log.status,
        executedAt: log.executedAt.toISOString(),
      })),
      summary: {
        smtpReady: !!smtpSettings,
        hasActiveFlows: flows.some(f => f.isActive && !f.isDraft),
        willSendEmailsOnNewOrder: activeOrderFlows.length > 0,
        recommendation: activeOrderFlows.length > 0
          ? '✅ Tudo configurado! Emails serão enviados quando houver novos pedidos.'
          : smtpSettings && flows.some(f => !f.isDraft)
          ? '⚠️ SMTP configurado mas NENHUM fluxo ativo com trigger "order_created". Ative um fluxo!'
          : !smtpSettings
          ? '❌ Configure o SMTP primeiro em /admin/marketing/email/settings'
          : '❌ Crie e ative um fluxo em /admin/marketing/email-marketing/builder/new'
      }
    });

  } catch (error) {
    console.error('[Debug Email Status] Erro:', error);
    return NextResponse.json({
      error: 'Erro ao verificar status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

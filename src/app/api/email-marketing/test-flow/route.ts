import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { executeEmailFlow, FlowExecutionContext } from '@/lib/email-flow-executor';

// POST /api/email-marketing/test-flow - Testar execução de fluxo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { flowId, testContext } = body;

    if (!flowId) {
      return NextResponse.json(
        { error: 'ID do fluxo é obrigatório' },
        { status: 400 }
      );
    }

    // Contexto de teste
    const context: FlowExecutionContext = {
      customerEmail: testContext?.customerEmail || 'teste@sushiworld.com',
      customerName: testContext?.customerName || 'Cliente Teste',
      orderId: testContext?.orderId || 'TEST-001',
      orderValue: testContext?.orderValue || 50.00,
      triggerType: testContext?.triggerType || 'order_created',
      metadata: testContext?.metadata || {},
      ...testContext,
    };

    // Executar fluxo
    await executeEmailFlow(flowId, context);

    return NextResponse.json({
      success: true,
      message: 'Fluxo executado com sucesso',
      context,
    });

  } catch (error) {
    console.error('Erro ao testar fluxo:', error);
    return NextResponse.json(
      {
        error: 'Erro ao executar fluxo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}


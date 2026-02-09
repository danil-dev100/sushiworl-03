import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação para atualização
const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  promotionId: z.string().nullable().optional(),
  targetAudience: z.object({
    type: z.enum(['all', 'active', 'inactive', 'new']),
    filters: z.record(z.any()).optional(),
  }).optional(),
  scheduledFor: z.string().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'cancelled']).optional(),
});

// GET - Buscar campanha específica
export async function GET(
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

    const campaign = await prisma.smsCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    // Buscar logs
    const logs = await prisma.smsCampaignLog.findMany({
      where: { campaignId: id },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    // Buscar promoção se existir
    const targetAudience = campaign.targetAudience as any;
    let promotion = null;
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

    return NextResponse.json({
      campaign: {
        ...campaign,
        promotionId: targetAudience?.promotionId || null,
        promotion,
        targetAudience: {
          type: targetAudience?.type || 'all',
          filters: targetAudience?.filters,
        },
      },
      logs,
    });
  } catch (error) {
    console.error('[SMS Campaign] Erro ao buscar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar campanha' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar campanha
export async function PUT(
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
    const body = await request.json();

    // Verificar se campanha existe
    const existingCampaign = await prisma.smsCampaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    // Não permitir edição de campanhas já enviadas
    if (existingCampaign.status === 'completed' || existingCampaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Não é possível editar campanhas já enviadas' },
        { status: 400 }
      );
    }

    // Validar dados
    const validationResult = updateCampaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, message, promotionId, targetAudience, scheduledFor, status } = validationResult.data;

    // Preparar dados de atualização
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (message !== undefined) updateData.message = message;
    if (scheduledFor !== undefined) {
      updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    }
    if (status !== undefined) updateData.status = status;

    if (targetAudience !== undefined || promotionId !== undefined) {
      const currentAudience = existingCampaign.targetAudience as any || {};
      updateData.targetAudience = {
        ...currentAudience,
        ...(targetAudience || {}),
        promotionId: promotionId !== undefined ? promotionId : currentAudience.promotionId,
      };
    }

    const campaign = await prisma.smsCampaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('[SMS Campaign] Erro ao atualizar:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar campanha' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir campanha
export async function DELETE(
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

    // Verificar se campanha existe
    const campaign = await prisma.smsCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    // Não permitir exclusão de campanhas em envio
    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Não é possível excluir campanhas em envio' },
        { status: 400 }
      );
    }

    // Excluir logs primeiro
    await prisma.smsCampaignLog.deleteMany({
      where: { campaignId: id },
    });

    // Excluir campanha
    await prisma.smsCampaign.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Campanha excluída com sucesso',
    });
  } catch (error) {
    console.error('[SMS Campaign] Erro ao excluir:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir campanha' },
      { status: 500 }
    );
  }
}

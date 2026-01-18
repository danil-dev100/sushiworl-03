import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validação
const smsSettingsSchema = z.object({
  provider: z.enum(['twilio', 'd7']),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  d7ApiKey: z.string().optional(),
  fromNumber: z.string().min(1, 'Número de origem é obrigatório'),
  maxSmsPerHour: z.string().transform((val) => parseInt(val) || 100),
  isActive: z.boolean(),
});

// GET - Buscar configurações
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const settings = await prisma.smsSettings.findFirst();

    return NextResponse.json({
      settings: settings || null,
    });
  } catch (error) {
    console.error('[SMS Settings GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações de SMS' },
      { status: 500 }
    );
  }
}

// POST - Salvar configurações
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
    const validationResult = smsSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validações específicas por provedor
    if (data.provider === 'twilio') {
      if (!data.twilioAccountSid || !data.twilioAuthToken) {
        return NextResponse.json(
          { error: 'Account SID e Auth Token são obrigatórios para Twilio' },
          { status: 400 }
        );
      }
    } else if (data.provider === 'd7') {
      if (!data.d7ApiKey) {
        return NextResponse.json(
          { error: 'API Key é obrigatória para D7 Networks' },
          { status: 400 }
        );
      }
    }

    // Validar formato do número
    if (!data.fromNumber.startsWith('+')) {
      return NextResponse.json(
        { error: 'Número de origem deve começar com + (formato internacional)' },
        { status: 400 }
      );
    }

    // Buscar configuração existente
    const existingSettings = await prisma.smsSettings.findFirst();

    let settings;

    if (existingSettings) {
      // Atualizar
      settings = await prisma.smsSettings.update({
        where: { id: existingSettings.id },
        data: {
          provider: data.provider,
          twilioAccountSid: data.twilioAccountSid || null,
          twilioAuthToken: data.twilioAuthToken || null,
          d7ApiKey: data.d7ApiKey || null,
          fromNumber: data.fromNumber,
          maxSmsPerHour: data.maxSmsPerHour,
          isActive: data.isActive,
        },
      });
    } else {
      // Criar novo
      settings = await prisma.smsSettings.create({
        data: {
          provider: data.provider,
          twilioAccountSid: data.twilioAccountSid || null,
          twilioAuthToken: data.twilioAuthToken || null,
          d7ApiKey: data.d7ApiKey || null,
          fromNumber: data.fromNumber,
          maxSmsPerHour: data.maxSmsPerHour,
          isActive: data.isActive,
        },
      });
    }

    console.log('[SMS Settings] Configurações salvas:', {
      provider: settings.provider,
      fromNumber: settings.fromNumber,
      isActive: settings.isActive,
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[SMS Settings POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações de SMS' },
      { status: 500 }
    );
  }
}

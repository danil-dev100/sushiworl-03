import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email-marketing/settings - Buscar configurações SMTP
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const settings = await prisma.smtpSettings.findFirst();

    if (!settings) {
      // Retornar configurações padrão vazias
      return NextResponse.json({
        settings: {
          smtpServer: 'smtp.gmail.com',
          smtpPort: '587',
          smtpUser: '',
          smtpPassword: '',
          useTls: true,
          defaultFromName: 'SushiWorld',
          defaultFromEmail: 'pedidosushiworld@gmail.com',
          minDelaySeconds: '60',
          maxDelaySeconds: '300',
          maxEmailsPerHour: '100',
          emailRetentionDays: '30',
        }
      });
    }

    return NextResponse.json({
      settings: {
        smtpServer: settings.smtpServer,
        smtpPort: String(settings.smtpPort),
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '', // Em produção, não retornar a senha
        useTls: settings.useTls,
        defaultFromName: settings.defaultFromName,
        defaultFromEmail: settings.defaultFromEmail,
        minDelaySeconds: String(settings.minDelaySeconds),
        maxDelaySeconds: String(settings.maxDelaySeconds),
        maxEmailsPerHour: String(settings.maxEmailsPerHour),
        emailRetentionDays: String(settings.emailRetentionDays),
      }
    });

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/email-marketing/settings - Salvar configurações SMTP
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      smtpServer,
      smtpPort,
      smtpUser,
      smtpPassword,
      useTls,
      defaultFromName,
      defaultFromEmail,
      minDelaySeconds,
      maxDelaySeconds,
      maxEmailsPerHour,
      emailRetentionDays,
    } = body;

    // Validações
    if (!smtpServer?.trim()) {
      return NextResponse.json(
        { error: 'Servidor SMTP é obrigatório' },
        { status: 400 }
      );
    }

    if (!smtpPort?.trim()) {
      return NextResponse.json(
        { error: 'Porta SMTP é obrigatória' },
        { status: 400 }
      );
    }

    if (!smtpUser?.trim()) {
      return NextResponse.json(
        { error: 'Usuário SMTP é obrigatório' },
        { status: 400 }
      );
    }

    if (!smtpPassword?.trim()) {
      return NextResponse.json(
        { error: 'Senha SMTP é obrigatória' },
        { status: 400 }
      );
    }

    if (!defaultFromName?.trim()) {
      return NextResponse.json(
        { error: 'Nome do remetente é obrigatório' },
        { status: 400 }
      );
    }

    if (!defaultFromEmail?.trim()) {
      return NextResponse.json(
        { error: 'Email do remetente é obrigatório' },
        { status: 400 }
      );
    }

    if (!defaultFromEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Email do remetente deve ser válido' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma configuração (tabela global, sem createdBy)
    const existingConfig = await prisma.smtpSettings.findFirst();

    const configData = {
      smtpServer: smtpServer.trim(),
      smtpPort: parseInt(smtpPort) || 587,
      smtpUser: smtpUser.trim(),
      smtpPassword, // Em produção, criptografar
      useTls: useTls ?? true,
      defaultFromName: defaultFromName.trim(),
      defaultFromEmail: defaultFromEmail.trim(),
      minDelaySeconds: Math.max(1, parseInt(minDelaySeconds) || 60),
      maxDelaySeconds: Math.max(1, parseInt(maxDelaySeconds) || 300),
      maxEmailsPerHour: Math.max(1, parseInt(maxEmailsPerHour) || 100),
      emailRetentionDays: Math.max(1, parseInt(emailRetentionDays) || 30),
    };

    let savedConfig;

    if (existingConfig) {
      // Atualizar configuração existente
      savedConfig = await prisma.smtpSettings.update({
        where: { id: existingConfig.id },
        data: configData,
      });
    } else {
      // Criar nova configuração
      savedConfig = await prisma.smtpSettings.create({
        data: configData,
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        smtpServer: savedConfig.smtpServer,
        smtpPort: String(savedConfig.smtpPort),
        smtpUser: savedConfig.smtpUser || '',
        useTls: savedConfig.useTls,
        defaultFromName: savedConfig.defaultFromName,
        defaultFromEmail: savedConfig.defaultFromEmail,
        minDelaySeconds: String(savedConfig.minDelaySeconds),
        maxDelaySeconds: String(savedConfig.maxDelaySeconds),
        maxEmailsPerHour: String(savedConfig.maxEmailsPerHour),
        emailRetentionDays: String(savedConfig.emailRetentionDays),
      }
    });

  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


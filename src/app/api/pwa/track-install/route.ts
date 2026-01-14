import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * API para rastrear cliques e instalações do PWA
 * POST /api/pwa/track-install
 *
 * Segurança:
 * - Nunca armazena IP real, apenas hash
 * - Dados anônimos
 * - Rate limit por IP hash
 */

// Helper para gerar hash anônimo do IP
function hashIP(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + process.env.HASH_SALT || 'default-salt')
    .digest('hex');
}

// Helper para detectar tipo de dispositivo
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) return 'desktop';

  return 'unknown';
}

// Helper para obter IP do request (considerando proxies)
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      utmSource,
      utmMedium,
      utmCampaign,
      eventType = 'LINK_CLICKED',
      isConverted = false,
    } = body;

    // Obter informações anônimas
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);
    const deviceType = detectDeviceType(userAgent);

    // Rate limiting simples: verificar se já teve evento nas últimas 10 segundos
    const recentEvent = await prisma.appInstallLog.findFirst({
      where: {
        ipHash,
        clickedAt: {
          gte: new Date(Date.now() - 10000), // 10 segundos
        },
      },
    });

    if (recentEvent && eventType === 'LINK_CLICKED') {
      return NextResponse.json(
        { success: true, message: 'Event already recorded' },
        { status: 200 }
      );
    }

    // Registrar evento
    const log = await prisma.appInstallLog.create({
      data: {
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        userAgent,
        ipHash,
        deviceType,
        eventType,
        isConverted,
        installedAt: isConverted ? new Date() : null,
      },
    });

    console.log('[PWA Track] Evento registrado:', {
      id: log.id,
      eventType,
      deviceType,
      utm: { source: utmSource, medium: utmMedium },
    });

    return NextResponse.json({
      success: true,
      eventId: log.id,
    });
  } catch (error) {
    console.error('[PWA Track] Erro ao registrar evento:', error);
    return NextResponse.json(
      { error: 'Failed to track install event' },
      { status: 500 }
    );
  }
}

// GET para obter estatísticas (apenas para admins)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação de admin
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado. Esta rota requer permissões de administrador.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};

    if (startDate) {
      whereClause.clickedAt = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      whereClause.clickedAt = {
        ...whereClause.clickedAt,
        lte: new Date(endDate),
      };
    }

    // Total de cliques
    const totalClicks = await prisma.appInstallLog.count({
      where: {
        ...whereClause,
        eventType: 'LINK_CLICKED',
      },
    });

    // Total de instalações
    const totalInstalls = await prisma.appInstallLog.count({
      where: {
        ...whereClause,
        eventType: 'APP_INSTALLED',
      },
    });

    // Por dispositivo
    const byDevice = await prisma.appInstallLog.groupBy({
      by: ['deviceType'],
      where: whereClause,
      _count: true,
    });

    // Por UTM source
    const byUTMSource = await prisma.appInstallLog.groupBy({
      by: ['utmSource'],
      where: {
        ...whereClause,
        utmSource: { not: null },
      },
      _count: true,
    });

    // Taxa de conversão
    const conversionRate = totalClicks > 0
      ? ((totalInstalls / totalClicks) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      summary: {
        totalClicks,
        totalInstalls,
        conversionRate: `${conversionRate}%`,
      },
      byDevice: byDevice.map((d) => ({
        device: d.deviceType,
        count: d._count,
      })),
      byUTMSource: byUTMSource.map((u) => ({
        source: u.utmSource,
        count: u._count,
      })),
    });
  } catch (error) {
    console.error('[PWA Track] Erro ao obter estatísticas:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

import { prisma } from '@/lib/prisma';

/**
 * Verifica se o restaurante está atualmente online e dentro do horário de funcionamento
 */
export async function isRestaurantOpen(): Promise<{
  isOpen: boolean;
  reason?: 'offline' | 'closed' | 'open';
  message?: string;
}> {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        isOnline: true,
        openingHours: true
      }
    });

    if (!settings) {
      return {
        isOpen: false,
        reason: 'offline',
        message: 'Configurações não encontradas'
      };
    }

    // Verificar se está manualmente offline
    if (!settings.isOnline) {
      return {
        isOpen: false,
        reason: 'offline',
        message: 'Restaurante offline'
      };
    }

    // Verificar horário de funcionamento
    if (settings.openingHours) {
      const isWithinHours = checkOpeningHours(settings.openingHours);
      if (!isWithinHours) {
        return {
          isOpen: false,
          reason: 'closed',
          message: 'Fora do horário de funcionamento'
        };
      }
    }

    return {
      isOpen: true,
      reason: 'open',
      message: 'Restaurante aberto'
    };
  } catch (error) {
    console.error('[Restaurant Status] Erro ao verificar status:', error);
    return {
      isOpen: false,
      reason: 'offline',
      message: 'Erro ao verificar status'
    };
  }
}

/**
 * Verifica se está dentro do horário de funcionamento
 */
function checkOpeningHours(openingHours: any): boolean {
  if (!openingHours || typeof openingHours !== 'object') {
    return true; // Se não há horários configurados, considera aberto
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda, etc.

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  const dayConfig = openingHours[dayName];

  if (!dayConfig) {
    return true; // Se não há configuração para o dia, considera aberto
  }

  if (dayConfig.closed === true) {
    return false; // Explicitamente fechado
  }

  if (!dayConfig.open || !dayConfig.close) {
    return true; // Sem horários definidos, considera aberto
  }

  // Converter horário atual para minutos desde meia-noite
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Converter horários de abertura/fechamento para minutos
  const openMinutes = timeToMinutes(dayConfig.open);
  const closeMinutes = timeToMinutes(dayConfig.close);

  if (openMinutes === null || closeMinutes === null) {
    return true; // Erro ao parsear, considera aberto
  }

  // Verificar se está dentro do horário
  if (closeMinutes > openMinutes) {
    // Horário normal (ex: 11:00 - 23:00)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Horário que cruza meia-noite (ex: 22:00 - 02:00)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}

/**
 * Converte string de horário (HH:MM) para minutos desde meia-noite
 */
function timeToMinutes(timeString: string): number | null {
  const parts = timeString.split(':');
  if (parts.length !== 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

import { prisma } from '@/lib/prisma';

/**
 * Verifica se o restaurante está atualmente online e dentro do horário de funcionamento
 * IMPORTANTE: Sem cache - sempre busca dados atualizados do banco
 */
export async function isRestaurantOpen(): Promise<{
  isOpen: boolean;
  reason?: 'offline' | 'closed' | 'open';
  message?: string;
}> {
  try {
    console.log('[Restaurant Status] 🔍 Verificando status do restaurante...');
    const settings = await prisma.settings.findFirst({
      select: {
        isOnline: true,
        openingHours: true
      }
    });
    console.log('[Restaurant Status] ⏰ openingHours do banco:', settings?.openingHours);

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
      console.log('[Restaurant Status] ⏰ isWithinHours:', isWithinHours);
      if (!isWithinHours) {
        console.log('[Restaurant Status] ❌ Restaurante fechado - fora do horário');
        return {
          isOpen: false,
          reason: 'closed',
          message: 'Fora do horário de funcionamento'
        };
      }
    }

    console.log('[Restaurant Status] ✅ Restaurante aberto');
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
 * Suporta 2 períodos: almoço (lunchOpen-lunchClose) e jantar (dinnerOpen-dinnerClose)
 */
function checkOpeningHours(openingHours: any): boolean {
  if (!openingHours || typeof openingHours !== 'object') {
    console.log('[checkOpeningHours] ⚠️ Sem horários configurados, considera aberto');
    return true; // Se não há horários configurados, considera aberto
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda, etc.

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  console.log('[checkOpeningHours] 📅 Dia da semana:', dayName, '(', dayOfWeek, ')');

  const dayConfig = openingHours[dayName];
  console.log('[checkOpeningHours] ⚙️ Config do dia:', dayConfig);

  if (!dayConfig) {
    return true; // Se não há configuração para o dia, considera aberto
  }

  if (dayConfig.closed === true) {
    console.log('[checkOpeningHours] 🚫 Dia marcado como FECHADO');
    return false; // Explicitamente fechado
  }

  // Converter horário atual para minutos desde meia-noite
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  console.log('[checkOpeningHours] 🕐 Horário atual (minutos):', currentMinutes, '=', now.getHours() + ':' + now.getMinutes());

  // Verificar período de almoço
  if (dayConfig.lunchOpen && dayConfig.lunchClose) {
    const lunchOpenMin = timeToMinutes(dayConfig.lunchOpen);
    const lunchCloseMin = timeToMinutes(dayConfig.lunchClose);

    if (lunchOpenMin !== null && lunchCloseMin !== null) {
      if (currentMinutes >= lunchOpenMin && currentMinutes < lunchCloseMin) {
        return true; // Dentro do horário de almoço
      }
    }
  }

  // Verificar período de jantar
  if (dayConfig.dinnerOpen && dayConfig.dinnerClose) {
    const dinnerOpenMin = timeToMinutes(dayConfig.dinnerOpen);
    const dinnerCloseMin = timeToMinutes(dayConfig.dinnerClose);

    if (dinnerOpenMin !== null && dinnerCloseMin !== null) {
      if (currentMinutes >= dinnerOpenMin && currentMinutes < dinnerCloseMin) {
        return true; // Dentro do horário de jantar
      }
    }
  }

  // Suporte retrocompatível para formato antigo (open/close)
  if (dayConfig.open && dayConfig.close) {
    const openMinutes = timeToMinutes(dayConfig.open);
    const closeMinutes = timeToMinutes(dayConfig.close);

    if (openMinutes !== null && closeMinutes !== null) {
      if (closeMinutes > openMinutes) {
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      } else {
        return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
      }
    }
  }

  console.log('[checkOpeningHours] ❌ Fora de qualquer horário configurado');
  return false; // Fora de qualquer horário configurado
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

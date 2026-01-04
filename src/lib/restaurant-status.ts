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

  // Usar timezone de Portugal (Europe/Lisbon)
  const now = new Date();

  // Obter data/hora em Portugal usando Intl.DateTimeFormat (mais confiável)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const getPartValue = (type: string) => parts.find(p => p.type === type)?.value || '0';

  const portugalHour = parseInt(getPartValue('hour'));
  const portugalMinute = parseInt(getPartValue('minute'));
  const portugalWeekday = getPartValue('weekday'); // Sunday, Monday, etc.

  // Mapear nome do dia para o formato do banco de dados
  const weekdayMap: Record<string, string> = {
    'Sunday': 'sunday',
    'Monday': 'monday',
    'Tuesday': 'tuesday',
    'Wednesday': 'wednesday',
    'Thursday': 'thursday',
    'Friday': 'friday',
    'Saturday': 'saturday'
  };

  const dayName = weekdayMap[portugalWeekday] || 'sunday';
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayName);

  console.log('[checkOpeningHours] 📅 Dia da semana (Portugal):', dayName, '(', dayOfWeek, ')', '- Weekday original:', portugalWeekday);
  console.log('[checkOpeningHours] 🌍 Horário UTC:', now.toISOString());
  console.log('[checkOpeningHours] 🇵🇹 Horário Portugal:', portugalHour + ':' + portugalMinute);

  const dayConfig = openingHours[dayName];
  console.log('[checkOpeningHours] ⚙️ Config do dia:', JSON.stringify(dayConfig));

  if (!dayConfig) {
    console.log('[checkOpeningHours] ⚠️ Sem config para', dayName, '- considera aberto');
    return true; // Se não há configuração para o dia, considera aberto
  }

  if (dayConfig.closed === true) {
    console.log('[checkOpeningHours] 🚫 Dia marcado como FECHADO');
    return false; // Explicitamente fechado
  }

  // Converter horário atual para minutos desde meia-noite (horário de Portugal)
  const currentMinutes = portugalHour * 60 + portugalMinute;
  console.log('[checkOpeningHours] 🕐 Horário atual Portugal (minutos):', currentMinutes, '=', portugalHour + ':' + portugalMinute);

  // Verificar período de almoço
  if (dayConfig.lunchOpen && dayConfig.lunchClose) {
    const lunchOpenMin = timeToMinutes(dayConfig.lunchOpen);
    const lunchCloseMin = timeToMinutes(dayConfig.lunchClose);

    if (lunchOpenMin !== null && lunchCloseMin !== null) {
      // Se o horário de fechamento cruza a meia-noite (ex: 23:00 - 02:00)
      if (lunchCloseMin < lunchOpenMin) {
        console.log('[checkOpeningHours] 🌙 Almoço cruza meia-noite');
        if (currentMinutes >= lunchOpenMin || currentMinutes < lunchCloseMin) {
          console.log('[checkOpeningHours] ✅ Dentro do horário de almoço (após meia-noite)');
          return true;
        }
      } else {
        if (currentMinutes >= lunchOpenMin && currentMinutes < lunchCloseMin) {
          console.log('[checkOpeningHours] ✅ Dentro do horário de almoço');
          return true;
        }
      }
    }
  }

  // Verificar período de jantar
  if (dayConfig.dinnerOpen && dayConfig.dinnerClose) {
    const dinnerOpenMin = timeToMinutes(dayConfig.dinnerOpen);
    const dinnerCloseMin = timeToMinutes(dayConfig.dinnerClose);

    if (dinnerOpenMin !== null && dinnerCloseMin !== null) {
      // Se o horário de fechamento cruza a meia-noite (ex: 19:00 - 01:00)
      if (dinnerCloseMin < dinnerOpenMin) {
        console.log('[checkOpeningHours] 🌙 Jantar cruza meia-noite');
        console.log('[checkOpeningHours] 📊 dinnerOpen:', dayConfig.dinnerOpen, '=', dinnerOpenMin, 'min');
        console.log('[checkOpeningHours] 📊 dinnerClose:', dayConfig.dinnerClose, '=', dinnerCloseMin, 'min');
        console.log('[checkOpeningHours] 📊 currentMinutes:', currentMinutes);
        if (currentMinutes >= dinnerOpenMin || currentMinutes < dinnerCloseMin) {
          console.log('[checkOpeningHours] ✅ Dentro do horário de jantar (após meia-noite)');
          return true;
        }
      } else {
        if (currentMinutes >= dinnerOpenMin && currentMinutes < dinnerCloseMin) {
          console.log('[checkOpeningHours] ✅ Dentro do horário de jantar');
          return true;
        }
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

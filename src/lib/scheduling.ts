import { prisma } from '@/lib/prisma';

/**
 * Estrutura de horários de funcionamento
 */
type DaySchedule = {
  closed?: boolean;
  lunchOpen?: string;
  lunchClose?: string;
  dinnerOpen?: string;
  dinnerClose?: string;
  open?: string; // Formato antigo (retrocompatibilidade)
  close?: string; // Formato antigo (retrocompatibilidade)
};

type OpeningHours = {
  sunday?: DaySchedule;
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
};

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

/**
 * Converte minutos desde meia-noite para string HH:MM
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Obtém os horários disponíveis para um dia específico
 */
export function getAvailableTimesForDay(
  daySchedule: DaySchedule | undefined
): string[] {
  if (!daySchedule || daySchedule.closed === true) {
    return [];
  }

  const times: string[] = [];
  const interval = 30; // Intervalos de 30 minutos

  // Processar período de almoço
  if (daySchedule.lunchOpen && daySchedule.lunchClose) {
    const lunchStart = timeToMinutes(daySchedule.lunchOpen);
    const lunchEnd = timeToMinutes(daySchedule.lunchClose);

    if (lunchStart !== null && lunchEnd !== null) {
      for (let min = lunchStart; min < lunchEnd; min += interval) {
        times.push(minutesToTime(min));
      }
    }
  }

  // Processar período de jantar
  if (daySchedule.dinnerOpen && daySchedule.dinnerClose) {
    const dinnerStart = timeToMinutes(daySchedule.dinnerOpen);
    const dinnerEnd = timeToMinutes(daySchedule.dinnerClose);

    if (dinnerStart !== null && dinnerEnd !== null) {
      for (let min = dinnerStart; min < dinnerEnd; min += interval) {
        times.push(minutesToTime(min));
      }
    }
  }

  // Suporte retrocompatível para formato antigo
  if (times.length === 0 && daySchedule.open && daySchedule.close) {
    const openMin = timeToMinutes(daySchedule.open);
    const closeMin = timeToMinutes(daySchedule.close);

    if (openMin !== null && closeMin !== null) {
      for (let min = openMin; min < closeMin; min += interval) {
        times.push(minutesToTime(min));
      }
    }
  }

  return times;
}

/**
 * Obtém todas as datas disponíveis para agendamento nos próximos 30 dias
 */
export async function getAvailableScheduleDates(): Promise<{
  availableDates: Array<{
    date: string; // YYYY-MM-DD
    dayOfWeek: string;
    times: string[];
  }>;
  openingHours: OpeningHours | null;
}> {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        openingHours: true,
        isOnline: true
      }
    });

    if (!settings?.openingHours) {
      return {
        availableDates: [],
        openingHours: null
      };
    }

    const openingHours = settings.openingHours as OpeningHours;
    const availableDates = [];

    // Gerar próximos 30 dias
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Se for hoje, verificar se ainda há tempo disponível
      const isToday = i === 0;

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[date.getDay()];
      const daySchedule = openingHours[dayOfWeek as keyof OpeningHours];

      // Verificar se o dia está aberto
      if (!daySchedule || daySchedule.closed === true) {
        continue;
      }

      // Obter horários disponíveis para o dia
      let times = getAvailableTimesForDay(daySchedule);

      // Se for hoje, filtrar horários que já passaram
      if (isToday) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentMinutes = currentHour * 60 + currentMinute;

        // Adicionar buffer de 2 horas para preparação
        const minMinutes = currentMinutes + 120;

        times = times.filter(time => {
          const timeMin = timeToMinutes(time);
          return timeMin !== null && timeMin >= minMinutes;
        });
      }

      if (times.length > 0) {
        availableDates.push({
          date: date.toISOString().split('T')[0],
          dayOfWeek,
          times
        });
      }
    }

    return {
      availableDates,
      openingHours
    };
  } catch (error) {
    console.error('[Scheduling] Erro ao obter datas disponíveis:', error);
    return {
      availableDates: [],
      openingHours: null
    };
  }
}

/**
 * Valida se uma data/hora específica está disponível para agendamento
 */
export async function validateScheduleDateTime(
  scheduledDate: string, // YYYY-MM-DD
  scheduledTime: string // HH:MM
): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    // Verificar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduledDate)) {
      return {
        isValid: false,
        reason: 'Formato de data inválido. Use YYYY-MM-DD'
      };
    }

    // Verificar formato da hora
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(scheduledTime)) {
      return {
        isValid: false,
        reason: 'Formato de hora inválido. Use HH:MM'
      };
    }

    // Criar data completa
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hour, minute] = scheduledTime.split(':').map(Number);

    const scheduledDateTime = new Date(year, month - 1, day, hour, minute);
    const now = new Date();

    // Verificar se é no passado
    if (scheduledDateTime <= now) {
      return {
        isValid: false,
        reason: 'Data/hora deve ser no futuro'
      };
    }

    // Verificar se é muito longe (máx 30 dias)
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 30);
    if (scheduledDateTime > maxDate) {
      return {
        isValid: false,
        reason: 'Data não pode ser mais de 30 dias no futuro'
      };
    }

    // Verificar buffer mínimo de 2 horas
    const minDateTime = new Date(now);
    minDateTime.setHours(minDateTime.getHours() + 2);
    if (scheduledDateTime < minDateTime) {
      return {
        isValid: false,
        reason: 'Agendamento deve ser feito com no mínimo 2 horas de antecedência'
      };
    }

    // Buscar horários de funcionamento
    const settings = await prisma.settings.findFirst({
      select: { openingHours: true }
    });

    if (!settings?.openingHours) {
      return {
        isValid: false,
        reason: 'Horários de funcionamento não configurados'
      };
    }

    const openingHours = settings.openingHours as OpeningHours;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[scheduledDateTime.getDay()];
    const daySchedule = openingHours[dayOfWeek as keyof OpeningHours];

    if (!daySchedule || daySchedule.closed === true) {
      return {
        isValid: false,
        reason: 'Restaurante fechado neste dia'
      };
    }

    // Verificar se o horário está dentro dos períodos de funcionamento
    const scheduledMinutes = hour * 60 + minute;
    let isWithinOperatingHours = false;

    // Verificar almoço
    if (daySchedule.lunchOpen && daySchedule.lunchClose) {
      const lunchStart = timeToMinutes(daySchedule.lunchOpen);
      const lunchEnd = timeToMinutes(daySchedule.lunchClose);

      if (lunchStart !== null && lunchEnd !== null) {
        if (scheduledMinutes >= lunchStart && scheduledMinutes < lunchEnd) {
          isWithinOperatingHours = true;
        }
      }
    }

    // Verificar jantar
    if (daySchedule.dinnerOpen && daySchedule.dinnerClose) {
      const dinnerStart = timeToMinutes(daySchedule.dinnerOpen);
      const dinnerEnd = timeToMinutes(daySchedule.dinnerClose);

      if (dinnerStart !== null && dinnerEnd !== null) {
        if (scheduledMinutes >= dinnerStart && scheduledMinutes < dinnerEnd) {
          isWithinOperatingHours = true;
        }
      }
    }

    // Retrocompatibilidade
    if (!isWithinOperatingHours && daySchedule.open && daySchedule.close) {
      const openMin = timeToMinutes(daySchedule.open);
      const closeMin = timeToMinutes(daySchedule.close);

      if (openMin !== null && closeMin !== null) {
        if (scheduledMinutes >= openMin && scheduledMinutes < closeMin) {
          isWithinOperatingHours = true;
        }
      }
    }

    if (!isWithinOperatingHours) {
      return {
        isValid: false,
        reason: 'Horário fora do expediente do restaurante'
      };
    }

    return {
      isValid: true
    };
  } catch (error) {
    console.error('[Scheduling] Erro ao validar data/hora:', error);
    return {
      isValid: false,
      reason: 'Erro ao validar agendamento'
    };
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();

  // Obter data/hora em Portugal usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long'
  });

  const parts = formatter.formatToParts(now);
  const getPartValue = (type: string) => parts.find(p => p.type === type)?.value || '0';

  const portugalHour = parseInt(getPartValue('hour'));
  const portugalMinute = parseInt(getPartValue('minute'));
  const portugalDay = parseInt(getPartValue('day'));
  const portugalMonth = parseInt(getPartValue('month'));
  const portugalYear = parseInt(getPartValue('year'));
  const portugalWeekday = getPartValue('weekday');

  const portugalDate = new Date(portugalYear, portugalMonth - 1, portugalDay, portugalHour, portugalMinute);
  const dayOfWeek = portugalDate.getDay();

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  return NextResponse.json({
    utc: {
      iso: now.toISOString(),
      timestamp: now.getTime(),
    },
    portugal: {
      year: portugalYear,
      month: portugalMonth,
      day: portugalDay,
      hour: portugalHour,
      minute: portugalMinute,
      weekday: portugalWeekday,
      dayName: dayName,
      dayOfWeek: dayOfWeek,
      formatted: `${portugalYear}-${String(portugalMonth).padStart(2, '0')}-${String(portugalDay).padStart(2, '0')} ${String(portugalHour).padStart(2, '0')}:${String(portugalMinute).padStart(2, '0')}`,
      currentMinutes: portugalHour * 60 + portugalMinute,
    }
  });
}

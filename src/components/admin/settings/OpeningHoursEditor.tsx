'use client';

import { WEEKDAYS, WEEKDAY_LABELS } from '@/lib/constants';

interface OpeningHoursEditorProps {
  value: any;
  onChange: (value: any) => void;
}

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  const handleDayChange = (day: string, field: string, newValue: any) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: newValue,
      },
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-[#ead9cd] dark:border-[#4a3c30]">
          <tr>
            <th className="py-3 text-left text-sm font-bold text-[#333333] dark:text-[#f5f1e9]" rowSpan={2}>
              Dia
            </th>
            <th className="py-3 text-center text-sm font-bold text-[#333333] dark:text-[#f5f1e9]" colSpan={3}>
              Almoço
            </th>
            <th className="py-3 text-center text-sm font-bold text-[#333333] dark:text-[#f5f1e9]" colSpan={3}>
              Jantar
            </th>
            <th className="py-3 text-center text-sm font-bold text-[#333333] dark:text-[#f5f1e9]" rowSpan={2}>
              Fechado
            </th>
          </tr>
          <tr>
            <th className="py-2 text-center text-xs font-medium text-[#a16b45]">Abertura</th>
            <th className="py-2 text-center text-xs font-medium text-[#a16b45]">-</th>
            <th className="py-2 text-center text-xs font-medium text-[#a16b45]">Fechamento</th>
            <th className="py-2 text-center text-xs font-medium text-[#a16b45]">Abertura</th>
            <th className="py-2 text-center text-xs font-medium text-[#a16b45]">-</th>
            <th className="py-2 text-center text-xs font-medium text-[#a16b45]">Fechamento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ead9cd] dark:divide-[#4a3c30]">
          {WEEKDAYS.map((day) => {
            const dayData = value[day] || {
              lunchOpen: '12:00',
              lunchClose: '15:00',
              dinnerOpen: '19:00',
              dinnerClose: '23:00',
              closed: false
            };

            return (
              <tr key={day}>
                <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                  {WEEKDAY_LABELS[day]}
                </td>
                {/* Almoço */}
                <td className="whitespace-nowrap px-2 py-4">
                  <input
                    type="time"
                    value={dayData.lunchOpen || '12:00'}
                    onChange={(e) => handleDayChange(day, 'lunchOpen', e.target.value)}
                    disabled={dayData.closed}
                    className="w-24 rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-center text-sm focus:border-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                  />
                </td>
                <td className="whitespace-nowrap px-1 py-4 text-center text-[#a16b45]">
                  -
                </td>
                <td className="whitespace-nowrap px-2 py-4">
                  <input
                    type="time"
                    value={dayData.lunchClose || '15:00'}
                    onChange={(e) => handleDayChange(day, 'lunchClose', e.target.value)}
                    disabled={dayData.closed}
                    className="w-24 rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-center text-sm focus:border-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                  />
                </td>
                {/* Jantar */}
                <td className="whitespace-nowrap px-2 py-4">
                  <input
                    type="time"
                    value={dayData.dinnerOpen || '19:00'}
                    onChange={(e) => handleDayChange(day, 'dinnerOpen', e.target.value)}
                    disabled={dayData.closed}
                    className="w-24 rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-center text-sm focus:border-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                  />
                </td>
                <td className="whitespace-nowrap px-1 py-4 text-center text-[#a16b45]">
                  -
                </td>
                <td className="whitespace-nowrap px-2 py-4">
                  <input
                    type="time"
                    value={dayData.dinnerClose || '23:00'}
                    onChange={(e) => handleDayChange(day, 'dinnerClose', e.target.value)}
                    disabled={dayData.closed}
                    className="w-24 rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-center text-sm focus:border-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={dayData.closed}
                    onChange={(e) => handleDayChange(day, 'closed', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


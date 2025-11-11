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
            <th className="py-3 text-left text-sm font-bold text-[#333333] dark:text-[#f5f1e9]">
              Dia
            </th>
            <th className="py-3 text-left text-sm font-bold text-[#333333] dark:text-[#f5f1e9]">
              Abertura
            </th>
            <th className="py-3 text-center text-sm font-bold text-[#333333] dark:text-[#f5f1e9]">
              -
            </th>
            <th className="py-3 text-left text-sm font-bold text-[#333333] dark:text-[#f5f1e9]">
              Fechamento
            </th>
            <th className="py-3 text-center text-sm font-bold text-[#333333] dark:text-[#f5f1e9]">
              Fechado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ead9cd] dark:divide-[#4a3c30]">
          {WEEKDAYS.map((day) => {
            const dayData = value[day] || { open: '12:00', close: '23:00', closed: false };
            
            return (
              <tr key={day}>
                <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-[#333333] dark:text-[#f5f1e9]">
                  {WEEKDAY_LABELS[day]}
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  <input
                    type="time"
                    value={dayData.open}
                    onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                    disabled={dayData.closed}
                    className="w-28 rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-center text-sm focus:border-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-center text-[#a16b45]">
                  -
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  <input
                    type="time"
                    value={dayData.close}
                    onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                    disabled={dayData.closed}
                    className="w-28 rounded-lg border-[#ead9cd] bg-[#f5f1e9] text-center text-sm focus:border-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50 dark:border-[#4a3c30] dark:bg-[#23170f] dark:text-[#f5f1e9]"
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


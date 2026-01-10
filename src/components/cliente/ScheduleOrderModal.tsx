'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvailableDate {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  times: string[];
}

interface ScheduleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
  onContinueImmediately?: () => void;
}

export function ScheduleOrderModal({
  isOpen,
  onClose,
  onSchedule,
  onContinueImmediately
}: ScheduleOrderModalProps) {
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const dayNames: Record<string, string> = {
    sunday: 'Domingo',
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado'
  };

  useEffect(() => {
    if (isOpen) {
      fetchAvailableDates();
    }
  }, [isOpen]);

  const fetchAvailableDates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scheduling/available-dates');
      const data = await response.json();

      if (data.success && data.availableDates) {
        setAvailableDates(data.availableDates);

        // Pré-selecionar a primeira data disponível
        if (data.availableDates.length > 0) {
          setSelectedDate(data.availableDates[0].date);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' });
  };

  const selectedDateData = availableDates.find(d => d.date === selectedDate);
  const availableTimes = selectedDateData?.times || [];

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      onSchedule(selectedDate, selectedTime);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#3a2a1d] rounded-2xl shadow-2xl">
        {/* Header com gradiente */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#FF6B00] to-[#ff8533] p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Estamos Encerrados</h2>
              <p className="text-white/90 text-sm mt-1">
                Mas ainda pode fazer seu pedido!
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Mensagem persuasiva */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#4a3a2d] dark:to-[#3a2a1d] border-2 border-[#FF6B00]/30 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Calendar className="h-12 w-12 text-[#FF6B00]" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
                  Não perca essa oportunidade!
                </h3>
                <p className="text-[#666666] dark:text-[#a1a1aa] leading-relaxed">
                  Agende seu pedido para quando estivermos abertos e <strong>garanta seu sushi fresquinho</strong> na hora que você escolher.
                  É rápido, fácil e você não precisa se preocupar em pedir na hora certa!
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-2 bg-white dark:bg-[#23170f] px-3 py-1.5 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-[#333333] dark:text-[#f5f1e9]">Sem filas</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-[#23170f] px-3 py-1.5 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-[#333333] dark:text-[#f5f1e9]">Sempre fresquinho</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-[#23170f] px-3 py-1.5 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-[#333333] dark:text-[#f5f1e9]">Planejamento perfeito</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B00]/20 border-t-[#FF6B00]"></div>
            </div>
          ) : availableDates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#666666] dark:text-[#a1a1aa]">
                Não há datas disponíveis para agendamento no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seleção de Data */}
              <div>
                <label className="flex items-center gap-2 text-base font-semibold text-[#333333] dark:text-[#f5f1e9] mb-3">
                  <Calendar className="h-5 w-5 text-[#FF6B00]" />
                  Escolha o dia
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableDates.map((dateOption) => (
                    <button
                      key={dateOption.date}
                      onClick={() => {
                        setSelectedDate(dateOption.date);
                        setSelectedTime(''); // Reset time when date changes
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedDate === dateOption.date
                          ? 'border-[#FF6B00] bg-[#FF6B00]/10 shadow-md'
                          : 'border-[#ead9cd] dark:border-[#5a4a3e] hover:border-[#FF6B00]/50 bg-white dark:bg-[#23170f]'
                      }`}
                    >
                      <div className="text-sm text-[#FF6B00] font-semibold">
                        {dayNames[dateOption.dayOfWeek]}
                      </div>
                      <div className="text-base font-bold text-[#333333] dark:text-[#f5f1e9] mt-1">
                        {formatDate(dateOption.date)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleção de Horário */}
              {selectedDate && (
                <div>
                  <label className="flex items-center gap-2 text-base font-semibold text-[#333333] dark:text-[#f5f1e9] mb-3">
                    <Clock className="h-5 w-5 text-[#FF6B00]" />
                    Escolha o horário
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border-2 transition-all font-mono ${
                          selectedTime === time
                            ? 'border-[#FF6B00] bg-[#FF6B00] text-white shadow-md'
                            : 'border-[#ead9cd] dark:border-[#5a4a3e] hover:border-[#FF6B00]/50 bg-white dark:bg-[#23170f] text-[#333333] dark:text-[#f5f1e9]'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo da seleção */}
              {selectedDate && selectedTime && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    📅 Pedido agendado para: <strong>{dayNames[selectedDateData?.dayOfWeek || '']}, {formatDate(selectedDate)} às {selectedTime}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#ead9cd] dark:border-[#5a4a3e]">
            <Button
              onClick={handleSchedule}
              disabled={!selectedDate || !selectedTime || isLoading}
              className="flex-1 h-12 bg-[#FF6B00] hover:bg-[#ff8533] text-white font-bold text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Agendamento
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 border-2 border-[#ead9cd] dark:border-[#5a4a3e] hover:bg-[#f5f1e9] dark:hover:bg-[#3a2a1d] text-[#333333] dark:text-[#f5f1e9] font-semibold text-base rounded-xl"
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

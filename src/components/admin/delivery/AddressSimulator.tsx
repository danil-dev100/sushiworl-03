'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type SimulationResult = {
  delivers: boolean;
  message: string;
  coordinates?: [number, number];
  displayName?: string;
  confidence?: number;
  area?: {
    id: string;
    name: string;
    deliveryType: 'FREE' | 'PAID';
    deliveryFee: number;
    minOrderValue: number | null;
    priority?: number;
  };
  decisionLog?: any;
};

type AddressSimulatorProps = {
  onAreaHighlight?: (areaId: string | null) => void;
};

export function AddressSimulator({ onAreaHighlight }: AddressSimulatorProps) {
  const [address, setAddress] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async () => {
    if (!address.trim()) {
      return;
    }

    setIsSimulating(true);
    setResult(null);
    onAreaHighlight?.(null);

    try {
      const response = await fetch('/api/delivery/check-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });

      const data = await response.json();
      setResult(data);

      // Highlight da área no mapa
      if (data.delivers && data.area?.id) {
        onAreaHighlight?.(data.area.id);
      }
    } catch (error) {
      console.error('[Address Simulator] Erro:', error);
      setResult({
        delivers: false,
        message: 'Erro ao simular endereço',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSimulate();
    }
  };

  return (
    <div className="rounded-xl border border-[#ead9cd] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-[#FF6B00]" />
        <h3 className="font-bold text-[#333333]">Simulador de Endereço</h3>
      </div>

      <p className="text-sm text-[#a16b45] mb-4">
        Teste se um endereço está dentro de uma área de entrega e veja qual taxa será aplicada.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="test-address" className="text-sm font-medium text-[#333333]">
            Endereço Completo
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="test-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Rua das Flores, 123, 2680-123 Loures"
              className="flex-1"
              disabled={isSimulating}
            />
            <Button
              onClick={handleSimulate}
              disabled={isSimulating || !address.trim()}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar'
              )}
            </Button>
          </div>
        </div>

        {/* Resultado */}
        {result && (
          <div
            className={`rounded-lg border-2 p-4 ${
              result.delivers
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.delivers ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1 space-y-3">
                <p
                  className={`font-semibold ${
                    result.delivers
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {result.message}
                </p>

                {result.delivers && result.area && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[#a16b45]">Área:</span>
                        <p className="font-bold text-[#FF6B00]">{result.area.name}</p>
                      </div>

                      <div>
                        <span className="text-[#a16b45]">Taxa de Entrega:</span>
                        <p className="font-bold text-[#333333]">
                          {result.area.deliveryType === 'FREE' ? (
                            <span className="text-green-600">Grátis</span>
                          ) : (
                            `€${result.area.deliveryFee.toFixed(2)}`
                          )}
                        </p>
                      </div>

                      {result.area.minOrderValue && (
                        <div>
                          <span className="text-[#a16b45]">Pedido Mínimo:</span>
                          <p className="font-bold text-[#333333]">
                            €{result.area.minOrderValue.toFixed(2)}
                          </p>
                        </div>
                      )}

                      {result.area.priority !== undefined && (
                        <div>
                          <span className="text-[#a16b45]">Prioridade:</span>
                          <p className="font-bold text-[#333333]">{result.area.priority}</p>
                        </div>
                      )}
                    </div>

                    {result.coordinates && (
                      <div className="pt-2 border-t border-green-200">
                        <span className="text-xs text-[#a16b45]">Coordenadas:</span>
                        <p className="text-xs font-mono text-[#333333]">
                          [{result.coordinates[0].toFixed(6)}, {result.coordinates[1].toFixed(6)}]
                        </p>
                      </div>
                    )}

                    {result.confidence !== undefined && (
                      <div>
                        <span className="text-xs text-[#a16b45]">Confiança:</span>
                        <p className="text-xs text-[#333333]">
                          {(result.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}

                    {result.displayName && (
                      <div>
                        <span className="text-xs text-[#a16b45]">Endereço Geocodificado:</span>
                        <p className="text-xs text-[#333333]">{result.displayName}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

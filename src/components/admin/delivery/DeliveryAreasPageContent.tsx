'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Map, MapPin, DollarSign } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AddressSimulator } from '@/components/admin/delivery/AddressSimulator';

// Importação dinâmica do mapa para evitar SSR
const DeliveryMap = dynamic(
  () => import('@/components/admin/delivery/DeliveryMap'),
  { ssr: false }
);

type DeliveryArea = {
  id: string;
  name: string;
  polygon: number[][];
  color: string;
  deliveryType: 'FREE' | 'PAID';
  deliveryFee: number;
  minOrderValue: number | null;
  priority: number;
  isActive: boolean;
  sortOrder: number;
};

type DeliveryAreasPageContentProps = {
  initialAreas: DeliveryArea[];
  restaurantAddress: string;
};

export function DeliveryAreasPageContent({
  initialAreas,
  restaurantAddress,
}: DeliveryAreasPageContentProps) {
  const [areas, setAreas] = useState<DeliveryArea[]>(initialAreas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<DeliveryArea | null>(null);
  const [editingArea, setEditingArea] = useState<Partial<DeliveryArea>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<number[][] | null>(null);
  const [restaurantLocation, setRestaurantLocation] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [highlightedAreaId, setHighlightedAreaId] = useState<string | null>(null);

  useEffect(() => {
    setRestaurantLocation(restaurantAddress);
  }, [restaurantAddress]);

  const handleCreateNew = () => {
    setEditingArea({
      name: '',
      deliveryType: 'PAID',
      deliveryFee: 0,
      minOrderValue: null,
      color: getRandomColor(),
      isActive: true,
    });
    setDrawnPolygon(null);
    setSelectedArea(null);
    setIsDrawing(false);
    setShowMapView(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area);
    setDrawnPolygon(area.polygon);
    setSelectedArea(area);
    setIsDialogOpen(true);
  };

  const handleDelete = (area: DeliveryArea) => {
    setSelectedArea(area);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedArea) return;

    try {
      const response = await fetch(`/api/admin/delivery-areas/${selectedArea.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir área');

      setAreas((prev) => prev.filter((a) => a.id !== selectedArea.id));
      toast.success('Área excluída com sucesso!');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erro ao excluir área:', error);
      toast.error('Erro ao excluir área');
    }
  };

  const handleSave = async () => {
    if (!editingArea.name) {
      toast.error('Preencha o nome da área');
      return;
    }

    if (!drawnPolygon || drawnPolygon.length < 3) {
      toast.error('Desenhe a área no mapa (mínimo 3 pontos)');
      return;
    }

    try {
      const payload = {
        ...editingArea,
        polygon: drawnPolygon,
      };

      const url = selectedArea
        ? `/api/admin/delivery-areas/${selectedArea.id}`
        : '/api/admin/delivery-areas';

      const response = await fetch(url, {
        method: selectedArea ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erro ao salvar área');

      const savedArea = await response.json();

      if (selectedArea) {
        setAreas((prev) =>
          prev.map((a) => (a.id === selectedArea.id ? savedArea : a))
        );
        toast.success('Área atualizada com sucesso!');
      } else {
        setAreas((prev) => [...prev, savedArea]);
        toast.success('Área criada com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingArea({});
      setDrawnPolygon(null);
      setSelectedArea(null);
      setIsDrawing(false);
      setShowMapView(false);
    } catch (error) {
      console.error('Erro ao salvar área:', error);
      toast.error('Erro ao salvar área');
    }
  };

  const handleGeocode = async () => {
    if (!restaurantLocation) {
      toast.error('Digite um endereço');
      return;
    }

    setIsLoadingLocation(true);
    try {
      // Usar Nominatim para geocodificação
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          restaurantLocation
        )}&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        toast.success('Localização encontrada!');
        // O mapa será centralizado via prop
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
      } else {
        toast.error('Endereço não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      toast.error('Erro ao buscar localização');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#FF6B00]">Áreas de Entrega</h1>
          <p className="mt-2 text-sm text-[#a16b45]">
            Desenhe áreas no mapa e configure taxas de entrega
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Nova Área
        </Button>
      </header>

      {/* Localização do Restaurante */}
      <section className="rounded-xl border border-[#ead9cd] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-[#FF6B00]" />
          <Label className="text-sm font-bold text-[#333333]">
            Localização do Restaurante
          </Label>
        </div>
        <div className="flex gap-2">
          <Input
            value={restaurantLocation}
            onChange={(e) => setRestaurantLocation(e.target.value)}
            placeholder="Digite o endereço completo do restaurante"
            className="flex-1"
          />
          <Button
            onClick={handleGeocode}
            disabled={isLoadingLocation}
            variant="outline"
          >
            {isLoadingLocation ? 'Buscando...' : 'Localizar'}
          </Button>
        </div>
      </section>

      {/* Simulador de Endereço */}
      <AddressSimulator
        onAreaHighlight={(areaId) => {
          setHighlightedAreaId(areaId);
          if (areaId) {
            const area = areas.find(a => a.id === areaId);
            if (area) {
              setSelectedArea(area);
            }
          } else {
            setSelectedArea(null);
          }
        }}
      />

      <div className="flex-1 grid grid-cols-1 gap-6 lg:grid-cols-10 overflow-hidden">
        {/* Lista de Áreas */}
        <div className="flex flex-col gap-4 lg:col-span-3 overflow-hidden">
          <div className="rounded-xl border border-[#ead9cd] bg-white p-4 shadow-sm h-full overflow-y-auto">
            <h3 className="mb-4 font-bold text-[#333333]">Áreas Cadastradas</h3>
            {areas.length > 0 ? (
              <div className="space-y-3">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    className="rounded-lg border border-[#ead9cd] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: area.color }}
                          />
                          <h4 className="font-bold text-[#FF6B00]">{area.name}</h4>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            {area.deliveryType === 'FREE' ? (
                              <span className="font-semibold text-green-600">
                                Grátis
                              </span>
                            ) : (
                              <span className="font-semibold text-[#FF6B00]">
                                €{area.deliveryFee.toFixed(2)}
                              </span>
                            )}
                          </p>
                          {area.minOrderValue && (
                            <p className="text-xs text-[#a16b45]">
                              Mín: €{area.minOrderValue.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(area)}
                        >
                          <Edit className="h-4 w-4 text-[#a16b45]" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(area)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[#a16b45]">
                <Map className="mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">Nenhuma área cadastrada</p>
              </div>
            )}
          </div>
        </div>

        {/* Mapa */}
        <div className="lg:col-span-7 overflow-hidden">
          <div className="h-full min-h-[500px] rounded-xl border border-[#ead9cd] bg-white shadow-sm overflow-hidden">
            <DeliveryMap
              areas={areas}
              selectedArea={selectedArea}
              onPolygonDrawn={setDrawnPolygon}
              onDrawingFinished={() => {
                // Quando o usuário termina de desenhar no mapa principal, abre o dialog
                const newColor = getRandomColor();
                setEditingArea({
                  name: '',
                  deliveryType: 'PAID',
                  deliveryFee: 0,
                  minOrderValue: null,
                  color: newColor,
                  isActive: true,
                });
                setIsDialogOpen(true);
              }}
              restaurantAddress={restaurantLocation}
            />
          </div>
        </div>
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedArea ? 'Editar Área' : 'Adicionar Nova Área'}
            </DialogTitle>
            <DialogDescription>
              Desenhe o polígono no mapa e preencha os detalhes da área de entrega.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="area-name">Nome da Área *</Label>
              <Input
                id="area-name"
                value={editingArea.name || ''}
                onChange={(e) =>
                  setEditingArea({ ...editingArea, name: e.target.value })
                }
                placeholder="Ex: Centro da Cidade"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery-type">Tipo de Entrega *</Label>
                <Select
                  value={editingArea.deliveryType || 'PAID'}
                  onValueChange={(value: 'FREE' | 'PAID') =>
                    setEditingArea({ ...editingArea, deliveryType: value })
                  }
                >
                  <SelectTrigger id="delivery-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Grátis</SelectItem>
                    <SelectItem value="PAID">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delivery-fee">Valor da Taxa (€)</Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  step="0.01"
                  value={editingArea.deliveryFee || 0}
                  onChange={(e) =>
                    setEditingArea({
                      ...editingArea,
                      deliveryFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={editingArea.deliveryType === 'FREE'}
                />
              </div>
            </div>
            {editingArea.deliveryType === 'FREE' && (
              <div>
                <Label htmlFor="min-order">
                  Valor mínimo para frete grátis (€)
                </Label>
                <Input
                  id="min-order"
                  type="number"
                  step="0.01"
                  value={editingArea.minOrderValue || ''}
                  onChange={(e) =>
                    setEditingArea({
                      ...editingArea,
                      minOrderValue: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="Deixe vazio para frete grátis sem limite"
                />
              </div>
            )}
            <div>
              <Label htmlFor="priority">
                Prioridade (para áreas sobrepostas)
              </Label>
              <Input
                id="priority"
                type="number"
                value={editingArea.priority || 0}
                onChange={(e) =>
                  setEditingArea({
                    ...editingArea,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
              <p className="text-xs text-[#a16b45] mt-1">
                Maior valor = maior prioridade. Use para resolver conflitos quando áreas se sobrepõem.
              </p>
            </div>
            {drawnPolygon && drawnPolygon.length >= 3 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-800">
                  ✓ Polígono desenhado com {drawnPolygon.length} pontos
                </p>
              </div>
            )}
            {(!drawnPolygon || drawnPolygon.length < 3) && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-sm text-orange-800">
                  Desenhe a área no mapa usando a ferramenta de polígono
                </p>
              </div>
            )}

            {/* Mapa para desenhar dentro do dialog */}
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">Desenhar Área no Mapa</Label>
              <div className="h-64 rounded-lg border border-[#ead9cd] overflow-hidden">
                <DeliveryMap
                  areas={areas}
                  selectedArea={selectedArea}
                  onPolygonDrawn={setDrawnPolygon}
                  restaurantAddress={restaurantLocation}
                  initialDrawingMode={!selectedArea}
                  initialPolygonColor={editingArea.color}
                  initialPolygon={selectedArea?.polygon}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              disabled={!drawnPolygon || drawnPolygon.length < 3}
            >
              Salvar Área
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir área de entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a área "{selectedArea?.name}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getRandomColor() {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}


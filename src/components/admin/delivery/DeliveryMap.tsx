'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix para ícones do Leaflet no Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

type DeliveryArea = {
  id: string;
  name: string;
  polygon: number[][];
  color: string;
  deliveryType: 'FREE' | 'PAID';
  deliveryFee: number;
  minOrderValue: number | null;
  isActive: boolean;
  sortOrder: number;
};

type DeliveryMapProps = {
  areas: DeliveryArea[];
  selectedArea: DeliveryArea | null;
  onPolygonDrawn?: (polygon: number[][]) => void;
  onDrawingFinished?: () => void; // Callback quando o usuário termina de desenhar
  restaurantAddress?: string;
  initialDrawingMode?: boolean;
  initialPolygonColor?: string;
  initialPolygon?: number[][];
};

export default function DeliveryMap({
  areas,
  selectedArea,
  onPolygonDrawn,
  onDrawingFinished,
  restaurantAddress,
  initialDrawingMode = false,
  initialPolygonColor = '#FF6B00',
  initialPolygon,
}: DeliveryMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const polygonsRef = useRef<Map<string, L.Polygon>>(new Map());
  const drawingLayerRef = useRef<L.Polygon | null>(null);
  const drawingMarkersRef = useRef<L.CircleMarker[]>([]);
  const drawControlRef = useRef<L.Control | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(initialDrawingMode);
  const [drawingPoints, setDrawingPoints] = useState<L.LatLng[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempPolygonColor, setTempPolygonColor] = useState(initialPolygonColor);
  const [showDrawingInstructions, setShowDrawingInstructions] = useState(true);

  // Sincronizar com props externas
  useEffect(() => {
    if (initialDrawingMode !== isDrawingMode) {
      setIsDrawingMode(initialDrawingMode);
    }
  }, [initialDrawingMode]);

  // Atualizar texto do botão quando o modo muda
  useEffect(() => {
    if (drawControlRef.current && (drawControlRef.current as any).getContainer) {
      const container = (drawControlRef.current as any).getContainer();
      if (container && (container as any)._updateText) {
        (container as any)._updateText();
      }
    }
  }, [isDrawingMode]);

  useEffect(() => {
    if (initialPolygonColor !== tempPolygonColor) {
      setTempPolygonColor(initialPolygonColor);
    }
  }, [initialPolygonColor]);

  // Carregar polígono inicial se fornecido
  useEffect(() => {
    if (!mapRef.current || !initialPolygon || initialPolygon.length < 3) return;

    const map = mapRef.current;

    // Converter coordenadas para LatLng
    const latLngs = initialPolygon.map(([lat, lng]) => L.latLng(lat, lng));
    setDrawingPoints(latLngs);

    // Criar polígono
    if (drawingLayerRef.current) {
      drawingLayerRef.current.remove();
    }

    const polygon = L.polygon(latLngs, {
      color: initialPolygonColor,
      fillColor: initialPolygonColor,
      fillOpacity: 0.3,
      weight: 2,
    }).addTo(map);

    drawingLayerRef.current = polygon;

    // Criar marcadores
    clearDrawingMarkers();
    latLngs.forEach((latLng) => {
      const marker = L.circleMarker(latLng, {
        radius: 6,
        color: initialPolygonColor,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      drawingMarkersRef.current.push(marker);
    });

    // Centralizar mapa no polígono
    map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
  }, [initialPolygon]);

  // Forçar redimensionamento do mapa quando o container muda
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Coordenadas padrão (Lisboa, Portugal)
    const defaultCenter: [number, number] = [38.7223, -9.1393];

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Adicionar controle de desenho
    const drawButton = L.Control.extend({
      options: {
        position: 'topright',
      },
      onAdd: function (map: L.Map) {
        const container = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control'
        );
        container.style.backgroundColor = 'white';
        container.style.padding = '10px';
        container.style.cursor = 'pointer';

        const updateButtonText = () => {
          container.innerHTML = isDrawingMode
            ? '🔴 Cancelar Desenho'
            : '✏️ Desenhar Área';
        };

        updateButtonText();

        // Impedir que o clique no botão se propague para o mapa
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(container, 'click', function (e) {
          L.DomEvent.stopPropagation(e);
          toggleDrawingMode();
        });

        // Armazenar função de atualização para uso posterior
        (container as any)._updateText = updateButtonText;

        return container;
      },
    });

    const control = new drawButton();
    drawControlRef.current = control;
    map.addControl(control);

    mapRef.current = map;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Renderizar áreas existentes
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpar polígonos anteriores
    polygonsRef.current.forEach((polygon) => polygon.remove());
    polygonsRef.current.clear();

    const allPolygons: L.Polygon[] = [];

    // Adicionar polígonos das áreas
    areas.forEach((area) => {
      if (!area.polygon || area.polygon.length < 3) return;

      const latLngs: [number, number][] = area.polygon.map((point) => [
        point[0],
        point[1],
      ]);

      const polygon = L.polygon(latLngs, {
        color: area.color,
        fillColor: area.color,
        fillOpacity: selectedArea?.id === area.id ? 0.5 : 0.2,
        weight: selectedArea?.id === area.id ? 3 : 2,
      }).addTo(mapRef.current!);

      const popupContent = `
        <div style="font-family: Inter, sans-serif;">
          <strong style="color: #FF6B00;">${area.name}</strong><br/>
          <span>${area.deliveryType === 'FREE' ? 'Grátis' : `€${area.deliveryFee.toFixed(2)}`}</span>
          ${area.minOrderValue ? `<br/><span style="font-size: 0.875rem;">Mín: €${area.minOrderValue.toFixed(2)}</span>` : ''}
        </div>
      `;

      polygon.bindPopup(popupContent);
      polygonsRef.current.set(area.id, polygon);
      allPolygons.push(polygon);
    });

    // Centralizar mapa em todas as áreas
    if (allPolygons.length > 0 && mapRef.current) {
      const group = L.featureGroup(allPolygons);
      mapRef.current.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 15, // Não dar zoom muito perto
      });
    }
  }, [areas, selectedArea]);

  // Limpar marcadores de desenho
  const clearDrawingMarkers = () => {
    drawingMarkersRef.current.forEach((marker) => marker.remove());
    drawingMarkersRef.current = [];
  };

  // Modo de desenho
  const toggleDrawingMode = () => {
    const newMode = !isDrawingMode;
    setIsDrawingMode(newMode);

    if (!newMode) {
      // Saindo do modo de desenho - limpar tudo
      setDrawingPoints([]);
      clearDrawingMarkers();

      if (drawingLayerRef.current) {
        drawingLayerRef.current.remove();
        drawingLayerRef.current = null;
      }

      setIsEditMode(false);
    }
  };

  // Finalizar desenho e entrar em modo de edição
  const finishDrawing = () => {
    setIsDrawingMode(false);
    setIsEditMode(true);
    setShowDrawingInstructions(false);
    if (onDrawingFinished) {
      onDrawingFinished();
    }
  };

  // Deletar um ponto específico
  const deletePoint = (index: number) => {
    if (!mapRef.current) return;

    const newPoints = drawingPoints.filter((_, i) => i !== index);
    setDrawingPoints(newPoints);

    // Remover marcador
    if (drawingMarkersRef.current[index]) {
      drawingMarkersRef.current[index].remove();
      drawingMarkersRef.current.splice(index, 1);
    }

    // Atualizar polígono
    if (newPoints.length >= 3) {
      if (drawingLayerRef.current) {
        drawingLayerRef.current.remove();
      }

      const polygon = L.polygon(newPoints, {
        color: tempPolygonColor,
        fillColor: tempPolygonColor,
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(mapRef.current);

      drawingLayerRef.current = polygon;

      // Notificar componente pai
      const coordinates = newPoints.map((point) => [point.lat, point.lng]);
      if (onPolygonDrawn) {
        onPolygonDrawn(coordinates);
      }
    } else {
      if (drawingLayerRef.current) {
        drawingLayerRef.current.remove();
        drawingLayerRef.current = null;
      }
    }
  };

  // Aplicar cor ao polígono
  const applyColor = (color: string) => {
    setTempPolygonColor(color);

    if (drawingLayerRef.current) {
      drawingLayerRef.current.setStyle({
        color: color,
        fillColor: color,
      });
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const mapContainer = mapContainerRef.current;

    // Alterar cursor baseado no modo
    if (mapContainer) {
      if (isDrawingMode) {
        mapContainer.style.cursor = 'crosshair';
      } else if (isEditMode) {
        mapContainer.style.cursor = 'move';
      } else {
        mapContainer.style.cursor = '';
      }
    }

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    // Apenas adicionar pontos se estiver em modo de desenho
    if (!isDrawingMode || isEditMode) return;

    // Esconder as instruções após o primeiro clique
    if (showDrawingInstructions) {
      setShowDrawingInstructions(false);
    }

    const newPoints = [...drawingPoints, e.latlng];
    setDrawingPoints(newPoints);

      // Criar marcador draggable
      const marker = L.circleMarker(e.latlng, {
        radius: 6,
        color: tempPolygonColor,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);

      drawingMarkersRef.current.push(marker);

      // Criar ou atualizar polígono se tiver pontos suficientes
      if (newPoints.length >= 3) {
        if (drawingLayerRef.current) {
          drawingLayerRef.current.remove();
        }

        const polygon = L.polygon(newPoints, {
          color: tempPolygonColor,
          fillColor: tempPolygonColor,
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(map);

        drawingLayerRef.current = polygon;

        // Notificar componente pai imediatamente
        const coordinates = newPoints.map((point) => [point.lat, point.lng]);
        if (onPolygonDrawn) {
          onPolygonDrawn(coordinates);
        }
      } else if (newPoints.length < 3 && drawingLayerRef.current) {
        // Remover polígono se não há pontos suficientes
        drawingLayerRef.current.remove();
        drawingLayerRef.current = null;
        if (onPolygonDrawn) {
          onPolygonDrawn([]);
        }
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawingMode || drawingPoints.length === 0 || !mapContainer) return;

      // Mostrar cursor pointer quando próximo do primeiro ponto
      if (drawingPoints.length >= 3) {
        const firstPoint = drawingPoints[0];
        const distance = e.latlng.distanceTo(firstPoint);

        if (distance < 50) {
          mapContainer.style.cursor = 'pointer';
        } else {
          mapContainer.style.cursor = 'crosshair';
        }
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC cancela e limpa tudo
      if (e.key === 'Escape') {
        if (isDrawingMode || isEditMode) {
          toggleDrawingMode(); // Isso já limpa tudo
        }
      }
      // ENTER finaliza o desenho e entra em modo de edição
      if (e.key === 'Enter' && isDrawingMode && drawingPoints.length >= 3) {
        finishDrawing();
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      if (mapContainer) {
        mapContainer.style.cursor = '';
      }
    };
  }, [isDrawingMode, isEditMode, drawingPoints, tempPolygonColor, onPolygonDrawn]);

  // Modo de edição - tornar marcadores draggable
  useEffect(() => {
    if (!mapRef.current || !isEditMode) return;

    const map = mapRef.current;

    // Tornar todos os marcadores draggable
    drawingMarkersRef.current.forEach((marker, index) => {
      // Remover marker antigo e criar um novo draggable
      const latLng = marker.getLatLng();
      marker.remove();

      const newMarker = L.circleMarker(latLng, {
        radius: 8,
        color: tempPolygonColor,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        weight: 3,
      }).addTo(map);

      // Adicionar evento de clique com botão direito para deletar
      newMarker.on('contextmenu', (e: L.LeafletMouseEvent) => {
        L.DomEvent.preventDefault(e.originalEvent);

        if (confirm(`Deseja apagar este ponto? (${index + 1}/${drawingPoints.length})`)) {
          deletePoint(index);
        }
      });

      // Tornar draggable manualmente
      let isDragging = false;

      newMarker.on('mousedown', () => {
        isDragging = true;
        map.dragging.disable();
      });

      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (!isDragging) return;

        newMarker.setLatLng(e.latlng);

        // Atualizar ponto no array
        const newPoints = [...drawingPoints];
        newPoints[index] = e.latlng;
        setDrawingPoints(newPoints);

        // Atualizar polígono
        if (drawingLayerRef.current) {
          drawingLayerRef.current.setLatLngs(newPoints);
        }

        // Notificar componente pai
        const coordinates = newPoints.map((point) => [point.lat, point.lng]);
        if (onPolygonDrawn) {
          onPolygonDrawn(coordinates);
        }
      });

      map.on('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          map.dragging.enable();
        }
      });

      drawingMarkersRef.current[index] = newMarker;
    });

    return () => {
      // Cleanup event listeners
      map.off('mousemove');
      map.off('mouseup');
    };
  }, [isEditMode, drawingPoints, tempPolygonColor, onPolygonDrawn]);

  // Geocodificação do endereço do restaurante
  useEffect(() => {
    if (!restaurantAddress || !mapRef.current) return;

    const geocode = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            restaurantAddress + ', Portugal'
          )}&limit=1`
        );

        const data = await response.json();

        if (data && data.length > 0 && mapRef.current) {
          const { lat, lon } = data[0];
          mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 14);

          // Adicionar marcador do restaurante
          L.marker([parseFloat(lat), parseFloat(lon)])
            .addTo(mapRef.current)
            .bindPopup('📍 SushiWorld')
            .openPopup();
        }
      } catch (error) {
        console.error('Erro ao geocodificar:', error);
      }
    };

    geocode();
  }, [restaurantAddress]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: '400px' }}>
      <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '400px' }} />

      {/* Instruções durante desenho */}
      {isDrawingMode && !isEditMode && showDrawingInstructions && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-white border-2 border-[#FF6B00] px-6 py-4 shadow-xl animate-pulse">
          <div className="text-center">
            <p className="text-lg font-bold text-[#FF6B00] mb-2">
              🎯 Modo de Desenho Ativo
            </p>
            <p className="text-sm font-medium text-[#333333] mb-1">
              Clique no mapa para adicionar pontos da área
            </p>
            <p className="text-xs text-[#a16b45] mb-2">
              Pontos atuais: <span className="font-bold">{drawingPoints.length}</span>
            </p>
            <div className="flex gap-4 justify-center text-xs">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ESC</kbd> Cancelar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ENTER</kbd> Finalizar
                {drawingPoints.length >= 3 ? <span className="text-green-600 font-bold">✓</span> : <span className="text-orange-600">(mín. {3 - drawingPoints.length})</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controles do modo de edição */}
      {isEditMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-white border-2 border-[#FF6B00] px-6 py-4 shadow-xl">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-[#333333] text-center">
              ✏️ Modo de Edição Ativado
            </p>

            {/* Seletor de cor */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-[#333333]">Cor da Área:</label>
              <div className="flex gap-2">
                {['#FF6B00', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                  <button
                    key={color}
                    onClick={() => applyColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      tempPolygonColor === color ? 'border-[#333333] scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <input
                  type="color"
                  value={tempPolygonColor}
                  onChange={(e) => applyColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                  title="Escolher cor personalizada"
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja cancelar? Todos os pontos serão perdidos.')) {
                    toggleDrawingMode();
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={() => setIsEditMode(false)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                ✓ Concluir Edição
              </button>
            </div>

            <p className="text-xs text-[#a16b45] text-center mt-1">
              🖱️ Arraste os pontos para ajustar | Clique direito para apagar ponto
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


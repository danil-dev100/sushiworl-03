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
  restaurantAddress?: string;
};

export default function DeliveryMap({
  areas,
  selectedArea,
  onPolygonDrawn,
  restaurantAddress,
}: DeliveryMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const polygonsRef = useRef<Map<string, L.Polygon>>(new Map());
  const drawingLayerRef = useRef<L.Polygon | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<L.LatLng[]>([]);

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
        container.innerHTML = isDrawingMode
          ? '🔴 Cancelar Desenho'
          : '✏️ Desenhar Área';

        L.DomEvent.on(container, 'click', function () {
          toggleDrawingMode();
        });

        return container;
      },
    });

    map.addControl(new drawButton());

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
    });
  }, [areas, selectedArea]);

  // Modo de desenho
  const toggleDrawingMode = () => {
    setIsDrawingMode((prev) => !prev);
    setDrawingPoints([]);

    if (drawingLayerRef.current) {
      drawingLayerRef.current.remove();
      drawingLayerRef.current = null;
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingMode) return;

      const newPoints = [...drawingPoints, e.latlng];
      setDrawingPoints(newPoints);

      if (newPoints.length >= 3) {
        // Remover polígono anterior
        if (drawingLayerRef.current) {
          drawingLayerRef.current.remove();
        }

        // Criar novo polígono
        const polygon = L.polygon(newPoints, {
          color: '#FF6B00',
          fillColor: '#FF6B00',
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(map);

        drawingLayerRef.current = polygon;

        // Notificar componente pai
        const coordinates = newPoints.map((point) => [point.lat, point.lng]);
        if (onPolygonDrawn) {
          onPolygonDrawn(coordinates);
        }
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawingMode) {
        toggleDrawingMode();
      }
      if (e.key === 'Enter' && isDrawingMode && drawingPoints.length >= 3) {
        toggleDrawingMode();
      }
    };

    map.on('click', handleMapClick);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      map.off('click', handleMapClick);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isDrawingMode, drawingPoints, onPolygonDrawn]);

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
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {isDrawingMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-white px-4 py-2 shadow-lg">
          <p className="text-sm font-medium text-[#333333]">
            Clique no mapa para desenhar a área ({drawingPoints.length} pontos)
          </p>
          <p className="text-xs text-[#a16b45]">
            Pressione ESC para cancelar ou ENTER para finalizar
          </p>
        </div>
      )}
    </div>
  );
}


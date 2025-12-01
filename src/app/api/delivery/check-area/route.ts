import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache simples em memória para endereços (expira após 5 minutos)
const addressCache = new Map();

// Função otimizada para verificar se um ponto está dentro de um polígono
function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [lat, lng] = point;
  let inside = false;
  const length = polygon.length;

  for (let i = 0, j = length - 1; i < length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];

    // Verificação mais rápida usando comparações diretas
    const intersect = (
      (lng1 > lng) !== (lng2 > lng) &&
      lat < ((lat2 - lat1) * (lng - lng1)) / (lng2 - lng1) + lat1
    );

    if (intersect) inside = !inside;
  }

  return inside;
}

// Função para calcular distância entre dois pontos (em km)
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// POST - Verificar se endereço está em área de entrega (OTIMIZADO)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Endereço é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar cache primeiro (busca case-insensitive)
    const cacheKey = address.toLowerCase().trim();
    const cachedResult = addressCache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < 5 * 60 * 1000) {
      return NextResponse.json(cachedResult.data);
    }

    // Buscar áreas de entrega ativas ANTES da geocodificação
    const deliveryAreas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        polygon: true,
        deliveryType: true,
        deliveryFee: true,
        minOrderValue: true
      }
    });

    // Se não há áreas ativas, retornar imediatamente
    if (deliveryAreas.length === 0) {
      const result = {
        delivers: false,
        message: 'Nenhuma área de entrega configurada',
        coordinates: null
      };
      
      addressCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return NextResponse.json(result);
    }

    // Geocodificar endereço usando Nominatim (com timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

    try {
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address + ', Santa Iria, Portugal'
        )}&limit=5`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SushiWorld/1.0',
          },
        }
      );

      clearTimeout(timeoutId);
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData || geocodeData.length === 0) {
        const result = {
          error: 'Endereço não encontrado',
          delivers: false,
          coordinates: null
        };

        addressCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return NextResponse.json(result, { status: 404 });
      }

      // Filtrar resultados para garantir que estão em Santa Iria ou área próxima
      const validResults = geocodeData.filter((result: any) => {
        const displayName = result.display_name.toLowerCase();
        return displayName.includes('santa iria') ||
               displayName.includes('santa iria de azóia') ||
               displayName.includes('são joão da talha') ||
               displayName.includes('póvoa de santa iria') ||
               displayName.includes('2690'); // Código postal da área
      });

      let selectedResult = validResults.length > 0 ? validResults[0] : geocodeData[0];
      const { lat, lon } = selectedResult;
      const coordinates: [number, number] = [parseFloat(lat), parseFloat(lon)];

      // Coordenadas de referência de Santa Iria
      const santaIriaRef: [number, number] = [38.8500, -9.0600];
      const distance = calculateDistance(coordinates, santaIriaRef);

      // Se a distância for maior que 10km, provavelmente é endereço errado
      if (distance > 10) {
        const result = {
          delivers: false,
          message: 'O endereço parece estar fora de Santa Iria. Por favor, verifique o endereço e código postal.',
          coordinates,
          warning: 'localizacao_improvavel'
        };

        addressCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return NextResponse.json(result);
      }

      // Verificar em qual área o ponto está (usando polígonos pré-convertidos)
      for (const area of deliveryAreas) {
        const polygon = area.polygon as number[][];

        if (pointInPolygon(coordinates, polygon)) {
          const result = {
            delivers: true,
            area: {
              id: area.id,
              name: area.name,
              deliveryType: area.deliveryType,
              deliveryFee: area.deliveryFee,
              minOrderValue: area.minOrderValue,
            },
            coordinates,
          };

          addressCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });

          return NextResponse.json(result);
        }
      }

      // Nenhuma área encontrada
      const result = {
        delivers: false,
        message: 'Desculpe, não entregamos neste endereço.',
        coordinates,
      };

      addressCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return NextResponse.json(result);

    } catch (geocodeError: unknown) {
      clearTimeout(timeoutId);

      if (geocodeError instanceof Error && geocodeError.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Tempo limite excedido ao geocodificar endereço',
            delivers: false
          },
          { status: 408 }
        );
      }

      throw geocodeError;
    }

  } catch (error) {
    console.error('[Check Area API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar área de entrega' },
      { status: 500 }
    );
  }
}

// GET - Calcular frete baseado em área e subtotal
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const areaId = searchParams.get('areaId');
    const subtotal = parseFloat(searchParams.get('subtotal') || '0');

    if (!areaId) {
      return NextResponse.json(
        { error: 'ID da área é obrigatório' },
        { status: 400 }
      );
    }

    const area = await prisma.deliveryArea.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      return NextResponse.json({ error: 'Área não encontrada' }, { status: 404 });
    }

    let deliveryFee = 0;
    let isFreeDelivery = false;
    let message = '';

    if (area.deliveryType === 'FREE') {
      if (area.minOrderValue && subtotal < area.minOrderValue) {
        deliveryFee = area.deliveryFee || 0;
        const remaining = area.minOrderValue - subtotal;
        message = `Faltam €${remaining.toFixed(2)} para frete grátis`;
      } else {
        isFreeDelivery = true;
        message = 'Parabéns! Você ganhou frete grátis!';
      }
    } else {
      deliveryFee = area.deliveryFee;
      message = `Taxa de entrega: €${deliveryFee.toFixed(2)}`;
    }

    return NextResponse.json({
      areaId: area.id,
      areaName: area.name,
      deliveryFee,
      isFreeDelivery,
      minOrderValue: area.minOrderValue,
      message,
    });
  } catch (error) {
    console.error('[Calculate Delivery API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular frete' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { geocodeAddress, isPointInPolygon, getLocationFromIP } from '@/lib/geo-utils';

/**
 * API para validar se um endereço está dentro de uma área de entrega
 *
 * Métodos de validação (ordem de prioridade):
 * 1. Coordenadas exatas fornecidas (latitude, longitude)
 * 2. Geocodificação do endereço completo
 * 3. Localização aproximada por IP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, latitude, longitude } = body;

    let coords: [number, number] | null = null;
    let validationMethod = '';

    // Método 1: Coordenadas fornecidas (mais preciso)
    if (latitude && longitude) {
      coords = [parseFloat(latitude), parseFloat(longitude)];
      validationMethod = 'coordinates';
    }
    // Método 2: Geocodificação do endereço
    else if (address) {
      coords = await geocodeAddress(address);
      validationMethod = 'geocoding';
    }
    // Método 3: IP (menos preciso, fallback)
    else {
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 undefined;
      coords = await getLocationFromIP(ip);
      validationMethod = 'ip';
    }

    // Se não conseguiu obter coordenadas
    if (!coords) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'Não foi possível determinar a localização. Por favor, verifique o endereço.',
          method: validationMethod,
        },
        { status: 400 }
      );
    }

    // Buscar todas as áreas de entrega ativas
    const deliveryAreas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (deliveryAreas.length === 0) {
      // Se não há áreas configuradas, aceita todas as entregas
      return NextResponse.json({
        isValid: true,
        message: 'Áreas de entrega não configuradas. Todas as entregas aceitas.',
        coordinates: coords,
        method: validationMethod,
      });
    }

    // Verificar se o ponto está dentro de alguma área
    let matchedArea = null;
    for (const area of deliveryAreas) {
      const polygon = area.polygon as number[][];

      if (isPointInPolygon(coords, polygon)) {
        matchedArea = {
          id: area.id,
          name: area.name,
          deliveryType: area.deliveryType,
          deliveryFee: area.deliveryFee,
          minOrderValue: area.minOrderValue,
        };
        break;
      }
    }

    if (!matchedArea) {
      return NextResponse.json({
        isValid: false,
        message: 'Desculpe, não entregamos nesta localização.',
        coordinates: coords,
        method: validationMethod,
        availableAreas: deliveryAreas.map(a => a.name),
      });
    }

    return NextResponse.json({
      isValid: true,
      message: `Entregamos no seu endereço! Área: ${matchedArea.name}`,
      coordinates: coords,
      method: validationMethod,
      area: matchedArea,
    });

  } catch (error) {
    console.error('[Validate Delivery API] Erro:', error);
    return NextResponse.json(
      {
        isValid: false,
        error: 'Erro ao validar endereço de entrega',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para obter informações sobre áreas de entrega
 */
export async function GET() {
  try {
    const deliveryAreas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        deliveryType: true,
        deliveryFee: true,
        minOrderValue: true,
        color: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      areas: deliveryAreas,
      count: deliveryAreas.length,
    });
  } catch (error) {
    console.error('[Validate Delivery API][GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar áreas de entrega' },
      { status: 500 }
    );
  }
}

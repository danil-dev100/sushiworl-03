import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Função para verificar se um ponto está dentro de um polígono
function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];

    const intersect =
      lng1 > lng !== lng2 > lng &&
      lat < ((lat2 - lat1) * (lng - lng1)) / (lng2 - lng1) + lat1;

    if (intersect) inside = !inside;
  }

  return inside;
}

// POST - Verificar se endereço está em área de entrega
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

    // Geocodificar endereço usando Nominatim
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address + ', Portugal'
      )}&limit=1`,
      {
        headers: {
          'User-Agent': 'SushiWorld/1.0',
        },
      }
    );

    const geocodeData = await geocodeResponse.json();

    if (!geocodeData || geocodeData.length === 0) {
      return NextResponse.json(
        {
          error: 'Endereço não encontrado',
          delivers: false,
        },
        { status: 404 }
      );
    }

    const { lat, lon } = geocodeData[0];
    const coordinates: [number, number] = [parseFloat(lat), parseFloat(lon)];

    // Buscar áreas de entrega ativas
    const deliveryAreas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Verificar em qual área o ponto está
    for (const area of deliveryAreas) {
      const polygon = area.polygon as number[][];

      if (pointInPolygon(coordinates, polygon)) {
        return NextResponse.json({
          delivers: true,
          area: {
            id: area.id,
            name: area.name,
            deliveryType: area.deliveryType,
            deliveryFee: area.deliveryFee,
            minOrderValue: area.minOrderValue,
          },
          coordinates,
        });
      }
    }

    // Nenhuma área encontrada
    return NextResponse.json({
      delivers: false,
      message: 'Desculpe, não entregamos neste endereço.',
      coordinates,
    });
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


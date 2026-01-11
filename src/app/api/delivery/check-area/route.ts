import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { geocodeAddressWithContext, type DeliveryAreaData } from '@/lib/geo-utils';
import { calculateDistance, isPointInCircle, calculateDeliveryFeeByDistance, formatDistance } from '@/lib/distance-utils';

// POST - Verificar se endereço está em área de entrega usando geocodificação com contexto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || !address.trim()) {
      return NextResponse.json(
        { error: 'Endereço é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`[Check Area API] Validando endereço: "${address}"`);

    // Buscar áreas de entrega ativas, ordenadas por prioridade
    const deliveryAreas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' }, // Maior prioridade primeiro
        { sortOrder: 'asc' }  // Depois por ordem de exibição
      ],
      select: {
        id: true,
        name: true,
        polygon: true,
        drawMode: true,
        centerLat: true,
        centerLng: true,
        radiusKm: true,
        deliveryType: true,
        deliveryFee: true,
        minOrderValue: true,
        pricePerKm: true,
        priority: true,
      },
    });

    // Se não há áreas ativas, retornar imediatamente
    if (deliveryAreas.length === 0) {
      console.log('[Check Area API] Nenhuma área ativa encontrada');
      return NextResponse.json({
        delivers: false,
        message: 'Nenhuma área de entrega configurada',
        coordinates: null,
        confidence: 0,
      });
    }

    // Preparar dados das áreas para geocodificação
    const areasData: DeliveryAreaData[] = deliveryAreas.map(area => ({
      id: area.id,
      name: area.name,
      polygon: area.polygon as number[][],
      searchContexts: [],
      priority: area.priority,
      deliveryType: area.deliveryType as 'FREE' | 'PAID',
      deliveryFee: area.deliveryFee,
      minOrderValue: area.minOrderValue,
    }));

    // Usar geocodificação inteligente com contexto
    const geocodeResult = await geocodeAddressWithContext(address, areasData);

    if (!geocodeResult) {
      console.log('[Check Area API] Endereço não encontrado ou fora das áreas');

      // Retornar lista de áreas disponíveis
      const availableAreas = deliveryAreas.map(area => area.name);

      return NextResponse.json({
        delivers: false,
        message: 'Desculpe, não entregamos neste endereço. Verifique se o endereço está correto e se inclui o código postal.',
        coordinates: null,
        confidence: 0,
        availableAreas,
      });
    }

    // Encontrar a área correspondente no banco de dados
    const matchedArea = deliveryAreas.find(
      area => area.name === geocodeResult.areaName
    );

    if (!matchedArea) {
      console.error('[Check Area API] Área encontrada mas não está no banco de dados');
      return NextResponse.json({
        delivers: false,
        message: 'Erro ao processar área de entrega',
        coordinates: geocodeResult.coordinates,
        confidence: geocodeResult.confidence,
      });
    }

    console.log(`[Check Area API] ✅ Entrega disponível em: ${matchedArea.name}`);
    console.log(`[Check Area API] Confiança: ${(geocodeResult.confidence * 100).toFixed(1)}%`);
    console.log(`[Check Area API] Prioridade: ${matchedArea.priority}`);

    // Calcular distância e taxa se for modo DISTANCE
    let distance: number | undefined;
    let calculatedDeliveryFee = matchedArea.deliveryFee;
    let distanceInfo: string | undefined;

    if (matchedArea.deliveryType === 'DISTANCE') {
      // Se for modo RADIUS, usar as coordenadas do centro
      if (matchedArea.drawMode === 'RADIUS' && matchedArea.centerLat && matchedArea.centerLng) {
        distance = calculateDistance(
          geocodeResult.coordinates[0],
          geocodeResult.coordinates[1],
          matchedArea.centerLat,
          matchedArea.centerLng
        );
      } else {
        // Para polígonos, calcular distância até o centróide
        const polygon = matchedArea.polygon as number[][];
        const centerLat = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
        const centerLng = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;

        distance = calculateDistance(
          geocodeResult.coordinates[0],
          geocodeResult.coordinates[1],
          centerLat,
          centerLng
        );
      }

      calculatedDeliveryFee = calculateDeliveryFeeByDistance(
        distance,
        matchedArea.pricePerKm || 0,
        matchedArea.deliveryFee || 0
      );

      distanceInfo = `${formatDistance(distance)} - €${matchedArea.pricePerKm}/km`;
      console.log(`[Check Area API] 📏 Distância: ${formatDistance(distance)}`);
      console.log(`[Check Area API] 💰 Taxa calculada: €${calculatedDeliveryFee.toFixed(2)}`);
    }

    // Retornar sucesso com dados da área e log de decisão
    return NextResponse.json({
      delivers: true,
      message: `Entregamos em ${matchedArea.name}!`,
      coordinates: geocodeResult.coordinates,
      confidence: geocodeResult.confidence,
      displayName: geocodeResult.displayName,
      area: {
        id: matchedArea.id,
        name: matchedArea.name,
        deliveryType: matchedArea.deliveryType,
        deliveryFee: calculatedDeliveryFee, // Taxa calculada ou fixa
        minOrderValue: matchedArea.minOrderValue,
        pricePerKm: matchedArea.pricePerKm,
        priority: matchedArea.priority,
        distance, // Distância em km (se aplicável)
        distanceInfo, // String formatada da distância
      },
      // Log de decisão para auditoria
      decisionLog: {
        coordinates: geocodeResult.coordinates,
        displayName: geocodeResult.displayName,
        confidence: geocodeResult.confidence,
        method: 'geocoding_with_context',
        matchedAreaName: matchedArea.name,
        matchedAreaId: matchedArea.id,
        priority: matchedArea.priority,
        distance,
        calculatedFee: calculatedDeliveryFee,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[Check Area API] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao verificar área de entrega',
        delivers: false,
        confidence: 0,
      },
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


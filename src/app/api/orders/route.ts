import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { emitNewOrderEvent } from '@/lib/socket-emitter';
import { geocodeAddress, isPointInPolygon } from '@/lib/geo-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerSurname,
      customerEmail,
      customerPhone,
      address,
      nif,
      paymentMethod,
      observations,
      items,
      subtotal,
      deliveryFee,
      additionalItems,
    } = body;

    // Validação básica
    if (!customerName || !customerEmail || !customerPhone || !address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Dados incompletos para criar o pedido.' },
        { status: 400 }
      );
    }

    // Validar área de entrega
    const deliveryAreas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
    });

    let deliveryAreaId: string | null = null;
    let actualDeliveryFee = deliveryFee || 0;

    // Se há áreas configuradas, validar o endereço
    if (deliveryAreas.length > 0) {
      const coords = await geocodeAddress(address);

      if (!coords) {
        return NextResponse.json(
          { error: 'Não foi possível validar o endereço de entrega. Por favor, verifique o endereço.' },
          { status: 400 }
        );
      }

      // Verificar se está dentro de alguma área
      let matchedArea = null;
      for (const area of deliveryAreas) {
        const polygon = area.polygon as number[][];
        if (isPointInPolygon(coords, polygon)) {
          matchedArea = area;
          break;
        }
      }

      if (!matchedArea) {
        return NextResponse.json(
          { error: 'Desculpe, não entregamos nesta localização. Por favor, verifique as áreas de entrega disponíveis.' },
          { status: 400 }
        );
      }

      // Usar dados da área encontrada
      deliveryAreaId = matchedArea.id;
      actualDeliveryFee = matchedArea.deliveryType === 'FREE' ? 0 : matchedArea.deliveryFee;

      // Validar valor mínimo do pedido se configurado
      if (matchedArea.minOrderValue && subtotal < matchedArea.minOrderValue) {
        return NextResponse.json(
          {
            error: `Pedido mínimo de €${matchedArea.minOrderValue.toFixed(2)} não atingido para esta área de entrega.`,
            minOrderValue: matchedArea.minOrderValue,
            currentSubtotal: subtotal,
          },
          { status: 400 }
        );
      }
    }

    // Buscar configurações do restaurante para VAT
    const settings = await prisma.settings.findFirst();
    const vatRate = settings?.vatRate || 13;

    // Calcular totais
    const additionalTotal = additionalItems?.reduce((acc: number, item: { price: number }) => acc + item.price, 0) || 0;
    const itemsSubtotal = subtotal || items.reduce((acc: number, item: { price: number; quantity: number }) => acc + (item.price * item.quantity), 0);
    const vatAmount = Number((itemsSubtotal * (vatRate / 100)).toFixed(2));
    const total = Number((itemsSubtotal + actualDeliveryFee + additionalTotal).toFixed(2));

    // Criar pedido
    const order = await prisma.order.create({
      data: {
        customerName: `${customerName} ${customerSurname || ''}`.trim(),
        customerEmail,
        customerPhone,
        deliveryAddress: {
          fullAddress: address,
          nif: nif || null,
        },
        subtotal: itemsSubtotal,
        discount: 0,
        vatAmount,
        total,
        deliveryFee: actualDeliveryFee,
        deliveryAreaId: deliveryAreaId,
        observations: observations || null,
        paymentMethod: paymentMethod || 'CASH',
        status: 'PENDING',
        orderItems: {
          create: items.map((item: { productId: string; name: string; quantity: number; price: number; options?: any }) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            priceAtTime: item.price,
            selectedOptions: item.options || null,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Buscar pixels ativos para disparar eventos
    const integrations = await prisma.integration.findMany({
      where: {
        isActive: true,
      },
    });

    // Registrar evento de compra para cada pixel
    const pixelEvents = integrations.map(async (integration) => {
      await prisma.trackingEvent.create({
        data: {
          integrationId: integration.id,
          eventType: 'Purchase',
          eventData: {
            orderId: order.id,
            value: total,
            currency: 'EUR',
            items: items.map((item: { name: string; quantity: number; price: number }) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          pageUrl: '/checkout',
        },
      });
    });

    await Promise.all(pixelEvents);

    // Emitir evento de novo pedido via WebSocket
    emitNewOrderEvent({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      vatAmount: order.vatAmount,
      createdAt: order.createdAt,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
      })),
    });

    // Disparar webhooks OUTBOUND para o evento order.created
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          isActive: true,
          direction: 'OUTBOUND',
          events: {
            has: 'order.created',
          },
        },
      });

      // Disparar webhooks em background (sem bloquear a resposta)
      webhooks.forEach(async (webhook) => {
        const startTime = Date.now();
        let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
        let statusCode: number | null = null;
        let errorMessage: string | null = null;

        try {
          const payload = {
            event: 'order.created',
            timestamp: new Date().toISOString(),
            data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              total: order.total,
              items: order.orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.priceAtTime,
              })),
            },
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'SushiWorld-Webhook/1.0',
          };

          if (webhook.headers && typeof webhook.headers === 'object') {
            Object.assign(headers, webhook.headers);
          }

          if (webhook.secret) {
            const crypto = await import('crypto');
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(payload))
              .digest('hex');
            headers['X-Webhook-Signature'] = signature;
          }

          const response = await fetch(webhook.url, {
            method: webhook.method,
            headers,
            body: JSON.stringify(payload),
          });

          statusCode = response.status;

          if (!response.ok) {
            status = 'FAILED';
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (error) {
          status = 'FAILED';
          errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        }

        const duration = Date.now() - startTime;

        // Registra o log
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event: 'order.created',
            status,
            statusCode,
            errorMessage,
            duration,
            requestBody: { orderId: order.id },
          },
        });

        // Atualiza estatísticas
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            ...(status === 'SUCCESS'
              ? { successCount: { increment: 1 } }
              : { failureCount: { increment: 1 } }),
          },
        });
      });
    } catch (webhookError) {
      console.error('[Orders API] Erro ao disparar webhooks:', webhookError);
      // Não falha a criação do pedido se os webhooks falharem
    }

    // Verificar se email está configurado
    let emailSent = false;
    // TODO: Implementar envio real de email quando SMTP estiver configurado

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        items: order.orderItems.map(item => item.name).join(', '),
      },
      emailSent,
      pixelsTriggered: integrations.length,
    }, { status: 201 });

  } catch (error) {
    console.error('[Orders API] Erro ao criar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido.' },
      { status: 500 }
    );
  }
}

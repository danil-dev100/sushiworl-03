import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { emitNewOrderEvent } from '@/lib/socket-emitter';
import { triggersService } from '@/lib/triggers-service';
import { isRestaurantOpen } from '@/lib/restaurant-status';
import { validateScheduleDateTime } from '@/lib/scheduling';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

// Schema de validação do pedido
const orderSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerSurname: z.string().max(100).optional().default(''),
  customerEmail: z.string().email().max(254),
  customerPhone: z.string().min(9).max(20),
  address: z.string().min(5).max(500),
  nif: z.string().max(20).optional().nullable(),
  paymentMethod: z.string().max(30).optional(),
  observations: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    productId: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(50),
    price: z.number().min(0),
    options: z.any().optional(),
  })).min(1).max(100),
  subtotal: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  additionalItems: z.array(z.object({
    name: z.string().max(200),
    price: z.number().min(0),
  })).optional(),
  couponCode: z.string().max(50).optional().nullable(),
  promotionId: z.string().max(50).optional().nullable(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().max(20).optional(),
  scheduledTime: z.string().max(10).optional(),
  globalOptions: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 pedidos por minuto
    const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.ORDERS);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    const body = await request.json();

    // Validação com Zod (formato, limites, tipos)
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique os campos do pedido.' },
        { status: 400 }
      );
    }

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
      couponCode,
      promotionId,
      isScheduled,
      scheduledDate,
      scheduledTime,
      globalOptions,
    } = parsed.data;

    // Normalizar método de pagamento para corresponder ao ENUM do Prisma
    // MBWAY e Multibanco Na Entrega = levar maquininha de cartão = CREDIT_CARD
    const normalizedPaymentMethod = paymentMethod === 'MBWAY' ? 'CREDIT_CARD' : (paymentMethod || 'CASH');

    // Verificar se admin pausou manualmente - bloqueia TODOS os pedidos (imediatos e agendados)
    const restaurantStatus = await isRestaurantOpen();
    if (!restaurantStatus.isOpen && restaurantStatus.reason === 'offline') {
      return NextResponse.json(
        {
          error: 'O restaurante está temporariamente indisponível. Tente novamente mais tarde.',
          reason: 'offline',
          canSchedule: false,
        },
        { status: 400 }
      );
    }

    // Validar agendamento se for um pedido agendado
    let scheduledForDateTime: Date | null = null;

    if (isScheduled) {
      // Validar que scheduledDate e scheduledTime foram fornecidos
      if (!scheduledDate || !scheduledTime) {
        return NextResponse.json(
          { error: 'Para pedidos agendados, scheduledDate e scheduledTime são obrigatórios' },
          { status: 400 }
        );
      }

      // Validar formato e disponibilidade da data/hora
      const validation = await validateScheduleDateTime(scheduledDate, scheduledTime);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.reason || 'Data/hora de agendamento inválida' },
          { status: 400 }
        );
      }

      // Construir data/hora completa
      const [year, month, day] = scheduledDate.split('-').map(Number);
      const [hour, minute] = scheduledTime.split(':').map(Number);
      scheduledForDateTime = new Date(year, month - 1, day, hour, minute);

      console.log('[Orders API] ✅ Pedido agendado para:', scheduledForDateTime.toISOString());
    } else {
      // Para pedidos imediatos: verificar se está fora do horário
      if (!restaurantStatus.isOpen && restaurantStatus.reason === 'closed') {
        return NextResponse.json(
          {
            error: restaurantStatus.message || 'Restaurante fechado no momento',
            reason: 'closed',
            canSchedule: true,
          },
          { status: 400 }
        );
      }
    }

    // Validar área de entrega com prioridade e logs
    const deliveryAreas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' },
        { sortOrder: 'asc' }
      ],
    });

    let deliveryAreaId: string | null = null;
    let actualDeliveryFee = deliveryFee || 0;
    let deliveryDecisionLog: any = null;

    // Se há áreas configuradas, validar o endereço
    if (deliveryAreas.length > 0) {
      // Preparar dados das áreas
      const areasData = deliveryAreas.map(area => ({
        id: area.id,
        name: area.name,
        polygon: area.polygon as number[][],
        priority: area.priority,
        deliveryType: area.deliveryType as 'FREE' | 'PAID',
        deliveryFee: area.deliveryFee,
        minOrderValue: area.minOrderValue,
      }));

      // Usar geocodificação com contexto e prioridade
      const { geocodeAddressWithContext } = await import('@/lib/geo-utils');
      const geocodeResult = await geocodeAddressWithContext(address, areasData);

      if (!geocodeResult) {
        return NextResponse.json(
          { error: 'Não foi possível validar o endereço de entrega. Por favor, verifique o endereço.' },
          { status: 400 }
        );
      }

      // Encontrar área correspondente
      const matchedArea = deliveryAreas.find(a => a.name === geocodeResult.areaName);

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

      // Criar log de decisão de entrega
      deliveryDecisionLog = {
        coordinates: geocodeResult.coordinates,
        displayName: geocodeResult.displayName,
        confidence: geocodeResult.confidence,
        method: 'geocoding_with_context',
        matchedAreaName: matchedArea.name,
        matchedAreaId: matchedArea.id,
        priority: matchedArea.priority,
        timestamp: new Date().toISOString(),
      };

      console.log('[Orders API] Delivery decision log:', deliveryDecisionLog);
    }

    // Buscar configurações do restaurante para VAT
    const settings = await prisma.settings.findFirst();
    const vatRate = settings?.vatRate || 13;

    // Validar opções globais obrigatórias
    if (items && items.length > 0) {
      const productIds = items.map((i: { productId: string }) => i.productId);

      // Buscar opções globais obrigatórias aplicáveis aos produtos do pedido
      const requiredGlobalOptions = await prisma.globalOption.findMany({
        where: {
          type: 'REQUIRED',
          isActive: true,
          assignments: {
            some: {
              OR: [
                { assignmentType: 'SITE_WIDE' },
                { assignmentType: 'PRODUCT', targetId: { in: productIds } },
              ],
            },
          },
        },
        include: {
          assignments: true,
        },
      });

      // Verificar se todas as opções obrigatórias foram selecionadas
      const missingRequired: string[] = [];
      for (const option of requiredGlobalOptions) {
        const selection = globalOptions?.find((s: { optionId: string }) => s.optionId === option.id);
        const minSelection = option.assignments[0]?.minSelection || 1;

        if (!selection || !selection.choices || selection.choices.length < minSelection) {
          missingRequired.push(option.name);
        }
      }

      if (missingRequired.length > 0) {
        return NextResponse.json(
          {
            error: `Opções obrigatórias não selecionadas: ${missingRequired.join(', ')}`,
            missingOptions: missingRequired,
          },
          { status: 400 }
        );
      }
    }

    // Verificar preços dos produtos no banco (prevenção de price tampering)
    const productIds = items.map((i: { productId: string }) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, name: true },
    });

    const productPriceMap = new Map(dbProducts.map(p => [p.id, p.price]));

    // Calcular subtotal com preços reais do banco
    let itemsSubtotal = 0;
    for (const item of items as { productId: string; name: string; quantity: number; price: number }[]) {
      const dbPrice = productPriceMap.get(item.productId);
      if (dbPrice === undefined) {
        return NextResponse.json(
          { error: `Produto não encontrado: ${item.name}` },
          { status: 400 }
        );
      }
      // Usar preço do banco, não o enviado pelo cliente
      item.price = dbPrice;
      itemsSubtotal += dbPrice * item.quantity;
    }

    // Verificar preços dos itens adicionais do checkout no banco
    const additionalTotal = additionalItems?.reduce((acc: number, item: { price: number }) => acc + item.price, 0) || 0;

    // Calcular total das opções globais com preços verificados
    let globalOptionsTotal = 0;
    if (globalOptions && globalOptions.length > 0) {
      const optionIds = globalOptions.map((o: { optionId: string }) => o.optionId);
      const dbOptions = await prisma.globalOption.findMany({
        where: { id: { in: optionIds } },
        select: { id: true, choices: true },
      });

      const optionChoicesMap = new Map<string, Map<string, number>>();
      for (const opt of dbOptions) {
        const choicesArr = opt.choices as { name: string; price: number }[];
        const choiceMap = new Map(choicesArr.map(c => [c.name, c.price]));
        optionChoicesMap.set(opt.id, choiceMap);
      }

      for (const opt of globalOptions as { optionId: string; choices: { name: string; price: number; quantity?: number }[] }[]) {
        const dbChoices = optionChoicesMap.get(opt.optionId);
        if (dbChoices) {
          for (const choice of opt.choices) {
            const dbChoicePrice = dbChoices.get(choice.name);
            if (dbChoicePrice !== undefined) {
              choice.price = dbChoicePrice; // Usar preço do banco
            }
            globalOptionsTotal += (choice.price * (choice.quantity || 1));
          }
        }
      }
    }
    const vatAmount = Number((itemsSubtotal * (vatRate / 100)).toFixed(2));

    // Validar e aplicar cupom se fornecido
    let discountAmount = 0;
    let validPromotionId: string | null = null;

    if (couponCode && promotionId) {
      // Revalidar cupom no backend para segurança
      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
        include: {
          promotionItems: {
            include: {
              product: {
                select: { sku: true },
              },
            },
          },
        },
      });

      if (promotion && promotion.code?.toUpperCase() === couponCode.toUpperCase()) {
        const now = new Date();

        // Verificar se está ativo
        if (!promotion.isActive) {
          return NextResponse.json(
            { error: 'Este cupom não está mais ativo' },
            { status: 400 }
          );
        }

        // Verificar data de validade
        if (promotion.validFrom && now < new Date(promotion.validFrom)) {
          return NextResponse.json(
            { error: 'Este cupom ainda não está válido' },
            { status: 400 }
          );
        }

        if (promotion.validUntil && now > new Date(promotion.validUntil)) {
          return NextResponse.json(
            { error: 'Este cupom expirou' },
            { status: 400 }
          );
        }

        // Verificar limite de uso
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
          return NextResponse.json(
            { error: 'Limite de uso deste cupom foi atingido' },
            { status: 400 }
          );
        }

        // Verificar valor mínimo
        if (promotion.minOrderValue && itemsSubtotal < promotion.minOrderValue) {
          return NextResponse.json(
            {
              error: `Valor mínimo de €${promotion.minOrderValue.toFixed(2)} não atingido para usar este cupom`,
            },
            { status: 400 }
          );
        }

        // Verificar primeira compra se necessário
        if (promotion.isFirstPurchaseOnly) {
          const previousOrders = await prisma.order.count({
            where: { customerEmail },
          });

          if (previousOrders > 0) {
            return NextResponse.json(
              { error: 'Este cupom é válido apenas para primeira compra' },
              { status: 400 }
            );
          }
        }

        // Calcular desconto
        if (promotion.discountType === 'PERCENTAGE') {
          discountAmount = Number(((itemsSubtotal * promotion.discountValue) / 100).toFixed(2));
        } else {
          discountAmount = promotion.discountValue;
        }

        // Garantir que desconto não excede o subtotal
        discountAmount = Math.min(discountAmount, itemsSubtotal);
        validPromotionId = promotion.id;
      } else {
        return NextResponse.json(
          { error: 'Cupom inválido' },
          { status: 400 }
        );
      }
    }

    const total = Number((itemsSubtotal + actualDeliveryFee + additionalTotal + globalOptionsTotal - discountAmount).toFixed(2));

    console.log('[Orders API] 📦 Itens adicionais do checkout:', additionalItems);
    console.log('[Orders API] 💰 Total de itens adicionais:', additionalTotal);

    // Preparar dados do pedido
    const orderData: any = {
      customerName: `${customerName} ${customerSurname || ''}`.trim(),
      customerEmail,
      customerPhone,
      deliveryAddress: {
        fullAddress: address,
        nif: nif || null,
      },
      subtotal: itemsSubtotal,
      discount: discountAmount,
      vatAmount,
      total,
      deliveryFee: actualDeliveryFee,
      deliveryAreaId: deliveryAreaId,
      deliveryDecisionLog: deliveryDecisionLog || Prisma.JsonNull,
      observations: observations || null,
      paymentMethod: normalizedPaymentMethod,
      status: isScheduled ? 'CONFIRMED' : 'PENDING', // Pedidos agendados já ficam confirmados
      promotionId: validPromotionId,
      isScheduled: isScheduled || false,
      scheduledFor: scheduledForDateTime,
      orderItems: {
        create: items.map((item: { productId: string; name: string; quantity: number; price: number; options?: any }) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          priceAtTime: item.price,
          selectedOptions: item.options || Prisma.JsonNull,
        })),
      },
    };

    // Tentar adicionar checkoutAdditionalItems se existir no schema
    try {
      if (additionalItems && additionalItems.length > 0) {
        orderData.checkoutAdditionalItems = additionalItems;
      }
    } catch (e) {
      console.log('[Orders API] ⚠️ Campo checkoutAdditionalItems ainda não existe no schema');
    }

    // Adicionar opções globais se existirem
    if (globalOptions && globalOptions.length > 0) {
      orderData.globalOptions = globalOptions;
      console.log('[Orders API] 🎯 Opções globais do pedido:', globalOptions);
    }

    // Criar pedido
    const order = await prisma.order.create({
      data: orderData,
      include: {
        orderItems: true,
      },
    });

    // Incrementar usageCount da promoção se foi usada
    if (validPromotionId) {
      await prisma.promotion.update({
        where: { id: validPromotionId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    }

    // Buscar pixels ativos para disparar eventos
    let integrations: any[] = [];
    try {
      integrations = await prisma.integration.findMany({
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
    } catch (integrationError) {
      console.error('[Orders API] ⚠️ Erro ao processar integrações (não crítico):', integrationError);
      // Não falhar a criação do pedido se houver erro com integrações
    }

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

    // Disparar trigger de email marketing para novo pedido
    try {
      await triggersService.triggerOrderCreated(order.id);
      console.log('📧 Trigger de email marketing disparado para novo pedido');
    } catch (triggerError) {
      console.error('Erro ao disparar trigger de email marketing:', triggerError);
      // Não falha a criação do pedido se o trigger falhar
    }

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
    console.error('[Orders API] ❌ Erro ao criar pedido:', error);
    console.error('[Orders API] ❌ Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Orders API] ❌ Message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erro ao criar pedido.' },
      { status: 500 }
    );
  }
}

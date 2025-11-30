import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageOrders } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { emitNewOrderEvent } from '@/lib/socket-emitter';

function randomCustomer() {
  const names = [
    { name: 'Ana Silva', email: 'ana.silva@example.com', phone: '+351912345671' },
    { name: 'João Pereira', email: 'joao.pereira@example.com', phone: '+351918765432' },
    { name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+351934567890' },
    { name: 'Ricardo Gomes', email: 'ricardo.gomes@example.com', phone: '+351926789012' },
    { name: 'Luana Costa', email: 'luana.costa@example.com', phone: '+351915678234' },
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function fakeAddress() {
  const streets = [
    'Rua das Flores, 123 - Santa Iria',
    'Av. Dom João II, 890 - Parque das Nações',
    'Rua do Mercado, 45 - Sacavém',
    'Rua das Laranjeiras, 78 - Portela',
  ];
  const street = streets[Math.floor(Math.random() * streets.length)];
  return {
    fullAddress: street,
    city: 'Lisboa',
    postalCode: '2685-000',
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !canManageOrders(session.user.role, session.user.managerLevel ?? null)
    ) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const mode: 'auto' | 'manual' = body.mode;

    if (!mode || !['auto', 'manual'].includes(mode)) {
      return NextResponse.json(
        { error: 'Modo inválido. Use "auto" ou "manual".' },
        { status: 400 }
      );
    }

    const availableProducts = await prisma.product.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (availableProducts.length === 0) {
      return NextResponse.json(
        { error: 'Não há produtos cadastrados para gerar pedidos.' },
        { status: 400 }
      );
    }

    if (mode === 'auto') {
      const customer = randomCustomer();
      const chosenProduct =
        availableProducts[Math.floor(Math.random() * availableProducts.length)];
      const quantity = Math.max(1, Math.floor(Math.random() * 3) + 1);
      const deliveryFee = Math.random() > 0.7 ? 2.5 : 0;
      const subtotal = chosenProduct.price * quantity;
      const vatAmount = Number((subtotal * 0.13).toFixed(2));
      const total = Number((subtotal + deliveryFee + vatAmount).toFixed(2));

      const createdOrder = await prisma.order.create({
        data: {
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          deliveryAddress: fakeAddress(),
          subtotal,
          discount: 0,
          vatAmount,
          total,
          deliveryFee,
          observations: 'Pedido automático para testes.',
          status: 'PENDING',
          orderItems: {
            create: [
              {
                productId: chosenProduct.id,
                name: chosenProduct.name,
                quantity,
                priceAtTime: chosenProduct.price,
              },
            ],
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Emitir evento WebSocket para novo pedido
      emitNewOrderEvent({
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        customerName: createdOrder.customerName,
        customerEmail: createdOrder.customerEmail,
        customerPhone: createdOrder.customerPhone,
        deliveryAddress: createdOrder.deliveryAddress,
        status: createdOrder.status,
        total: createdOrder.total,
        subtotal: createdOrder.subtotal,
        deliveryFee: createdOrder.deliveryFee,
        vatAmount: createdOrder.vatAmount,
        createdAt: createdOrder.createdAt,
        orderItems: createdOrder.orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
        })),
      });

      return NextResponse.json(createdOrder, { status: 201 });
    }

    // Manual
    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      notes,
      items,
    } = body as {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      address: string;
      notes?: string;
      items: { productId: string; quantity: number }[];
    };

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !address ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Dados incompletos para criação manual.' },
        { status: 400 }
      );
    }

    const preparedItems = await Promise.all(
      items.map(async (item) => {
        const product = availableProducts.find(
          (prod) => prod.id === item.productId
        );
        if (!product) {
          throw new Error('Produto não encontrado.');
        }
        const quantity = Math.max(1, Number(item.quantity) || 1);
        return {
          productId: product.id,
          name: product.name,
          quantity,
          priceAtTime: product.price,
        };
      })
    );

    const subtotal = preparedItems.reduce(
      (acc, item) => acc + item.priceAtTime * item.quantity,
      0
    );
    const vatAmount = Number((subtotal * 0.13).toFixed(2));
    const deliveryFee = 0;
    const total = Number((subtotal + vatAmount + deliveryFee).toFixed(2));

    const createdOrder = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress: {
          fullAddress: address,
        },
        subtotal,
        discount: 0,
        vatAmount,
        total,
        deliveryFee,
        observations: notes,
        status: 'PENDING',
        orderItems: {
          create: preparedItems,
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Emitir evento WebSocket para novo pedido manual
    emitNewOrderEvent({
      id: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      customerName: createdOrder.customerName,
      customerEmail: createdOrder.customerEmail,
      customerPhone: createdOrder.customerPhone,
      deliveryAddress: createdOrder.deliveryAddress,
      status: createdOrder.status,
      total: createdOrder.total,
      subtotal: createdOrder.subtotal,
      deliveryFee: createdOrder.deliveryFee,
      vatAmount: createdOrder.vatAmount,
      createdAt: createdOrder.createdAt,
      orderItems: createdOrder.orderItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
      })),
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido de teste.' },
      { status: 500 }
    );
  }
}



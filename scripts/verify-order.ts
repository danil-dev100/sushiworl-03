#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyOrder() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: 7 },
    include: {
      orderItems: {
        include: {
          product: true
        }
      },
      deliveryArea: true
    }
  });

  if (order) {
    console.log('✅ Pedido encontrado:');
    console.log('   Número:', '#SW' + order.orderNumber.toString().padStart(5, '0'));
    console.log('   Cliente:', order.customerName);
    console.log('   Email:', order.customerEmail);
    console.log('   Telefone:', order.customerPhone);
    console.log('   Status:', order.status);
    console.log('   Total:', order.total + ' €');
    console.log('   Criado em:', order.createdAt.toLocaleString('pt-PT'));
    console.log('   Endereço:', order.deliveryAddress);

    console.log('\n📦 Itens do pedido:');
    order.orderItems.forEach(item => {
      console.log('   -', item.quantity + 'x', item.name, '- ' + item.priceAtTime + ' €');
    });

    console.log('\n🚚 Área de entrega:', order.deliveryArea?.name);
  } else {
    console.log('❌ Pedido não encontrado');
  }

  await prisma.$disconnect();
}

verifyOrder().catch(console.error);


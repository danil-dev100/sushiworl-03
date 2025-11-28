#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getNextOrderNumber() {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: 'desc' }
  });

  const nextNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
  console.log('Próximo número de pedido disponível:', nextNumber);

  await prisma.$disconnect();
  return nextNumber;
}

getNextOrderNumber().catch(console.error);


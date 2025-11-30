#!/usr/bin/env tsx
/**
 * 🍣 SUSHIWORLD - SCRIPT PARA INSERIR PEDIDO DE TESTE
 *
 * Insere os dados do pedido #SW00006 baseado no HTML fornecido
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOrder() {
  console.log('🍣 Criando pedido de teste #SW00006...');

  try {
    // Primeiro, verificar se existe produto "Ebi Fry Salmão 6 Peças"
    let product = await prisma.product.findFirst({
      where: { name: { contains: 'Ebi Fry Salmão' } }
    });

    if (!product) {
      console.log('📦 Criando produto Ebi Fry Salmão 6 Peças...');
      product = await prisma.product.create({
        data: {
          sku: 'EBI-FRY-SALM-6P',
          name: 'Ebi Fry Salmão 6 Peças',
          description: 'Delicioso ebi fry com salmão fresco',
          price: 15.60,
          category: 'Ebi Fry',
          imageUrl: '/produtos/ebi-fry-salmao.jpg',
          status: 'AVAILABLE',
          isVisible: true,
        }
      });
      console.log('✅ Produto criado:', product.id);
    }

    // Verificar se existe área de entrega
    let deliveryArea = await prisma.deliveryArea.findFirst();
    if (!deliveryArea) {
      console.log('📍 Criando área de entrega...');
      deliveryArea = await prisma.deliveryArea.create({
        data: {
          name: 'Portela',
          polygon: [
            [-9.1449, 38.7569],
            [-9.1449, 38.7579],
            [-9.1439, 38.7579],
            [-9.1439, 38.7569],
            [-9.1449, 38.7569]
          ],
          color: '#3B82F6',
          deliveryType: 'FREE',
          deliveryFee: 0,
          isActive: true,
        }
      });
      console.log('✅ Área de entrega criada:', deliveryArea.id);
    }

    // Criar o pedido
    console.log('📝 Criando pedido de teste...');
    const order = await prisma.order.create({
      data: {
        customerName: 'Luana Costa',
        customerEmail: 'luana.costa@example.com',
        customerPhone: '+351915678234',
        deliveryAddress: {
          street: 'Rua das Laranjeiras',
          number: '78',
          neighborhood: 'Portela',
          city: 'Lisboa',
          postalCode: '2675-123',
          fullAddress: 'Rua das Laranjeiras, 78 - Portela'
        },
        deliveryAreaId: deliveryArea.id,
        deliveryFee: 0,
        subtotal: 15.60,
        discount: 0,
        vatAmount: 2.03, // 13% de IVA sobre 15.60
        total: 17.63,
        status: 'PENDING',
        paymentMethod: 'CASH',
        createdAt: new Date('2024-12-19T20:01:00.000Z'), // Horário 20:01
      }
    });

    console.log('✅ Pedido criado:', order.id, 'número:', order.orderNumber);

    // Criar item do pedido
    console.log('🍱 Criando item do pedido...');
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        name: product.name,
        quantity: 2,
        priceAtTime: product.price,
        selectedOptions: Prisma.JsonNull,
      }
    });

    console.log('✅ Item criado:', orderItem.id);

    console.log('\n🎉 Pedido de teste criado com sucesso!');
    console.log('📊 Resumo:');
    console.log('   - Número:', `#SW${order.orderNumber.toString().padStart(5, '0')}`);
    console.log('   - Cliente: Luana Costa');
    console.log('   - Total: 17,63 €');
    console.log('   - Itens: 2x Ebi Fry Salmão 6 Peças');
    console.log('   - Status: PENDING');
    console.log('   - Endereço: Rua das Laranjeiras, 78 - Portela');

  } catch (error) {
    console.error('❌ Erro ao criar pedido de teste:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
createTestOrder();

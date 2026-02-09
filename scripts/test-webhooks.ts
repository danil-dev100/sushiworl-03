/**
 * Script de teste para validar sistema de webhooks OUTBOUND e INBOUND
 *
 * Como executar:
 * npx tsx scripts/test-webhooks.ts
 */

import { prisma } from '../src/lib/db';
import { triggerWebhooks, formatOrderPayload } from '../src/lib/webhooks';
import crypto from 'crypto';

const WEBHOOK_TEST_URL = 'https://webhook.site/unique-url'; // Substituir por URL de teste real

async function testOutboundWebhooks() {
  console.log('\n🧪 TESTE 1: Webhooks OUTBOUND');
  console.log('=' .repeat(60));

  try {
    // 1. Criar webhook OUTBOUND de teste
    console.log('\n📝 Criando webhook OUTBOUND de teste...');
    const webhook = await prisma.webhook.create({
      data: {
        name: 'Webhook de Teste - OUTBOUND',
        url: WEBHOOK_TEST_URL,
        direction: 'OUTBOUND',
        events: [
          'order.created',
          'order.confirmed',
          'order.preparing',
          'order.delivering',
          'order.delivered',
          'order.cancelled',
          'payment.confirmed',
          'customer.created',
        ],
        secret: 'test-secret-key-123',
        isActive: true,
      },
    });

    console.log('✅ Webhook criado:', webhook.id);

    // 2. Buscar um pedido para testar
    console.log('\n📦 Buscando pedido para teste...');
    const order = await prisma.order.findFirst({
      include: {
        orderItems: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!order) {
      console.log('⚠️  Nenhum pedido encontrado. Crie um pedido primeiro.');
      return;
    }

    console.log('✅ Pedido encontrado:', order.orderNumber);

    // 3. Testar disparo de webhooks
    console.log('\n🚀 Testando disparo de webhooks...');

    const events = [
      'order.confirmed',
      'order.preparing',
      'order.delivering',
      'order.delivered',
    ] as const;

    for (const event of events) {
      console.log(`\n   Disparando: ${event}`);
      try {
        await triggerWebhooks(event, formatOrderPayload(order));
        console.log(`   ✅ ${event} disparado com sucesso`);

        // Aguardar 500ms entre disparos
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ Erro ao disparar ${event}:`, error);
      }
    }

    // 4. Verificar logs
    console.log('\n📊 Verificando logs de webhooks...');
    const logs = await prisma.webhookLog.findMany({
      where: {
        webhookId: webhook.id,
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: 10,
    });

    console.log(`\n   Total de logs: ${logs.length}`);
    logs.forEach((log, index) => {
      const status = log.status === 'SUCCESS' ? '✅' : '❌';
      console.log(`   ${status} Log ${index + 1}: ${log.event} - ${log.status} (${log.duration}ms)`);
      if (log.errorMessage) {
        console.log(`      Erro: ${log.errorMessage}`);
      }
    });

    // 5. Verificar estatísticas do webhook
    const webhookStats = await prisma.webhook.findUnique({
      where: { id: webhook.id },
      select: {
        successCount: true,
        failureCount: true,
        lastTriggeredAt: true,
      },
    });

    console.log('\n📈 Estatísticas do webhook:');
    console.log(`   ✅ Sucessos: ${webhookStats?.successCount || 0}`);
    console.log(`   ❌ Falhas: ${webhookStats?.failureCount || 0}`);
    console.log(`   🕐 Último disparo: ${webhookStats?.lastTriggeredAt?.toISOString() || 'Nunca'}`);

    // Limpar webhook de teste
    console.log('\n🧹 Limpando webhook de teste...');
    await prisma.webhookLog.deleteMany({
      where: { webhookId: webhook.id },
    });
    await prisma.webhook.delete({
      where: { id: webhook.id },
    });
    console.log('✅ Webhook de teste removido');

  } catch (error) {
    console.error('❌ Erro no teste OUTBOUND:', error);
  }
}

async function testInboundWebhooks() {
  console.log('\n\n🧪 TESTE 2: Webhooks INBOUND');
  console.log('=' .repeat(60));

  try {
    // 1. Criar webhook INBOUND de teste
    console.log('\n📝 Criando webhook INBOUND de teste...');
    const webhook = await prisma.webhook.create({
      data: {
        name: 'Webhook de Teste - INBOUND',
        url: 'https://seu-dominio.com/api/webhooks',
        direction: 'INBOUND',
        events: [
          'order.created',
          'order.confirmed',
          'payment.confirmed',
          'order.cancelled',
          'customer.created',
        ],
        secret: 'inbound-secret-key-456',
        isActive: true,
      },
    });

    console.log('✅ Webhook INBOUND criado:', webhook.id);
    console.log('\n📋 Configuração para plataforma externa:');
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Secret: ${webhook.secret}`);
    console.log(`   Eventos: ${webhook.events.join(', ')}`);

    // 2. Simular payload de evento externo
    const testPayloads = [
      {
        event: 'order.confirmed',
        data: {
          orderId: 'test-order-123',
          orderNumber: 1001,
          status: 'confirmed',
          timestamp: new Date().toISOString(),
        },
      },
      {
        event: 'payment.confirmed',
        data: {
          paymentId: 'pay-123',
          orderId: 'test-order-123',
          orderNumber: 1001,
          amount: 25.50,
          currency: 'EUR',
          timestamp: new Date().toISOString(),
        },
      },
      {
        event: 'customer.created',
        data: {
          id: 'cust-123',
          name: 'João Silva',
          email: 'joao.teste@example.com',
          phone: '+351912345678',
          timestamp: new Date().toISOString(),
        },
      },
    ];

    console.log('\n🔐 Exemplo de geração de assinatura HMAC:');
    testPayloads.forEach((payload, index) => {
      const signature = crypto
        .createHmac('sha256', webhook.secret!)
        .update(JSON.stringify(payload))
        .digest('hex');

      console.log(`\n   Payload ${index + 1} (${payload.event}):`);
      console.log('   ```json');
      console.log(JSON.stringify(payload, null, 2));
      console.log('   ```');
      console.log(`   X-Webhook-Signature: ${signature}`);
    });

    console.log('\n💡 Como testar INBOUND:');
    console.log('   1. Use Postman, Insomnia ou curl para enviar requisição POST');
    console.log('   2. URL: http://localhost:3000/api/webhooks');
    console.log('   3. Headers:');
    console.log('      Content-Type: application/json');
    console.log('      X-Webhook-Signature: <assinatura gerada acima>');
    console.log('   4. Body: <payload JSON acima>');
    console.log('\n   Exemplo curl:');
    const examplePayload = testPayloads[0];
    const exampleSignature = crypto
      .createHmac('sha256', webhook.secret!)
      .update(JSON.stringify(examplePayload))
      .digest('hex');

    console.log(`   curl -X POST http://localhost:3000/api/webhooks \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -H "X-Webhook-Signature: ${exampleSignature}" \\`);
    console.log(`     -d '${JSON.stringify(examplePayload)}'`);

    // Limpar webhook de teste
    console.log('\n🧹 Limpando webhook de teste...');
    await prisma.webhookLog.deleteMany({
      where: { webhookId: webhook.id },
    });
    await prisma.webhook.delete({
      where: { id: webhook.id },
    });
    console.log('✅ Webhook de teste removido');

  } catch (error) {
    console.error('❌ Erro no teste INBOUND:', error);
  }
}

async function testWebhookValidation() {
  console.log('\n\n🧪 TESTE 3: Validação de Assinatura');
  console.log('=' .repeat(60));

  const secret = 'test-secret-123';
  const payload = {
    event: 'order.created',
    data: {
      orderId: 'test-123',
      total: 50.00,
    },
  };

  // Gerar assinatura correta
  const correctSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  console.log('\n✅ Assinatura CORRETA:');
  console.log(`   Payload: ${JSON.stringify(payload)}`);
  console.log(`   Secret: ${secret}`);
  console.log(`   Signature: ${correctSignature}`);

  // Gerar assinatura incorreta
  const incorrectSignature = crypto
    .createHmac('sha256', 'wrong-secret')
    .update(JSON.stringify(payload))
    .digest('hex');

  console.log('\n❌ Assinatura INCORRETA (secret errado):');
  console.log(`   Signature: ${incorrectSignature}`);

  console.log('\n💡 O webhook INBOUND deve:');
  console.log('   ✅ Aceitar requisição com assinatura correta');
  console.log('   ❌ Rejeitar requisição com assinatura incorreta');
  console.log('   ⚠️  Processar requisição sem signature se webhook não tiver secret');
}

async function main() {
  console.log('🚀 Iniciando testes do sistema de webhooks...\n');

  try {
    await testOutboundWebhooks();
    await testInboundWebhooks();
    await testWebhookValidation();

    console.log('\n\n✅ Todos os testes concluídos!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

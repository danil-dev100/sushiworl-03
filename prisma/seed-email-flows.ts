import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailFlows = [
  {
    name: 'Jornada: Primeira Compra',
    description: 'Automação de boas-vindas para clientes que fizeram a primeira compra',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: Primeira Compra',
            triggerType: 'order_completed',
            conditions: {
              isFirstOrder: true
            }
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 250 },
          data: {
            label: 'Email: Boas-vindas',
            templateName: 'Boas-vindas - Primeira Compra',
            delay: 0,
            delayUnit: 'minutes'
          }
        },
        {
          id: 'wait-1',
          type: 'wait',
          position: { x: 100, y: 400 },
          data: {
            label: 'Aguardar 24h',
            duration: 24,
            durationUnit: 'hours'
          }
        },
        {
          id: 'email-2',
          type: 'email',
          position: { x: 100, y: 550 },
          data: {
            label: 'Email: Agradecimento + Cupom',
            templateName: 'Agradecimento Pós-Pedido',
            delay: 0
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'email-1' },
        { id: 'e2-3', source: 'email-1', target: 'wait-1' },
        { id: 'e3-4', source: 'wait-1', target: 'email-2' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Carrinho Abandonado',
    description: 'Recuperação de carrinhos abandonados com sequência de 3 emails',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: Carrinho Abandonado',
            triggerType: 'cart_abandoned',
            conditions: {
              minCartValue: 15
            }
          }
        },
        {
          id: 'wait-1',
          type: 'wait',
          position: { x: 100, y: 250 },
          data: {
            label: 'Aguardar 1 hora',
            duration: 1,
            durationUnit: 'hours'
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 400 },
          data: {
            label: 'Email 1: Lembrete',
            templateName: 'Carrinho Abandonado - 1h',
            delay: 0
          }
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 100, y: 550 },
          data: {
            label: 'Comprou?',
            conditionType: 'order_completed'
          }
        },
        {
          id: 'wait-2',
          type: 'wait',
          position: { x: 300, y: 550 },
          data: {
            label: 'Aguardar 24h',
            duration: 24,
            durationUnit: 'hours'
          }
        },
        {
          id: 'email-2',
          type: 'email',
          position: { x: 300, y: 700 },
          data: {
            label: 'Email 2: Urgência',
            templateName: 'Carrinho Abandonado - 1h',
            delay: 0,
            subject: 'Últimas unidades! Finalize seu pedido'
          }
        },
        {
          id: 'wait-3',
          type: 'wait',
          position: { x: 300, y: 850 },
          data: {
            label: 'Aguardar 48h',
            duration: 48,
            durationUnit: 'hours'
          }
        },
        {
          id: 'email-3',
          type: 'email',
          position: { x: 300, y: 1000 },
          data: {
            label: 'Email 3: Última Chance + 10% OFF',
            templateName: 'Carrinho Abandonado - 1h',
            delay: 0,
            subject: 'Última chance! 10% OFF no seu carrinho'
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'wait-1' },
        { id: 'e2-3', source: 'wait-1', target: 'email-1' },
        { id: 'e3-4', source: 'email-1', target: 'condition-1' },
        { id: 'e4-end', source: 'condition-1', target: 'end', label: 'Sim' },
        { id: 'e4-5', source: 'condition-1', target: 'wait-2', label: 'Não' },
        { id: 'e5-6', source: 'wait-2', target: 'email-2' },
        { id: 'e6-7', source: 'email-2', target: 'wait-3' },
        { id: 'e7-8', source: 'wait-3', target: 'email-3' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Recuperação 7 Dias',
    description: 'Reativar clientes inativos há 7 dias com cupom de 15% OFF',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: 7 Dias Sem Comprar',
            triggerType: 'customer_inactive',
            conditions: {
              inactiveDays: 7
            }
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 250 },
          data: {
            label: 'Email: Sentimos sua Falta + 15% OFF',
            templateName: 'Recuperação - 7 dias sem comprar',
            delay: 0
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'email-1' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Recuperação 15 Dias',
    description: 'Oferta VIP para clientes inativos há 15 dias com 20% OFF + frete grátis',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: 15 Dias Sem Comprar',
            triggerType: 'customer_inactive',
            conditions: {
              inactiveDays: 15
            }
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 250 },
          data: {
            label: 'Email: Oferta VIP 20% OFF',
            templateName: 'Recuperação - 15 dias sem comprar',
            delay: 0
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'email-1' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Recuperação 30 Dias',
    description: 'Última tentativa com 25% OFF + frete grátis + brinde para clientes há 30 dias sem comprar',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: 30 Dias Sem Comprar',
            triggerType: 'customer_inactive',
            conditions: {
              inactiveDays: 30
            }
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 250 },
          data: {
            label: 'Email: Retorno VIP 25% OFF',
            templateName: 'Recuperação - 30 dias sem comprar',
            delay: 0
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'email-1' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Confirmação de Pedido',
    description: 'Email automático de confirmação enviado imediatamente após pedido',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: Pedido Criado',
            triggerType: 'order_created',
            conditions: {}
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 250 },
          data: {
            label: 'Email: Pedido Confirmado',
            templateName: 'Pedido Confirmado',
            delay: 0
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'email-1' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Avaliação Pós-Pedido',
    description: 'Solicitar avaliação 3 dias após entrega + cupom de agradecimento',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: Pedido Entregue',
            triggerType: 'order_delivered',
            conditions: {}
          }
        },
        {
          id: 'wait-1',
          type: 'wait',
          position: { x: 100, y: 250 },
          data: {
            label: 'Aguardar 3 dias',
            duration: 3,
            durationUnit: 'days'
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 400 },
          data: {
            label: 'Email: Avaliação + Cupom 10%',
            templateName: 'Agradecimento Pós-Pedido',
            delay: 0
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'wait-1' },
        { id: 'e2-3', source: 'wait-1', target: 'email-1' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Aniversário',
    description: 'Email especial de aniversário com 30% OFF + sobremesa grátis',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: Aniversário do Cliente',
            triggerType: 'customer_birthday',
            conditions: {
              sendAt: '09:00'
            }
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 250 },
          data: {
            label: 'Email: Feliz Aniversário 🎂',
            templateName: 'Aniversário do Cliente',
            delay: 0
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'email-1' }
      ]
    },
    isActive: false,
    isDraft: false
  },

  {
    name: 'Jornada: Cliente VIP',
    description: 'Programa de fidelidade para clientes com mais de 5 pedidos',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'Gatilho: 5º Pedido Completo',
            triggerType: 'order_completed',
            conditions: {
              orderCount: 5
            }
          }
        },
        {
          id: 'email-1',
          type: 'email',
          position: { x: 100, y: 250 },
          data: {
            label: 'Email: Seja Bem-vindo ao Clube VIP',
            templateName: 'Agradecimento Pós-Pedido',
            subject: '👑 Você agora é VIP no SushiWorld!',
            delay: 0,
            customContent: {
              message: 'Parabéns! Você completou 5 pedidos e agora faz parte do nosso Clube VIP. A partir de agora você terá: 15% de desconto permanente em todos os pedidos, Frete grátis, Prioridade no atendimento, Brindes exclusivos.'
            }
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'email-1' }
      ]
    },
    isActive: false,
    isDraft: false
  }
];

async function main() {
  console.log('🌱 Iniciando seed de fluxos de email marketing...');

  // Buscar primeiro admin para associar os fluxos
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    console.log('⚠️  Nenhum admin encontrado. Criando fluxos sem createdBy...');
  }

  for (const flowData of emailFlows) {
    // Verificar se já existe
    const existing = await prisma.emailAutomation.findFirst({
      where: { name: flowData.name }
    });

    if (existing) {
      // Atualizar
      const updated = await prisma.emailAutomation.update({
        where: { id: existing.id },
        data: {
          description: flowData.description,
          flow: flowData.flow,
          isActive: flowData.isActive,
          isDraft: flowData.isDraft
        }
      });
      console.log(`✅ Fluxo atualizado: ${updated.name}`);
    } else {
      // Criar
      const created = await prisma.emailAutomation.create({
        data: {
          ...flowData,
          createdBy: admin?.id || undefined
        }
      });
      console.log(`✅ Fluxo criado: ${created.name}`);
    }
  }

  console.log('\n🎉 Seed de fluxos concluído com sucesso!');
  console.log(`📧 Total de fluxos: ${emailFlows.length}`);
  console.log('\n📋 Fluxos criados:');
  emailFlows.forEach((flow, index) => {
    console.log(`  ${index + 1}. ${flow.name}`);
    console.log(`     ${flow.description}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

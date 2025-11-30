import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email-marketing/templates - Lista todos os templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      where: {
        isActive: true,
        createdBy: session.user.id
      },
      select: {
        id: true,
        name: true,
        subject: true,
        fromName: true,
        fromEmail: true,
        buttonText: true,
        buttonUrl: true,
        buttonColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/email-marketing/templates - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      subject,
      htmlContent,
      buttonText,
      buttonUrl,
      buttonColor,
      fromName,
      fromEmail,
    } = body;

    // Validações
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome do template é obrigatório' },
        { status: 400 }
      );
    }

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: 'Assunto é obrigatório' },
        { status: 400 }
      );
    }

    if (!htmlContent?.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo HTML é obrigatório' },
        { status: 400 }
      );
    }

    const newTemplate = await prisma.emailTemplate.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        htmlContent: htmlContent.trim(),
        fromName: fromName?.trim() || 'SushiWorld',
        fromEmail: fromEmail?.trim() || 'pedidos@sushiworld.com',
        buttonText: buttonText?.trim() || null,
        buttonUrl: buttonUrl?.trim() || null,
        buttonColor: buttonColor?.trim() || '#FF6B00',
        isActive: true,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        subject: true,
        fromName: true,
        fromEmail: true,
        buttonText: true,
        buttonUrl: true,
        buttonColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      template: newTemplate
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para inicializar templates padrão
export async function initializeDefaultTemplates() {
  const defaultTemplates = [
    {
      name: 'Bem-vindo ao SushiWorld',
      subject: 'Bem-vindo! Seu primeiro pedido está a caminho 🍣',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B00; margin: 0;">🍣 SushiWorld</h1>
            <p style="color: #666; margin: 10px 0;">Sabor autêntico em cada pedaço</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Bem-vindo, {{customer_name}}!</h2>
            <p>Obrigado por escolher o SushiWorld! Estamos empolgados em servi-lo.</p>
            <p>Seu primeiro pedido está sendo preparado com muito carinho pela nossa equipe.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{website_url}}" style="background: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Fazer Novo Pedido
            </a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              SushiWorld - Delivery de Sushi<br>
              Horário: 11h às 23h • Todos os dias<br>
              Telefone: (11) 9999-9999
            </p>
          </div>
        </div>
      `,
      fromName: 'SushiWorld',
      fromEmail: 'pedidos@sushiworld.com',
      buttonText: 'Fazer Novo Pedido',
      buttonUrl: '{{website_url}}',
      buttonColor: '#FF6B00',
    },
    {
      name: 'Carrinho Abandonado',
      subject: 'Não esqueça seu pedido no SushiWorld! 🍱',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B00; margin: 0;">🍣 SushiWorld</h1>
            <p style="color: #666; margin: 10px 0;">Não perca seu pedido!</p>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #856404; margin-top: 0;">Ei, {{customer_name}}!</h2>
            <p>Percebemos que você deixou alguns itens deliciosos no carrinho...</p>
            <p>Não perca essa oportunidade! Use o cupom <strong>SUSHIBACK</strong> e ganhe 15% de desconto.</p>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Seus itens abandonados:</h3>
            <p style="color: #666;">• Combinado Tradicional (24 peças)</p>
            <p style="color: #666;">• Temaki Salmão</p>
            <p style="color: #666;">• Refrigerante 2L</p>
            <p style="font-weight: bold; color: #FF6B00; margin-top: 10px;">Total: R$ 67,90</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{cart_url}}" style="background: #FF6B00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              🛒 FINALIZAR PEDIDO
            </a>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">Cupom: <strong>SUSHIBACK</strong> (15% desconto)</p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Esta oferta é válida por 24 horas<br>
              SushiWorld - Sabor que você merece!
            </p>
          </div>
        </div>
      `,
      fromName: 'SushiWorld',
      fromEmail: 'pedidos@sushiworld.com',
      buttonText: 'Finalizar Pedido',
      buttonUrl: '{{cart_url}}',
      buttonColor: '#FF6B00',
    },
    {
      name: 'Pedido Confirmado',
      subject: 'Pedido confirmado! Acompanhe seu sushi 🍣',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B00; margin: 0;">🍣 SushiWorld</h1>
            <p style="color: #666; margin: 10px 0;">Seu pedido foi confirmado!</p>
          </div>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #155724; margin-top: 0;">✅ Pedido #{{order_number}} Confirmado</h2>
            <p>Obrigado, {{customer_name}}! Seu pedido foi confirmado e está sendo preparado.</p>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detalhes do Pedido:</h3>
            <p><strong>Cliente:</strong> {{customer_name}}</p>
            <p><strong>Endereço:</strong> {{delivery_address}}</p>
            <p><strong>Telefone:</strong> {{customer_phone}}</p>
            <p><strong>Total:</strong> R$ {{order_total}}</p>
          </div>

          <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">⏰ Acompanhe seu pedido:</h3>
            <p>📱 Você receberá atualizações por WhatsApp</p>
            <p>🚚 Tempo estimado: 45-60 minutos</p>
            <p>💳 Pagamento: {{payment_method}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{tracking_url}}" style="background: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              📍 ACOMPANHAR PEDIDO
            </a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Dúvidas? Ligue: (11) 9999-9999<br>
              SushiWorld - Delivery de Sushi Premium
            </p>
          </div>
        </div>
      `,
      fromName: 'SushiWorld',
      fromEmail: 'pedidos@sushiworld.com',
      buttonText: 'Acompanhar Pedido',
      buttonUrl: '{{tracking_url}}',
      buttonColor: '#FF6B00',
    }
  ];

  try {
    for (const templateData of defaultTemplates) {
      const existing = await prisma.emailTemplate.findFirst({
        where: { name: templateData.name }
      });

      if (!existing) {
        await prisma.emailTemplate.create({
          data: templateData
        });
        console.log(`Template "${templateData.name}" criado`);
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar templates padrão:', error);
  }
}


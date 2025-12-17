import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email-marketing/export-contacts - Exportar lista de contatos em CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todos os pedidos com informações de clientes
    const orders = await prisma.order.findMany({
      where: {
        isTest: false // Não incluir pedidos de teste
      },
      select: {
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Agrupar por email para evitar duplicatas e calcular métricas
    const contactsMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      firstOrderDate: Date;
      totalOrders: number;
      totalSpent: number;
    }>();

    orders.forEach(order => {
      const email = order.customerEmail?.toLowerCase().trim();
      if (!email) return;

      if (contactsMap.has(email)) {
        const contact = contactsMap.get(email)!;
        contact.totalOrders += 1;
        contact.totalSpent += Number(order.total);
        // Manter a data do primeiro pedido (mais antiga)
        if (order.createdAt < contact.firstOrderDate) {
          contact.firstOrderDate = order.createdAt;
        }
        // Atualizar telefone se não tinha
        if (!contact.phone && order.customerPhone) {
          contact.phone = order.customerPhone;
        }
      } else {
        contactsMap.set(email, {
          name: order.customerName || '',
          email: email,
          phone: order.customerPhone || '',
          firstOrderDate: order.createdAt,
          totalOrders: 1,
          totalSpent: Number(order.total),
        });
      }
    });

    // Converter para array e ordenar por total gasto (clientes mais valiosos primeiro)
    const contacts = Array.from(contactsMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

    // Gerar CSV
    const csvHeader = 'Nome,Email,Telefone,Primeiro Pedido,Total de Pedidos,Valor Total Gasto (EUR)\n';

    const csvRows = contacts.map(contact => {
      const name = `"${contact.name.replace(/"/g, '""')}"`;
      const email = contact.email;
      const phone = contact.phone || '';
      const firstOrderDate = contact.firstOrderDate.toLocaleDateString('pt-BR');
      const totalOrders = contact.totalOrders;
      const totalSpent = contact.totalSpent.toFixed(2);

      return `${name},${email},${phone},${firstOrderDate},${totalOrders},${totalSpent}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Adicionar BOM para garantir UTF-8 no Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    // Retornar como arquivo CSV
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contatos-sushiworld-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Erro ao exportar contatos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log('═══════════════════════════════════════');
  console.log('🔵 [API Pending] Request recebido');
  console.log('🕐 Timestamp:', new Date().toISOString());

  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      console.log('❌ [API Pending] Não autorizado');
      console.log('═══════════════════════════════════════\n');
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('✅ [API Pending] Autorizado - User:', session.user.email);
    console.log('📊 [API Pending] Buscando pedidos PENDING...');

    // Buscar pedidos PENDING com relações opcionais
    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true
              }
            }
          }
        },
        deliveryArea: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ [API Pending] Encontrados: ${orders.length} pedidos`);
    orders.forEach(order => {
      console.log(`   📦 #${order.id.slice(-6)}:`, {
        status: order.status,
        created: order.createdAt.toISOString(),
        customer: order.customerName
      });
    });

    console.log('📤 [API Pending] Enviando resposta...');
    console.log('═══════════════════════════════════════\n');

    return NextResponse.json(
      {
        success: true,
        orders,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('❌❌❌ [API Pending] ERRO FATAL:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.log('═══════════════════════════════════════\n');

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar pedidos',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

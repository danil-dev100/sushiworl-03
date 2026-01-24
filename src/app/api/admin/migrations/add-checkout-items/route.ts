import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Executar migration para adicionar campo checkoutAdditionalItems
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('[Migration API] 🔄 Executando migration: adicionar checkoutAdditionalItems');

    // Executar SQL para adicionar coluna se não existir
    // SEGURANÇA: Usando $executeRaw com template literal (não Unsafe)
    await prisma.$executeRaw`
      ALTER TABLE "Order"
      ADD COLUMN IF NOT EXISTS "checkoutAdditionalItems" JSONB
    `;

    console.log('[Migration API] ✅ Migration executada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Campo checkoutAdditionalItems adicionado com sucesso'
    });
  } catch (error) {
    console.error('[Migration API] ❌ Erro ao executar migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao executar migration',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

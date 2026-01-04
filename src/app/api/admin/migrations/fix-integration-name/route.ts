import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Adicionar coluna name à tabela Integration se não existir
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('[Migration API] 🔄 Executando migration: adicionar coluna name à Integration');

    // Verificar se a coluna já existe
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Integration'
      AND column_name = 'name';
    `);

    if (Array.isArray(checkColumn) && checkColumn.length > 0) {
      console.log('[Migration API] ℹ️ Coluna name já existe na tabela Integration');
      return NextResponse.json({
        success: true,
        message: 'Coluna name já existe na tabela Integration',
        alreadyExists: true
      });
    }

    // Adicionar coluna se não existir
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Integration"
      ADD COLUMN IF NOT EXISTS "name" TEXT;
    `);

    console.log('[Migration API] ✅ Coluna name adicionada à tabela Integration');

    return NextResponse.json({
      success: true,
      message: 'Coluna name adicionada com sucesso à tabela Integration'
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

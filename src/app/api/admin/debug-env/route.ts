import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Forçar novo deploy após reconfigurar env vars na Vercel

export async function GET(_request: NextRequest) {
  try {
    // SEGURANÇA: Bloquear em produção
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Endpoint de debug não disponível em produção' },
        { status: 403 }
      );
    }

    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas verificar se variáveis existem (sem expor detalhes)
    const envStatus = {
      SUPABASE_CONFIGURED: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(envStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    );
  }
}

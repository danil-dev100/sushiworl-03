import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Listar todas as variáveis de ambiente relacionadas ao Supabase
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_FOUND',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT_FOUND',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'NOT_FOUND',
      ALL_SUPABASE_VARS: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    return NextResponse.json(envVars, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    );
  }
}

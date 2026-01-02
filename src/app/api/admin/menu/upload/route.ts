import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API] Iniciando upload de imagem...');

    // Verificar variáveis de ambiente primeiro
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[Upload API] Supabase URL exists:', !!supabaseUrl);
    console.log('[Upload API] Supabase URL value:', supabaseUrl);
    console.log('[Upload API] Service Role Key exists:', !!supabaseKey);
    console.log('[Upload API] Service Role Key length:', supabaseKey?.length || 0);
    console.log('[Upload API] All SUPABASE env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    console.log('[Upload API] Exact key check:', {
      hasKey: 'SUPABASE_SERVICE_ROLE_KEY' in process.env,
      value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING'
    });

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL não configurada' },
        { status: 500 }
      );
    }

    if (!supabaseKey) {
      return NextResponse.json(
        {
          error: 'SUPABASE_SERVICE_ROLE_KEY não configurada. Adicione na Vercel e faça REDEPLOY (Settings → Deployments → última → ... → Redeploy)'
        },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      console.log('[Upload API] Erro: Não autorizado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[Upload API] Autenticação OK');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('[Upload API] Arquivo recebido:', file?.name, 'Tipo:', file?.type, 'Tamanho:', file?.size);

    if (!file) {
      console.log('[Upload API] Erro: Nenhum arquivo enviado');
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.log('[Upload API] Erro: Formato inválido -', file.type);
      return NextResponse.json(
        { error: `Formato inválido (${file.type}). Use PNG, JPEG ou WEBP` },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const extension = originalName.split('.').pop();
    const fileName = `produto-${timestamp}.${extension}`;

    console.log('[Upload API] Nome do arquivo:', fileName);

    // Converter para ArrayBuffer
    const bytes = await file.arrayBuffer();

    console.log('[Upload API] ArrayBuffer criado, tamanho:', bytes.byteLength);

    // Criar cliente Supabase dinamicamente
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('produtos')
      .upload(fileName, bytes, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Upload API] Erro Supabase:', error);
      throw new Error(error.message);
    }

    console.log('[Upload API] Upload Supabase OK:', data);

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('produtos')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    console.log('[Upload API] Upload concluído! URL:', imageUrl);

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error('[Upload API] Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: `Erro ao fazer upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}


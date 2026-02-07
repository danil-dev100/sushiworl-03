import { NextRequest, NextResponse } from 'next/server';
import { validateImageFile } from '@/lib/supabase';
import { uploadFileAdmin, deleteFileAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e autorização
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any)?.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter o arquivo e tipo do bucket do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as 'products' | 'banners' | 'promotions') || 'products';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    // Validar o arquivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Upload usando supabaseAdmin (server-only, ignora RLS com segurança)
    const result = await uploadFileAdmin(file, bucket);

    // Retornar URL pública da imagem
    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para deletar arquivo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any)?.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL não fornecida' },
        { status: 400 }
      );
    }

    // Extrair bucket e path da URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucket = pathParts[pathParts.length - 2] as 'products' | 'banners' | 'promotions';
    const fileName = pathParts[pathParts.length - 1];

    if (!bucket || !fileName) {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    await deleteFileAdmin(bucket, fileName);

    return NextResponse.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
    });

  } catch (error) {
    console.error('Erro ao deletar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
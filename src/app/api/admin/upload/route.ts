import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, validateImageFile, type BucketName } from '@/lib/supabase';
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
    const bucketType = (formData.get('bucket') as BucketName) || 'products';

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

    // Fazer upload para o Supabase Storage
    const result = await uploadFile(file, bucketType);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao fazer upload' },
        { status: 500 }
      );
    }

    // Retornar URL pública da imagem
    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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

    // Importar deleteFileByUrl dinamicamente para evitar erro no build
    const { deleteFileByUrl } = await import('@/lib/supabase');
    const result = await deleteFileByUrl(url);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao deletar arquivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
    });

  } catch (error) {
    console.error('Erro ao deletar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
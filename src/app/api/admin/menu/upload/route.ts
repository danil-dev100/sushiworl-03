import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API] Iniciando upload de imagem...');

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

    // Converter para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('[Upload API] Buffer criado, tamanho:', buffer.length);

    // Salvar na pasta public/produtos
    const path = join(process.cwd(), 'public', 'produtos', fileName);
    console.log('[Upload API] Salvando em:', path);

    await writeFile(path, buffer);

    // Retornar URL da imagem
    const imageUrl = `/produtos/${fileName}`;

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


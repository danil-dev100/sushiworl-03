/**
 * ✅ CLIENTE SUPABASE ADMIN (SERVER-SIDE ONLY!)
 *
 * ATENÇÃO:
 * - Este arquivo usa SUPABASE_SERVICE_ROLE_KEY
 * - NUNCA importe este arquivo em componentes Client ('use client')
 * - Use APENAS em Server Components, API Routes e Server Actions
 * - A SERVICE_ROLE_KEY bypassa RLS e tem permissões TOTAIS!
 */

import { createClient } from '@supabase/supabase-js';

// Verificar se estamos no servidor
if (typeof window !== 'undefined') {
  throw new Error(
    '⛔ supabase-admin.ts NÃO PODE ser importado no cliente! ' +
    'Este arquivo contém credenciais de admin e DEVE ser usado apenas no servidor.'
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL não está definida no .env! ' +
    'Adicione: NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co'
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY não está definida no .env! ' +
    '\n\n' +
    'Para obter a service_role key:\n' +
    '1. Acesse o Dashboard do Supabase\n' +
    '2. Vá em Settings > API\n' +
    '3. Copie a "service_role" key (NÃO a "anon" key!)\n' +
    '4. Adicione no .env: SUPABASE_SERVICE_ROLE_KEY=eyJ...\n' +
    '\n' +
    '⚠️ ATENÇÃO: NUNCA commite esta chave no Git!\n' +
    '⚠️ ATENÇÃO: Esta chave tem permissões TOTAIS no banco!'
  );
}

/**
 * Cliente Supabase com permissões de admin
 *
 * - Bypassa Row Level Security (RLS)
 * - Pode ler/escrever em qualquer tabela
 * - Pode fazer upload/delete de arquivos
 * - Use com EXTREMO cuidado!
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Exemplo de uso seguro em API Route:
 *
 * ```typescript
 * // src/app/api/admin/upload-product-image/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { getServerSession } from 'next-auth';
 * import { authOptions, canManageProducts } from '@/lib/auth';
 * import { supabaseAdmin } from '@/lib/supabase-admin';
 *
 * export async function POST(request: NextRequest) {
 *   // 1. SEMPRE validar autenticação primeiro!
 *   const session = await getServerSession(authOptions);
 *
 *   if (!session || !canManageProducts(session.user.role, session.user.managerLevel)) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *
 *   // 2. Obter arquivo do FormData
 *   const formData = await request.formData();
 *   const file = formData.get('file') as File;
 *
 *   if (!file) {
 *     return NextResponse.json({ error: 'No file provided' }, { status: 400 });
 *   }
 *
 *   // 3. Validar tipo e tamanho
 *   const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
 *   if (!validTypes.includes(file.type)) {
 *     return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
 *   }
 *
 *   if (file.size > 5 * 1024 * 1024) { // 5MB
 *     return NextResponse.json({ error: 'File too large' }, { status: 400 });
 *   }
 *
 *   // 4. Upload usando supabaseAdmin (bypassa RLS)
 *   const fileName = `${Date.now()}-${file.name}`;
 *   const { data, error } = await supabaseAdmin.storage
 *     .from('products')
 *     .upload(fileName, file, {
 *       cacheControl: '3600',
 *       upsert: false,
 *     });
 *
 *   if (error) {
 *     console.error('Upload error:', error);
 *     return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
 *   }
 *
 *   // 5. Obter URL pública
 *   const { data: urlData } = supabaseAdmin.storage
 *     .from('products')
 *     .getPublicUrl(data.path);
 *
 *   return NextResponse.json({
 *     url: urlData.publicUrl,
 *     path: data.path,
 *   });
 * }
 * ```
 */

/**
 * Exemplo de uso em Server Component:
 *
 * ```typescript
 * // src/app/admin/produtos/page.tsx
 * import { supabaseAdmin } from '@/lib/supabase-admin';
 *
 * export default async function ProdutosPage() {
 *   // Listar todas as imagens de produtos
 *   const { data: files } = await supabaseAdmin.storage
 *     .from('products')
 *     .list('', {
 *       limit: 100,
 *       offset: 0,
 *       sortBy: { column: 'created_at', order: 'desc' },
 *     });
 *
 *   return (
 *     <div>
 *       <h1>Produtos</h1>
 *       {files?.map(file => (
 *         <img key={file.name} src={`/storage/products/${file.name}`} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Helper: Upload de arquivo com validação
 */
export async function uploadFileAdmin(
  file: File,
  bucket: 'products' | 'banners' | 'promotions',
  options?: {
    path?: string;
    maxSizeMB?: number;
    allowedTypes?: string[];
  }
) {
  const {
    path = `${Date.now()}-${file.name}`,
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  } = options || {};

  // Validar tipo
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
  }

  // Validar tamanho
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Arquivo muito grande (máximo ${maxSizeMB}MB)`);
  }

  // Upload
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Erro no upload: ${error.message}`);
  }

  // Obter URL pública
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Helper: Deletar arquivo
 */
export async function deleteFileAdmin(
  bucket: 'products' | 'banners' | 'promotions',
  path: string
) {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`);
  }

  return { success: true };
}

/**
 * Helper: Listar arquivos
 */
export async function listFilesAdmin(
  bucket: 'products' | 'banners' | 'promotions',
  folder?: string
) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    throw new Error(`Erro ao listar arquivos: ${error.message}`);
  }

  return data || [];
}

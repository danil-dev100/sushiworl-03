// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TIPOS
// ============================================

export type BucketName = 'products' | 'banners' | 'promotions';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

// ============================================
// CONFIGURAÇÃO DOS BUCKETS
// ============================================

export const BUCKETS = {
  products: 'products',
  banners: 'banners',
  promotions: 'promotions',
} as const;

// ============================================
// FUNÇÕES DE UPLOAD
// ============================================

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param file - Arquivo a ser enviado (File ou Blob)
 * @param bucket - Nome do bucket ('products', 'banners', 'promotions')
 * @param path - Caminho dentro do bucket (opcional, gera automaticamente se não fornecido)
 * @returns Resultado do upload com URL pública
 */
export async function uploadFile(
  file: File | Blob,
  bucket: BucketName,
  path?: string
): Promise<UploadResult> {
  try {
    // Gerar nome único se path não for fornecido
    const fileName = path || generateUniqueFileName(file);
    
    // Fazer upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Faz upload de múltiplos arquivos
 * @param files - Array de arquivos
 * @param bucket - Nome do bucket
 * @returns Array com resultados de cada upload
 */
export async function uploadMultipleFiles(
  files: (File | Blob)[],
  bucket: BucketName
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadFile(file, bucket));
  return Promise.all(uploadPromises);
}

/**
 * Atualiza um arquivo existente (sobrescreve)
 * @param file - Novo arquivo
 * @param bucket - Nome do bucket
 * @param path - Caminho do arquivo a ser substituído
 * @returns Resultado da atualização
 */
export async function updateFile(
  file: File | Blob,
  bucket: BucketName,
  path: string
): Promise<UploadResult> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Sobrescreve se existir
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================
// FUNÇÕES DE EXCLUSÃO
// ============================================

/**
 * Deleta um arquivo do Supabase Storage
 * @param bucket - Nome do bucket
 * @param path - Caminho do arquivo a ser deletado
 * @returns Resultado da exclusão
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<DeleteResult> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Deleta múltiplos arquivos
 * @param bucket - Nome do bucket
 * @param paths - Array de caminhos dos arquivos
 * @returns Resultado da exclusão
 */
export async function deleteMultipleFiles(
  bucket: BucketName,
  paths: string[]
): Promise<DeleteResult> {
  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Deleta um arquivo pela URL pública
 * @param url - URL pública do arquivo
 * @returns Resultado da exclusão
 */
export async function deleteFileByUrl(url: string): Promise<DeleteResult> {
  try {
    // Extrair bucket e path da URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucket = pathParts[pathParts.length - 2] as BucketName;
    const fileName = pathParts[pathParts.length - 1];

    if (!bucket || !fileName) {
      return {
        success: false,
        error: 'URL inválida',
      };
    }

    return deleteFile(bucket, fileName);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar URL',
    };
  }
}

// ============================================
// FUNÇÕES DE LISTAGEM
// ============================================

/**
 * Lista todos os arquivos em um bucket
 * @param bucket - Nome do bucket
 * @param folder - Pasta específica (opcional)
 * @returns Lista de arquivos
 */
export async function listFiles(bucket: BucketName, folder?: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return {
        success: false,
        error: error.message,
        files: [],
      };
    }

    return {
      success: true,
      files: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      files: [],
    };
  }
}

/**
 * Obtém URL pública de um arquivo
 * @param bucket - Nome do bucket
 * @param path - Caminho do arquivo
 * @returns URL pública
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Gera nome único para arquivo baseado em timestamp e random
 * @param file - Arquivo
 * @returns Nome único
 */
function generateUniqueFileName(file: File | Blob): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  // Tentar obter extensão do arquivo
  let extension = 'webp'; // Padrão
  if (file instanceof File) {
    const parts = file.name.split('.');
    if (parts.length > 1) {
      extension = parts[parts.length - 1];
    }
  } else if (file.type) {
    extension = file.type.split('/')[1] || 'webp';
  }

  return `${timestamp}-${random}.${extension}`;
}

/**
 * Valida tipo de arquivo (apenas imagens)
 * @param file - Arquivo a validar
 * @returns true se válido
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo inválido. Use PNG, JPEG ou WEBP.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 5MB.',
    };
  }

  return { valid: true };
}

/**
 * Converte File para base64 (útil para preview)
 * @param file - Arquivo
 * @returns Promise com string base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// ============================================
// INICIALIZAÇÃO DOS BUCKETS
// ============================================

/**
 * Verifica e cria buckets se não existirem
 * Esta função deve ser executada apenas no servidor
 */
export async function ensureBucketsExist() {
  if (typeof window !== 'undefined') {
    console.warn('ensureBucketsExist deve ser executado apenas no servidor');
    return;
  }

  const bucketsToCreate: BucketName[] = ['products', 'banners', 'promotions'];

  for (const bucketName of bucketsToCreate) {
    try {
      // Verificar se bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucketName);

      if (!bucketExists) {
        // Criar bucket com acesso público
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });

        if (error) {
          console.error(`Erro ao criar bucket ${bucketName}:`, error);
        } else {
          console.log(`✅ Bucket ${bucketName} criado com sucesso`);
        }
      }
    } catch (error) {
      console.error(`Erro ao verificar/criar bucket ${bucketName}:`, error);
    }
  }
}
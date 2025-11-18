'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Info } from 'lucide-react';
import { BucketName } from '@/lib/supabase';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ImageUploadProps {
  value?: string;
  onChange: (imagePath: string | null) => void;
  disabled?: boolean;
  bucket?: BucketName;
  recommendedSize?: string;
  helperText?: string;
}

export default function ImageUpload({
  value,
  onChange,
  disabled,
  bucket = 'banners',
  recommendedSize,
  helperText,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload');
      }

      const data = await response.json();
      const imageUrl: string | undefined =
        data?.url ?? data?.imageUrl ?? data?.imagePath;

      if (!imageUrl) {
        throw new Error('Resposta do upload inválida. URL não encontrada.');
      }

      setPreview(imageUrl);
      onChange(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

        {preview ? (
          <div className="relative">
            <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`relative w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              disabled || isUploading
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Enviando...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-xs text-gray-400">
                    JPEG, PNG ou WebP (máx. 5MB)
                  </p>
                  {recommendedSize && (
                    <p className="mt-2 text-xs font-medium text-gray-500 flex items-center gap-1">
                      <span>Tamanho ideal: {recommendedSize}</span>
                      {helperText && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-left text-xs">
                            {helperText}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type PopupData = {
  title: string;
  message: string;
  imageUrl?: string | null;
  buttonEnabled: boolean;
  buttonText: string;
  buttonLink: string;
  buttonLinkType: 'page' | 'product' | 'external';
  productId?: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  footerText?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
    price: number;
  } | null;
};

type ApiResponse = {
  success: boolean;
  active: boolean;
  popup: PopupData | null;
};

// Chave para localStorage
const POPUP_DISMISSED_KEY = 'sushiworld_popup_dismissed';
const POPUP_DISMISSED_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export function SitePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verificar se o popup foi fechado recentemente
  const wasRecentlyDismissed = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const dismissedAt = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (!dismissedAt) return false;

    const dismissedTime = parseInt(dismissedAt, 10);
    const now = Date.now();

    // Se passou mais de 24h, limpar e mostrar novamente
    if (now - dismissedTime > POPUP_DISMISSED_DURATION) {
      localStorage.removeItem(POPUP_DISMISSED_KEY);
      return false;
    }

    return true;
  }, []);

  // Buscar dados do popup
  useEffect(() => {
    const fetchPopup = async () => {
      // Não buscar se já foi fechado recentemente
      if (wasRecentlyDismissed()) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/popup', {
          cache: 'no-store',
        });

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const data: ApiResponse = await response.json();

        if (data.success && data.active && data.popup) {
          setPopup(data.popup);
          // Pequeno delay para animação suave
          setTimeout(() => {
            setIsAnimating(true);
            setTimeout(() => setIsOpen(true), 50);
          }, 800);
        }
      } catch (error) {
        console.error('[SitePopup] Erro ao buscar popup:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopup();
  }, [wasRecentlyDismissed]);

  // Fechar popup e salvar no localStorage
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setIsAnimating(false);
      localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
    }, 300);
  }, []);

  // Navegar para o link do botão
  const handleButtonClick = useCallback(() => {
    if (!popup) return;

    handleClose();

    setTimeout(() => {
      if (popup.buttonLinkType === 'external') {
        window.open(popup.buttonLink, '_blank');
      } else {
        router.push(popup.buttonLink);
      }
    }, 300);
  }, [popup, handleClose, router]);

  // Fechar ao clicar no overlay
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  // Prevenir scroll do body quando popup está aberto
  useEffect(() => {
    if (isAnimating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnimating]);

  // Não renderizar se não há popup ou está carregando
  if (isLoading || !popup || !isAnimating) {
    return null;
  }

  // Determinar se tem imagem (do popup ou do produto)
  const imageUrl = popup.imageUrl || popup.product?.imageUrl;
  const hasImage = !!imageUrl;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'transition-all duration-300 ease-out',
        isOpen
          ? 'bg-black/60 backdrop-blur-[2px]'
          : 'bg-black/0 backdrop-blur-none'
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      {/* Card do Popup */}
      <div
        className={cn(
          'relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl',
          'transform transition-all duration-300 ease-out',
          'flex flex-col md:flex-row',
          isOpen
            ? 'scale-100 opacity-100'
            : 'scale-95 opacity-0'
        )}
        style={{ backgroundColor: popup.backgroundColor }}
      >
        {/* Botão de fechar */}
        <button
          onClick={handleClose}
          className={cn(
            'absolute top-3 right-3 z-10',
            'flex h-8 w-8 items-center justify-center rounded-full',
            'bg-black/10 transition-colors',
            'hover:bg-black/20'
          )}
          aria-label="Fechar popup"
        >
          <X
            className="h-5 w-5"
            style={{ color: popup.textColor }}
          />
        </button>

        {/* Imagem lateral (se houver) */}
        {hasImage && (
          <div className="w-full md:w-1/2 h-48 md:h-auto shrink-0">
            <div
              className="w-full h-full bg-center bg-no-repeat bg-cover min-h-[200px]"
              style={{ backgroundImage: `url("${imageUrl}")` }}
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className={cn(
          'flex flex-col justify-center p-6 md:p-8',
          hasImage ? 'w-full md:w-1/2' : 'w-full',
          hasImage ? 'text-center md:text-left' : 'text-center'
        )}>
          {/* Título */}
          {popup.title && (
            <h2
              id="popup-title"
              className="text-2xl md:text-3xl font-extrabold leading-tight"
              style={{ color: popup.buttonColor || '#FF6B00' }}
            >
              {popup.title}
            </h2>
          )}

          {/* Mensagem */}
          <p
            className="mt-4 text-sm md:text-base leading-relaxed whitespace-pre-wrap"
            style={{ color: popup.textColor }}
            dangerouslySetInnerHTML={{
              __html: popup.message.replace(
                /\*\*(.*?)\*\*/g,
                '<span class="font-bold">$1</span>'
              ).replace(
                /`(.*?)`/g,
                `<span class="bg-[${popup.buttonColor || '#FF6B00'}]/10 px-1 py-0.5 rounded font-bold" style="color: ${popup.buttonColor || '#FF6B00'}">$1</span>`
              )
            }}
          />

          {/* Botão de ação */}
          {popup.buttonEnabled && (
            <div className="mt-8">
              <button
                onClick={handleButtonClick}
                className={cn(
                  'w-full flex cursor-pointer items-center justify-center',
                  'overflow-hidden rounded-lg h-12 px-6',
                  'text-base font-bold',
                  'transition-all duration-200',
                  'hover:shadow-lg active:scale-95'
                )}
                style={{
                  backgroundColor: popup.buttonColor,
                  color: popup.buttonTextColor,
                  boxShadow: `0 4px 14px ${popup.buttonColor}30`,
                }}
              >
                {popup.buttonText}
              </button>
            </div>
          )}

          {/* Texto de rodapé */}
          {popup.footerText && (
            <p
              className="mt-4 text-[10px] uppercase tracking-widest text-center md:text-left opacity-40"
              style={{ color: popup.textColor }}
            >
              {popup.footerText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type PopupData = {
  title: string;
  message: string;
  buttonEnabled: boolean;
  buttonText: string;
  buttonLink: string;
  buttonLinkType: 'page' | 'product' | 'external';
  productId?: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
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
            setIsOpen(true);
          }, 500);
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
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  }, []);

  // Navegar para o link do botão
  const handleButtonClick = useCallback(() => {
    if (!popup) return;

    handleClose();

    if (popup.buttonLinkType === 'external') {
      window.open(popup.buttonLink, '_blank');
    } else {
      router.push(popup.buttonLink);
    }
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Não renderizar se não há popup ou está carregando
  if (isLoading || !popup || !isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl p-6 shadow-2xl',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        style={{ backgroundColor: popup.backgroundColor }}
      >
        {/* Botão de fechar */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1.5 transition-colors hover:bg-black/10"
          aria-label="Fechar popup"
        >
          <X
            className="h-5 w-5"
            style={{ color: popup.textColor }}
          />
        </button>

        {/* Conteúdo */}
        <div className="pr-6">
          {popup.title && (
            <h2
              id="popup-title"
              className="mb-3 text-xl font-bold"
              style={{ color: popup.textColor }}
            >
              {popup.title}
            </h2>
          )}

          <p
            className="text-base leading-relaxed whitespace-pre-wrap"
            style={{ color: popup.textColor }}
          >
            {popup.message}
          </p>

          {/* Botão de ação */}
          {popup.buttonEnabled && (
            <button
              onClick={handleButtonClick}
              className="mt-5 w-full rounded-xl px-6 py-3 text-base font-semibold transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{
                backgroundColor: popup.buttonColor,
                color: popup.buttonTextColor,
              }}
            >
              {popup.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

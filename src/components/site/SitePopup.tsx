'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Bell, AlertCircle, Gift, Info } from 'lucide-react';
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

  // Determinar ícone baseado no título ou contexto
  const getIcon = () => {
    const titleLower = popup.title?.toLowerCase() || '';
    const messageLower = popup.message?.toLowerCase() || '';

    if (titleLower.includes('férias') || titleLower.includes('ferias') || titleLower.includes('fechado') ||
        messageLower.includes('férias') || messageLower.includes('ferias') || messageLower.includes('fechado')) {
      return AlertCircle;
    }
    if (titleLower.includes('promoção') || titleLower.includes('desconto') || titleLower.includes('oferta') ||
        messageLower.includes('promoção') || messageLower.includes('desconto') || messageLower.includes('oferta')) {
      return Gift;
    }
    if (titleLower.includes('aviso') || titleLower.includes('atenção') || titleLower.includes('importante')) {
      return Bell;
    }
    return Info;
  };

  const IconComponent = getIcon();

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'transition-all duration-300 ease-out',
        isOpen
          ? 'bg-black/70 backdrop-blur-md'
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
          'relative w-full max-w-[420px] overflow-hidden rounded-3xl shadow-2xl',
          'transform transition-all duration-500 ease-out',
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-8'
        )}
        style={{ backgroundColor: popup.backgroundColor }}
      >
        {/* Barra decorativa no topo */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: popup.buttonColor || '#FF6B00' }}
        />

        {/* Botão de fechar */}
        <button
          onClick={handleClose}
          className={cn(
            'absolute right-4 top-6 z-10',
            'flex h-8 w-8 items-center justify-center rounded-full',
            'bg-black/5 transition-all duration-200',
            'hover:bg-black/10 hover:scale-110 active:scale-95'
          )}
          aria-label="Fechar popup"
        >
          <X
            className="h-4 w-4"
            style={{ color: popup.textColor }}
          />
        </button>

        {/* Conteúdo */}
        <div className="px-8 pb-8 pt-6">
          {/* Ícone */}
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${popup.buttonColor}15` }}
          >
            <IconComponent
              className="h-7 w-7"
              style={{ color: popup.buttonColor || '#FF6B00' }}
            />
          </div>

          {/* Título */}
          {popup.title && (
            <h2
              id="popup-title"
              className="mb-3 text-2xl font-bold tracking-tight"
              style={{ color: popup.textColor }}
            >
              {popup.title}
            </h2>
          )}

          {/* Mensagem */}
          <p
            className="text-base leading-relaxed whitespace-pre-wrap opacity-90"
            style={{ color: popup.textColor }}
          >
            {popup.message}
          </p>

          {/* Botão de ação */}
          {popup.buttonEnabled && (
            <button
              onClick={handleButtonClick}
              className={cn(
                'mt-6 w-full rounded-xl px-6 py-3.5',
                'text-base font-semibold',
                'transform transition-all duration-200',
                'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-offset-2'
              )}
              style={{
                backgroundColor: popup.buttonColor,
                color: popup.buttonTextColor,
                boxShadow: `0 4px 14px ${popup.buttonColor}40`,
              }}
            >
              {popup.buttonText}
            </button>
          )}

          {/* Texto de fechar */}
          <button
            onClick={handleClose}
            className="mt-4 w-full text-center text-sm opacity-60 transition-opacity hover:opacity-100"
            style={{ color: popup.textColor }}
          >
            Fechar e continuar navegando
          </button>
        </div>

        {/* Decoração de canto */}
        <div
          className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full opacity-10"
          style={{ backgroundColor: popup.buttonColor || '#FF6B00' }}
        />
      </div>
    </div>
  );
}

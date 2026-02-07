'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// FUNÇÕES DE SANITIZAÇÃO (SEGURANÇA)
// ============================================

/**
 * Sanitiza texto removendo tags HTML perigosas
 * Permite apenas formatação segura: negrito e código
 */
function sanitizeMessage(message: string, accentColor: string): string {
  // 1. Escapar HTML perigoso primeiro
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // 2. Aplicar formatação segura (negrito e código)
  return escaped
    .replace(
      /\*\*(.*?)\*\*/g,
      '<span class="font-bold">$1</span>'
    )
    .replace(
      /`(.*?)`/g,
      `<span class="inline-block bg-orange-100 px-1 py-0.5 rounded font-bold text-orange-600">$1</span>`
    );
}

/**
 * Valida se a URL é segura (HTTP/HTTPS)
 */
function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Valida se é uma URL de imagem segura
 */
function getSafeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!isValidUrl(url)) return null;
  // Bloquear data: URIs e javascript:
  if (url.startsWith('data:') || url.startsWith('javascript:')) return null;
  return url;
}

/**
 * Valida link do botão
 */
function getSafeButtonLink(
  link: string,
  linkType: 'page' | 'product' | 'external'
): string {
  // Links internos: devem começar com /
  if (linkType === 'page' || linkType === 'product') {
    if (link.startsWith('/')) return link;
    return '/';
  }

  // Links externos: devem ser HTTP/HTTPS
  if (linkType === 'external') {
    if (isValidUrl(link)) return link;
    return '#';
  }

  return '/';
}

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

export function SitePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Não mostrar popup em páginas de admin, checkout, carrinho, obrigado
  const isAdminPage = pathname?.startsWith('/admin');
  const isExcludedPage = pathname === '/checkout' || pathname === '/carrinho' || pathname === '/obrigado' || pathname === '/login';
  const shouldSkip = isAdminPage || isExcludedPage;

  // Fechar popup ao navegar para páginas excluídas (SPA navigation)
  useEffect(() => {
    if (shouldSkip && (isOpen || isAnimating)) {
      setIsOpen(false);
      setIsAnimating(false);
    }
  }, [shouldSkip, isOpen, isAnimating]);

  // Buscar dados do popup (apenas em páginas de cliente, uma vez por sessão)
  useEffect(() => {
    if (shouldSkip) {
      setIsLoading(false);
      return;
    }

    // Verificar se o popup já foi exibido nesta sessão
    try {
      if (sessionStorage.getItem('popup-shown')) {
        setIsLoading(false);
        return;
      }
    } catch {
      // sessionStorage pode não estar disponível
    }

    const fetchPopup = async () => {
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
          // Marcar como exibido na sessão IMEDIATAMENTE
          try {
            sessionStorage.setItem('popup-shown', '1');
          } catch {
            // sessionStorage pode não estar disponível
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fechar popup
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    try {
      sessionStorage.setItem('popup-shown', '1');
    } catch {
      // sessionStorage pode não estar disponível
    }
  }, []);

  // Navegar para o link do botão - com validação de segurança
  const handleButtonClick = useCallback(() => {
    if (!popup) return;

    // Validar link antes de navegar
    const safeLink = getSafeButtonLink(popup.buttonLink, popup.buttonLinkType);
    if (safeLink === '#') return; // Link inválido, não navegar

    handleClose();

    setTimeout(() => {
      if (popup.buttonLinkType === 'external') {
        // Links externos: abrir em nova aba com noopener/noreferrer
        window.open(safeLink, '_blank', 'noopener,noreferrer');
      } else {
        router.push(safeLink);
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

  // Sanitizar mensagem para prevenir XSS (DEVE estar antes do return condicional!)
  const sanitizedMessage = useMemo(
    () => popup ? sanitizeMessage(popup.message, popup.buttonColor || '#FF6B00') : '',
    [popup?.message, popup?.buttonColor]
  );

  // Determinar se tem imagem (do popup ou do produto) - com validação de segurança
  const rawImageUrl = popup?.imageUrl || popup?.product?.imageUrl;
  const imageUrl = getSafeImageUrl(rawImageUrl);
  const hasImage = !!imageUrl;

  // Não renderizar em páginas excluídas ou se não há popup
  if (shouldSkip || isLoading || !popup || !isAnimating) {
    return null;
  }

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

          {/* Mensagem - sanitizada para prevenir XSS */}
          <p
            className="mt-4 text-sm md:text-base leading-relaxed whitespace-pre-wrap"
            style={{ color: popup.textColor }}
            dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
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

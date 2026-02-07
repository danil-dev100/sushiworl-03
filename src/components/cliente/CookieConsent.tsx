'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

const STORAGE_KEY = 'cookie-consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Pequeno delay para não bloquear a renderização inicial
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Não mostrar em páginas admin
  if (pathname?.startsWith('/admin')) return null;

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* JSON-LD Structured Data para SEO - informa ao Google que o site tem gestão de cookies */}
      <Script
        id="cookie-consent-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Cookie Consent',
            description: 'Este site utiliza cookies para melhorar a experiência do utilizador.',
            publisher: {
              '@type': 'Organization',
              name: 'SushiWorld',
            },
          }),
        }}
      />

      {/* Banner de cookies */}
      <div
        role="dialog"
        aria-label="Consentimento de cookies"
        aria-describedby="cookie-consent-text"
        className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-500"
      >
        <div className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p
              id="cookie-consent-text"
              className="text-sm text-[#333333] text-center sm:text-left"
            >
              Utilizamos cookies para melhorar a sua experiência.{' '}
              <Link
                href="/politica-privacidade"
                className="text-[#FF6B00] underline hover:no-underline font-medium"
              >
                Política de Privacidade
              </Link>
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-1.5 text-sm text-[#666666] border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Recusar
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-1.5 text-sm text-white bg-[#FF6B00] rounded-md hover:bg-[#e55f00] transition-colors font-medium cursor-pointer"
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

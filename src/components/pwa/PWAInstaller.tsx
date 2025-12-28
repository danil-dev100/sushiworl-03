'use client';

import { useEffect } from 'react';

/**
 * Componente para registrar Service Worker e detectar instalação do PWA
 * Deve ser incluído no layout principal
 */
export function PWAInstaller() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Detectar evento de instalação (beforeinstallprompt)
    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      console.log('[PWA] Install prompt available');

      // Track que o link foi clicado (chegou até aqui)
      trackInstallEvent('LINK_CLICKED');
    });

    // Detectar quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');

      // Track instalação bem-sucedida
      trackInstallEvent('APP_INSTALLED', true);

      // Notificar Service Worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'APP_INSTALLED',
          url: window.location.href,
        });
      }
    });

    // Detectar se está rodando como PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      console.log('[PWA] Running in standalone mode');

      // Track abertura do app
      trackInstallEvent('APP_OPENED');
    }

    function trackInstallEvent(eventType: string, isConverted = false) {
      // Pegar parâmetros UTM da URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');

      // Só rastrear se tiver UTM (veio de campanha)
      if (!utmSource && !utmMedium) return;

      fetch('/api/pwa/track-install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          utmSource,
          utmMedium,
          utmCampaign,
          eventType,
          isConverted,
        }),
      })
        .then(() => console.log(`[PWA] Tracked: ${eventType}`))
        .catch((err) => console.error('[PWA] Track failed:', err));
    }
  }, []);

  return null;
}

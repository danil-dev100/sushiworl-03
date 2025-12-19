'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface Integration {
  id: string;
  platform: string;
  pixelId: string | null;
  measurementId: string | null;
  isActive: boolean;
}

/**
 * Componente que carrega scripts de pixels dinamicamente
 * baseado nas configurações do admin
 */
export function PixelScripts() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Buscar configuração de pixels
    fetch('/api/events/config')
      .then(res => res.json())
      .then(data => {
        setIntegrations(data.integrations || []);
        setLoaded(true);
      })
      .catch(error => {
        console.error('[PixelScripts] Erro ao buscar configuração:', error);
        setLoaded(true);
      });
  }, []);

  if (!loaded) {
    return null;
  }

  // Extrair pixels ativos
  const facebookPixels = integrations.filter(
    i => i.platform === 'FACEBOOK' && i.pixelId
  );
  const gaPixels = integrations.filter(
    i => i.platform === 'GOOGLE_ANALYTICS' && i.measurementId
  );
  const gtmPixels = integrations.filter(
    i => i.platform === 'GOOGLE_TAG_MANAGER' && i.measurementId
  );

  return (
    <>
      {/* Facebook Pixel */}
      {facebookPixels.map(pixel => (
        <Script
          key={`fb-pixel-${pixel.id}`}
          id={`facebook-pixel-${pixel.pixelId}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixel.pixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      ))}

      {/* Facebook Pixel - noscript fallback */}
      {facebookPixels.map(pixel => (
        <noscript key={`fb-noscript-${pixel.id}`}>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${pixel.pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      ))}

      {/* Google Analytics 4 */}
      {gaPixels.map(pixel => (
        <>
          <Script
            key={`ga-script-${pixel.id}`}
            src={`https://www.googletagmanager.com/gtag/js?id=${pixel.measurementId}`}
            strategy="afterInteractive"
          />
          <Script
            key={`ga-config-${pixel.id}`}
            id={`google-analytics-${pixel.measurementId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${pixel.measurementId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      ))}

      {/* Google Tag Manager */}
      {gtmPixels.map(pixel => (
        <>
          <Script
            key={`gtm-script-${pixel.id}`}
            id={`google-tag-manager-${pixel.measurementId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${pixel.measurementId}');
              `,
            }}
          />
          <noscript key={`gtm-noscript-${pixel.id}`}>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${pixel.measurementId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      ))}
    </>
  );
}

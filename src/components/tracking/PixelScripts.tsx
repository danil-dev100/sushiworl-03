'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface Integration {
  id: string;
  platform: string;
  pixelId: string | null;
  measurementId: string | null;
  apiKey: string | null;
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
  const gadsPixels = integrations.filter(
    i => i.platform === 'GOOGLE_ADS' && i.measurementId
  );
  const tiktokPixels = integrations.filter(
    i => i.platform === 'TIKTOK' && i.pixelId
  );
  const pinterestPixels = integrations.filter(
    i => i.platform === 'PINTEREST' && i.pixelId
  );
  const taboolaPixels = integrations.filter(
    i => i.platform === 'TABOOLA' && i.pixelId
  );

  // Verificar se GA4 já carrega o gtag.js (evitar duplicar o script)
  const gtagAlreadyLoaded = gaPixels.length > 0;

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

      {/* Google Ads */}
      {gadsPixels.map(pixel => (
        <>
          {/* Carregar gtag.js apenas se GA4 não estiver ativo */}
          {!gtagAlreadyLoaded && (
            <Script
              key={`gads-script-${pixel.id}`}
              src={`https://www.googletagmanager.com/gtag/js?id=${pixel.measurementId}`}
              strategy="afterInteractive"
            />
          )}
          <Script
            key={`gads-config-${pixel.id}`}
            id={`google-ads-${pixel.measurementId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                ${!gtagAlreadyLoaded ? "gtag('js', new Date());" : ''}
                gtag('config', '${pixel.measurementId}');
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

      {/* TikTok Pixel */}
      {tiktokPixels.map(pixel => (
        <Script
          key={`tt-pixel-${pixel.id}`}
          id={`tiktok-pixel-${pixel.pixelId}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
              ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
              var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;
              var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};
              ttq.load('${pixel.pixelId}');
              ttq.page();
            }(window,document,'ttq');
            `,
          }}
        />
      ))}

      {/* Pinterest Tag */}
      {pinterestPixels.map(pixel => (
        <Script
          key={`pin-pixel-${pixel.id}`}
          id={`pinterest-tag-${pixel.pixelId}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
              var n=window.pintrk;n.queue=[],n.version="3.0";
              var t=document.createElement("script");t.async=!0,t.src=e;
              var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}
              ("https://s.pinimg.com/ct/core.js");
              pintrk('load', '${pixel.pixelId}');
              pintrk('page');
            `,
          }}
        />
      ))}

      {/* Pinterest - noscript fallback */}
      {pinterestPixels.map(pixel => (
        <noscript key={`pin-noscript-${pixel.id}`}>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://ct.pinterest.com/v3/?event=init&tid=${pixel.pixelId}&noscript=1`}
            alt=""
          />
        </noscript>
      ))}

      {/* Taboola Pixel */}
      {taboolaPixels.map(pixel => (
        <Script
          key={`tbl-pixel-${pixel.id}`}
          id={`taboola-pixel-${pixel.pixelId}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window._tfa=window._tfa||[];
              window._tfa.push({notify:'event',name:'page_view',id:${pixel.pixelId}});
              !function(t,f,a,x){if(!document.getElementById(x)){
              t.async=1;t.src=a;t.id=x;f.parentNode.insertBefore(t,f);}}
              (document.createElement('script'),document.getElementsByTagName('script')[0],
              '//cdn.taboola.com/libtrc/unip/${pixel.pixelId}/tfa.js','tb_tfa_script');
            `,
          }}
        />
      ))}
    </>
  );
}

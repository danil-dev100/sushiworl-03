'use client';

import dynamic from 'next/dynamic';

const PixelScripts = dynamic(
  () => import('@/components/tracking/PixelScripts').then((mod) => mod.PixelScripts),
  { ssr: false }
);
const SitePopup = dynamic(
  () => import('@/components/site/SitePopup').then((mod) => mod.SitePopup),
  { ssr: false }
);
const CookieConsent = dynamic(
  () => import('@/components/cliente/CookieConsent'),
  { ssr: false }
);
const PWAInstaller = dynamic(
  () => import('@/components/pwa/PWAInstaller').then((mod) => mod.PWAInstaller),
  { ssr: false }
);

export function DeferredComponents() {
  return (
    <>
      <PixelScripts />
      <PWAInstaller />
      <SitePopup />
      <CookieConsent />
    </>
  );
}

import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Áreas de Entrega | SushiWorld Admin',
  description: 'Gerencie áreas de entrega e taxas',
};

export default function AreasEntregaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      {children}
    </>
  );
}


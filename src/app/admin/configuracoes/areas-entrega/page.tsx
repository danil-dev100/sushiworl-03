import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DeliveryAreasPageContent } from '@/components/admin/delivery/DeliveryAreasPageContent';
import Script from 'next/script';

export const metadata = {
  title: 'Áreas de Entrega | SushiWorld Admin',
  description: 'Gerencie áreas de entrega e taxas',
};

export default async function AreasEntregaPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/dashboard');
  }

  const deliveryAreas = await prisma.deliveryArea.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  // Buscar configurações do restaurante para localização
  const settings = await prisma.settings.findFirst();

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <DeliveryAreasPageContent
        initialAreas={deliveryAreas}
        restaurantAddress={settings?.address || ''}
      />
    </>
  );
}


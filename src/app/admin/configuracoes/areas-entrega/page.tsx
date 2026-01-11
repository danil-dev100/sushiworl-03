import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DeliveryAreasPageContent } from '@/components/admin/delivery/DeliveryAreasPageContent';

export const metadata = {
  title: 'Áreas de Entrega | SushiWorld Admin',
  description: 'Gerencie áreas de entrega e taxas',
};

type DeliveryAreaWithPolygon = {
  id: string;
  name: string;
  polygon: number[][];
  color: string;
  deliveryType: 'FREE' | 'PAID' | 'DISTANCE';
  deliveryFee: number;
  minOrderValue: number | null;
  pricePerKm: number;
  drawMode: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  priority: number;
  isActive: boolean;
  sortOrder: number;
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

  // Converter polygon de JsonValue para number[][]
  const areasWithTypedPolygon: DeliveryAreaWithPolygon[] = deliveryAreas.map(area => ({
    id: area.id,
    name: area.name,
    polygon: area.polygon as number[][],
    color: area.color,
    deliveryType: area.deliveryType as 'FREE' | 'PAID' | 'DISTANCE',
    deliveryFee: area.deliveryFee,
    minOrderValue: area.minOrderValue,
    pricePerKm: area.pricePerKm,
    drawMode: area.drawMode,
    centerLat: area.centerLat,
    centerLng: area.centerLng,
    radiusKm: area.radiusKm,
    priority: area.priority,
    isActive: area.isActive,
    sortOrder: area.sortOrder,
  }));

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <DeliveryAreasPageContent
        initialAreas={areasWithTypedPolygon}
        restaurantAddress={settings?.address || ''}
      />
    </>
  );
}


import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AppDownloadPage } from '@/components/admin/marketing/AppDownloadPage';

export const metadata: Metadata = {
  title: 'Download de Apps | Admin',
  description: 'Gerar links de instalação do app com QR codes e analytics',
};

export default async function AppsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/marketing/apps');
  }

  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/');
  }

  return <AppDownloadPage />;
}

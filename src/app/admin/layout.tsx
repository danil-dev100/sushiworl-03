import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/dashboard');
  }

  const { user } = session;

  if (!['ADMIN', 'MANAGER'].includes(user.role)) {
    redirect('/');
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}

import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⚠️ AUTENTICAÇÃO DESABILITADA TEMPORARIAMENTE PARA DESENVOLVIMENTO
  // TODO: REABILITAR ANTES DO DEPLOY EM PRODUÇÃO!
  
  /*
  const session = await getServerSession(authOptions);

  // Redirecionar se não estiver autenticado ou não for admin/gerente
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/login?callbackUrl=/admin/dashboard');
  }
  */

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f1e9] dark:bg-[#23170f]">
      <AdminSidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
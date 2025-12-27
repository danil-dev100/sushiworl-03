'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/app/admin-responsive.css';

interface AdminLayoutClientProps {
  user: any;
  children: React.ReactNode;
}

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f1e9] dark:bg-[#23170f]">
      {/* Sidebar Desktop - Oculta em mobile */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Sidebar Mobile - Sheet/Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-24 p-0 border-r border-[#e5d5b5] dark:border-[#3d2e1f]">
          <AdminSidebar onItemClick={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header com botão de menu mobile */}
        <div className="sticky top-0 z-40 border-b border-[#e5d5b5] dark:border-[#3d2e1f] bg-white dark:bg-[#2a1e14]">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
            {/* Botão Menu Mobile - Visível apenas em mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-[#FF6B00]" />
              <span className="sr-only">Abrir menu</span>
            </Button>

            {/* Header Content */}
            <div className="flex-1">
              <AdminHeader user={user} />
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

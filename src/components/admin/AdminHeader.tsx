'use client';

import { Bell, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export function AdminHeader() {
  // ⚠️ Modo desenvolvimento - sessão mockada
  const mockUser = {
    name: 'Desenvolvedor',
    role: 'ADMIN',
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#ead9cd] bg-white px-6 py-4 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-[#a16b45]">Bem-vindo de volta,</h2>
          <h1 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">
            {mockUser.name}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative rounded-full p-2 hover:bg-[#f5f1e9] dark:hover:bg-[#23170f]">
            <Bell className="h-5 w-5 text-[#a16b45]" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF6B00]"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9]">
                {mockUser.name}
              </p>
              <p className="text-xs text-[#a16b45]">
                {mockUser.role === 'ADMIN' ? 'Administrador' : 'Gerente'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                href="/admin/perfil"
                className="rounded-full p-2 hover:bg-[#f5f1e9] dark:hover:bg-[#23170f]"
              >
                <User className="h-5 w-5 text-[#a16b45]" />
              </Link>
              
              <button
                onClick={() => alert('Logout desabilitado em modo desenvolvimento')}
                className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Sair"
              >
                <LogOut className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


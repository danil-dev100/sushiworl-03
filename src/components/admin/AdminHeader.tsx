'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';

type AdminHeaderProps = {
  user: {
    name?: string | null;
    role?: string | null;
  };
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const roleLabel = useMemo(() => {
    if (user?.role === 'ADMIN') {
      return 'Administrador';
    }

    if (user?.role === 'MANAGER') {
      return 'Gerente';
    }

    return 'Usuário';
  }, [user?.role]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: '/login' });
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = user?.name || 'Usuário';

  return (
    <div className="flex items-center justify-between w-full">
      {/* Welcome Message - Oculto em telas pequenas */}
      <div className="hidden sm:block">
        <h2 className="text-sm font-medium text-[#a16b45]">Bem-vindo de volta,</h2>
        <h1 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">
          {displayName}
        </h1>
      </div>

      {/* Nome simplificado no mobile */}
      <div className="block sm:hidden">
        <h1 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
          {displayName}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button className="relative rounded-full p-2 hover:bg-[#f5f1e9] dark:hover:bg-[#23170f]" aria-label="Notificações">
          <Bell className="h-5 w-5 text-[#a16b45]" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF6B00]"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Info - Oculto em mobile */}
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-[#333333] dark:text-[#f5f1e9]">
              {displayName}
            </p>
            <p className="text-xs text-[#a16b45]">{roleLabel}</p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => router.push('/admin/configuracoes/usuarios')}
              className="rounded-full p-2 hover:bg-[#f5f1e9] dark:hover:bg-[#23170f]"
              aria-label="Perfil"
            >
              <User className="h-5 w-5 text-[#a16b45]" />
            </button>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-full p-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5 text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

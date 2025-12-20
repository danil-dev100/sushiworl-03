'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  Settings,
  MapPin,
  TrendingUp,
  Webhook,
  Printer,
  Mail,
  Link2
} from 'lucide-react';
import { useOrderPolling } from '@/hooks/useOrderPolling';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    label: 'Pedidos',
    icon: ShoppingCart,
    href: '/admin/pedidos',
  },
  {
    label: 'Cardápio',
    icon: UtensilsCrossed,
    href: '/admin/cardapio',
  },
  {
    label: 'Usuários',
    icon: Users,
    href: '/admin/configuracoes/usuarios',
  },
  {
    label: 'Marketing',
    icon: TrendingUp,
    href: '/admin/marketing/promocoes',
  },
  {
    label: 'Email',
    icon: Mail,
    href: '/admin/marketing/email',
  },
  {
    label: 'Webhooks',
    icon: Webhook,
    href: '/admin/marketing/webhooks',
  },
  {
    label: 'Pixels',
    icon: TrendingUp,
    href: '/admin/marketing/pixels',
  },
  {
    label: 'UTM',
    icon: Link2,
    href: '/admin/marketing/utm',
  },
  {
    label: 'Entrega',
    icon: MapPin,
    href: '/admin/configuracoes/areas-entrega',
  },
  {
    label: 'Impressora',
    icon: Printer,
    href: '/admin/configuracoes/impressora',
  },
  {
    label: 'Ajustes',
    icon: Settings,
    href: '/admin/configuracoes/empresa',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  // Hook de polling para mostrar badge de pedidos pendentes
  const { newOrdersCount } = useOrderPolling(true);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="flex w-24 flex-col items-center gap-10 border-r border-[#ead9cd] bg-white p-4 dark:border-[#4a3c30] dark:bg-[#2a1e14]">
      {/* Logo */}
      <Link href="/admin/dashboard" className="relative h-12 w-12">
        <div className="aspect-square w-12 rounded-full bg-cover bg-center bg-no-repeat"
             style={{backgroundImage: 'url("/logo.webp/logo-nova-sushiworl-santa-iria-sem-fundo.webp")'}}>
        </div>
      </Link>

      {/* Menu Items */}
      <nav className="flex flex-col gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isPedidos = item.href === '/admin/pedidos';
          const showBadge = isPedidos && newOrdersCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1.5 transition-colors ${
                active
                  ? 'text-[#FF6B00]'
                  : 'text-[#a16b45] hover:text-[#FF6B00] dark:text-[#a16b45]'
              }`}
              title={item.label}
            >
              <Icon className="h-7 w-7" />
              <p className={`text-xs leading-normal ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </p>
              {showBadge && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white animate-pulse">
                  {newOrdersCount > 9 ? '9+' : newOrdersCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


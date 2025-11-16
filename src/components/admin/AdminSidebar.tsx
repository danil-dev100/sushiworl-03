'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  UtensilsCrossed, 
  Users, 
  BarChart3, 
  Settings,
  Tag,
  Mail,
  Webhook,
  MapPin,
  TrendingUp
} from 'lucide-react';

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
    label: 'Clientes',
    icon: Users,
    href: '/admin/configuracoes/usuarios',
  },
  {
    label: 'Promoções',
    icon: Tag,
    href: '/admin/marketing/promocoes',
  },
  {
    label: 'Relatórios',
    icon: BarChart3,
    href: '/admin/marketing/relatorios',
  },
  {
    label: 'Áreas Entrega',
    icon: MapPin,
    href: '/admin/areas-entrega',
  },
  {
    label: 'Marketing',
    icon: TrendingUp,
    href: '/admin/marketing/ofertas',
  },
  {
    label: 'Email',
    icon: Mail,
    href: '/admin/configuracoes/email',
  },
  {
    label: 'Integrações',
    icon: Webhook,
    href: '/admin/configuracoes/integracoes',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

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
        {menuItems.slice(0, -2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
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
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="mt-auto flex flex-col items-center gap-1.5 text-[#a16b45] hover:text-[#FF6B00] dark:text-[#a16b45]">
        <Link href="/admin/configuracoes/empresa" className="flex flex-col items-center gap-1.5">
          <Settings className="h-7 w-7" />
          <p className="text-xs font-medium leading-normal">Ajustes</p>
        </Link>
      </div>
    </aside>
  );
}


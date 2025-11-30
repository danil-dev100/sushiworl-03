import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageUsers } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UsersPageContent } from '@/components/admin/users/UsersPageContent';

type AdminRole = 'ADMIN' | 'MANAGER';
type AdminManagerLevel = 'BASIC' | 'INTERMEDIATE' | 'FULL';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  managerLevel: AdminManagerLevel | null;
  isActive: boolean;
  firstLogin: boolean;
  createdAt: Date;
};

export default async function UsuariosSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect('/admin/dashboard');
  }

  const usersFromDb = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'MANAGER'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerLevel: true,
      isActive: true,
      firstLogin: true,
      createdAt: true,
    },
  });

  // Mapear para o tipo esperado pelo componente
  const users: AdminUser[] = usersFromDb.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AdminRole,
    managerLevel: user.managerLevel as AdminManagerLevel | null,
    isActive: user.isActive,
    firstLogin: user.firstLogin,
    createdAt: user.createdAt,
  }));

  return (
    <UsersPageContent
      currentUserId={session.user.id}
      initialUsers={users}
    />
  );
}
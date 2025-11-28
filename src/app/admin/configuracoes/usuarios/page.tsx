import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageUsers } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UsersPageContent } from '@/components/admin/users/UsersPageContent';

export default async function UsuariosSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect('/admin/dashboard');
  }

  const users = await prisma.user.findMany({
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

  return (
    <UsersPageContent
      currentUserId={session.user.id}
      initialUsers={users}
    />
  );
}
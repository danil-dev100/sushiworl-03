import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';
import FlowBuilderContent from '@/components/admin/email-marketing/FlowBuilderContent';

export default async function FlowBuilderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !canManageMarketing(session.user.role, session.user.managerLevel ?? null)
  ) {
    redirect('/admin/dashboard');
  }

  const { id } = params;

  try {
    // Se é "new", criar nova automação
    if (id === 'new') {
      const automation = await prisma.emailAutomation.create({
        data: {
          name: 'Nova Automação',
          description: '',
          flow: { nodes: [], edges: [] },
          isActive: false,
          isDraft: true,
          createdBy: session.user.id,
        },
      });

      redirect(`/admin/marketing/email/builder/${automation.id}`);
    }

    // Buscar automação existente
    const automation = await prisma.emailAutomation.findUnique({
      where: { id },
    });

    if (!automation) {
      redirect('/admin/marketing/email');
    }

    // Buscar templates disponíveis
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        subject: true,
      },
    });

    return (
      <FlowBuilderContent
        automation={automation}
        templates={templates}
        currentUser={{
          id: session.user.id,
          role: session.user.role,
        }}
      />
    );
  } catch (error) {
    console.error('Erro ao carregar builder:', error);
    redirect('/admin/marketing/email');
  }
}

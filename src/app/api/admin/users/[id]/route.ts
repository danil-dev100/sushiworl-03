import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageUsers } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

async function ensurePermissions() {
  const session = await getServerSession(authOptions);

  if (!session || !canManageUsers(session.user.role)) {
    return { authorized: false as const, session: null };
  }

  return { authorized: true as const, session };
}

/**
 * Atualiza dados do usuário (parcial)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, session } = await ensurePermissions();

    if (!authorized || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { name, email, role, managerLevel, isActive, password } = body;

    const data: Record<string, unknown> = {};

    if (typeof name === 'string') data.name = name;

    // Validar email duplicado antes de atualizar
    if (typeof email === 'string') {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingEmail && existingEmail.id !== id) {
        return NextResponse.json(
          { error: 'Já existe um usuário com este email' },
          { status: 409 }
        );
      }

      data.email = email;
    }

    if (typeof isActive === 'boolean') data.isActive = isActive;

    if (role) {
      if (!['ADMIN', 'MANAGER'].includes(role)) {
        return NextResponse.json(
          { error: 'Cargo inválido' },
          { status: 400 }
        );
      }
      data.role = role;
      data.managerLevel = role === 'MANAGER' ? managerLevel ?? null : null;
    } else if (managerLevel) {
      // Se apenas managerLevel for enviado, valide que usuário é manager
      const existing = await prisma.user.findUnique({
        where: { id: id },
        select: { role: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      if (existing.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Somente gerentes podem ter nível de acesso' },
          { status: 400 }
        );
      }

      data.managerLevel = managerLevel;
    }

    if (password) {
      // Validar comprimento mínimo da senha
      if (password.trim().length < 8) {
        return NextResponse.json(
          { error: 'A senha deve ter no mínimo 8 caracteres' },
          { status: 400 }
        );
      }

      data.password = await bcrypt.hash(password, 10);
      data.firstLogin = true;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma alteração informada' },
        { status: 400 }
      );
    }

    // Impedir que usuário remova a si mesmo
    if (session.user.id === id && data.role && data.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Você não pode alterar seu próprio cargo' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerLevel: true,
        isActive: true,
        firstLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath('/admin/configuracoes/usuarios');

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('[Users API][PATCH] Erro ao atualizar usuário:', error);

    // Tratar erro de email duplicado (caso escape da validação)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

/**
 * Remove usuário administrativo
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, session } = await ensurePermissions();

    if (!authorized || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Você não pode remover o seu próprio usuário' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: id },
    });

    revalidatePath('/admin/configuracoes/usuarios');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Users API][DELETE] Erro ao remover usuário:', error);
    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao remover usuário' },
      { status: 500 }
    );
  }
}


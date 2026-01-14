import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageUsers } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { triggerWebhooks } from '@/lib/webhooks';

/**
 * Lista todos os usuários administrativos (ADMIN e MANAGER)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
        updatedAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[Users API][GET] Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

/**
 * Cria um novo usuário administrativo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, managerLevel } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nome, email, senha e cargo são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar comprimento mínimo da senha
    if (password.trim().length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'MANAGER'].includes(role)) {
      return NextResponse.json(
        { error: 'Cargo inválido' },
        { status: 400 }
      );
    }

    if (role === 'MANAGER' && !managerLevel) {
      return NextResponse.json(
        { error: 'Selecione o nível de acesso do gerente' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        managerLevel: role === 'MANAGER' ? managerLevel : null,
        firstLogin: true,
        isActive: true,
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
        updatedAt: true,
      },
    });

    // Disparar webhook customer.created
    console.log(`[Users API] ✅ Disparando webhook: customer.created para usuário ${user.email}`);
    triggerWebhooks('customer.created', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }).catch(error => {
      console.error('[Users API] ❌ Erro ao disparar webhook customer.created:', error);
    });

    revalidatePath('/admin/configuracoes/usuarios');

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('[Users API][POST] Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}


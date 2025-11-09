import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Verificar se usuário existe e tem senha (admin/manager)
        if (!user || !user.password) {
          throw new Error('Credenciais inválidas');
        }

        // Verificar se usuário está ativo
        if (!user.isActive) {
          throw new Error('Usuário inativo. Entre em contato com o administrador.');
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Credenciais inválidas');
        }

        // Retornar dados do usuário
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          managerLevel: user.managerLevel,
          firstLogin: user.firstLogin,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Adicionar dados do usuário ao token na primeira vez
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.managerLevel = user.managerLevel;
        token.firstLogin = user.firstLogin;
      }

      // Atualizar token quando sessão for atualizada
      if (trigger === 'update' && session) {
        token.firstLogin = session.firstLogin;
        token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      // Adicionar dados do token à sessão
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.managerLevel = token.managerLevel as string | null;
        session.user.firstLogin = token.firstLogin as boolean;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirecionar após login baseado no role
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// ============================================
// FUNÇÕES AUXILIARES DE AUTENTICAÇÃO
// ============================================

/**
 * Verifica se o usuário tem permissão de admin
 */
export function isAdmin(role: string): boolean {
  return role === 'ADMIN';
}

/**
 * Verifica se o usuário é manager
 */
export function isManager(role: string): boolean {
  return role === 'MANAGER';
}

/**
 * Verifica se o usuário tem permissão de admin ou manager
 */
export function isAdminOrManager(role: string): boolean {
  return isAdmin(role) || isManager(role);
}

/**
 * Verifica nível de acesso do manager
 */
export function hasManagerLevel(
  role: string,
  managerLevel: string | null,
  requiredLevel: 'BASIC' | 'INTERMEDIATE' | 'FULL'
): boolean {
  // Admin tem acesso total
  if (isAdmin(role)) return true;

  // Se não for manager, não tem acesso
  if (!isManager(role) || !managerLevel) return false;

  // Mapear níveis para números
  const levels = {
    BASIC: 1,
    INTERMEDIATE: 2,
    FULL: 3,
  };

  const userLevel = levels[managerLevel as keyof typeof levels] || 0;
  const required = levels[requiredLevel];

  return userLevel >= required;
}

/**
 * Verifica se o manager pode acessar área financeira
 */
export function canAccessFinancial(role: string): boolean {
  // Apenas admin pode acessar área financeira
  return isAdmin(role);
}

/**
 * Verifica se o manager pode editar dados de clientes
 */
export function canEditCustomerData(role: string): boolean {
  // Apenas admin pode editar dados de clientes
  return isAdmin(role);
}

/**
 * Verifica se pode gerenciar pedidos
 */
export function canManageOrders(
  role: string,
  managerLevel: string | null
): boolean {
  // Admin tem acesso total
  if (isAdmin(role)) return true;

  // Manager com qualquer nível pode gerenciar pedidos
  return isManager(role) && managerLevel !== null;
}

/**
 * Verifica se pode editar pedidos
 */
export function canEditOrders(
  role: string,
  managerLevel: string | null
): boolean {
  // Admin tem acesso total
  if (isAdmin(role)) return true;

  // Apenas manager INTERMEDIATE ou FULL pode editar
  return hasManagerLevel(role, managerLevel, 'INTERMEDIATE');
}

/**
 * Verifica se pode gerenciar produtos
 */
export function canManageProducts(
  role: string,
  managerLevel: string | null
): boolean {
  // Admin tem acesso total
  if (isAdmin(role)) return true;

  // Manager FULL pode gerenciar produtos
  return hasManagerLevel(role, managerLevel, 'FULL');
}

/**
 * Verifica se pode gerenciar configurações
 */
export function canManageSettings(role: string): boolean {
  // Apenas admin pode gerenciar configurações
  return isAdmin(role);
}

/**
 * Verifica se pode gerenciar usuários
 */
export function canManageUsers(role: string): boolean {
  // Apenas admin pode gerenciar usuários
  return isAdmin(role);
}

/**
 * Verifica se pode gerenciar marketing
 */
export function canManageMarketing(
  role: string,
  managerLevel: string | null
): boolean {
  // Admin tem acesso total
  if (isAdmin(role)) return true;

  // Manager FULL pode gerenciar marketing
  return hasManagerLevel(role, managerLevel, 'FULL');
}

/**
 * Verifica se pode imprimir pedidos
 */
export function canPrintOrders(
  role: string,
  managerLevel: string | null
): boolean {
  // Admin e qualquer manager pode imprimir
  return isAdminOrManager(role) && (isAdmin(role) || managerLevel !== null);
}

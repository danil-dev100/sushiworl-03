import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Proteger rotas /admin/*
    if (pathname.startsWith('/admin')) {
      // Se não estiver autenticado, nextAuth já redireciona para /login
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Verificar se é ADMIN ou MANAGER
      const role = token.role as string;
      if (!['ADMIN', 'MANAGER'].includes(role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Permitir acesso a páginas públicas
        if (!pathname.startsWith('/admin')) {
          return true;
        }

        // Para rotas admin, requer autenticação
        if (!token) {
          return false;
        }

        // Verificar role
        const role = token.role as string;
        return ['ADMIN', 'MANAGER'].includes(role);
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Configurar quais rotas o middleware deve proteger
export const config = {
  matcher: [
    '/admin/:path*',
    // Proteger API routes de admin também
    '/api/admin/:path*',
  ],
};

'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Redirecionar para a página solicitada ou dashboard
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f1e9] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.webp/logo-nova-sushiworl-santa-iria-sem-fundo.webp"
              alt="SushiWorld"
              width={200}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-center text-[#333333] mb-2">
            Painel Administrativo
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Faça login para acessar o sistema
          </p>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#FF6B00]"
                tabIndex={-1}
                aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Links úteis */}
          <div className="mt-6 space-y-2 text-center">
            <Link
              href="/admin/trocar-senha"
              className="block text-sm text-[#FF6B00] hover:text-[#FF6B00]/80 transition-colors underline"
            >
              Trocar senha
            </Link>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="block w-full text-sm text-gray-600 hover:text-[#FF6B00] transition-colors"
            >
              ← Voltar ao site
            </button>
          </div>
        </div>

        {/* Informação de primeiro acesso */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Primeiro acesso?</p>
          <p className="text-xs mt-1">
            Use as credenciais fornecidas pelo administrador
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}


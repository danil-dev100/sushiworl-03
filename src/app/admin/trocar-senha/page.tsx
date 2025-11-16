'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { ChangePasswordForm } from '@/components/admin/auth/ChangePasswordForm';

export default function TrocarSenhaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[#a16b45]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f1e9] px-4">
      <div className="mb-8">
        <Image
          src="/logo.webp/logo-nova-sushiworl-santa-iria-sem-fundo.webp"
          alt="SushiWorld"
          width={200}
          height={80}
          className="h-20 w-auto object-contain"
          priority
        />
      </div>
      <ChangePasswordForm email={session.user.email} />
    </div>
  );
}



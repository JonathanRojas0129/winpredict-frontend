'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { hydrated, isAuthenticated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [hydrated, isAuthenticated, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D0520',
        color: 'rgba(255,255,255,0.5)',
      }}
    >
      Cargando WinPredict...
    </main>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { label: 'Inicio', ruta: '/dashboard', icon: '⊞' },
  { label: 'Partidos', ruta: '/partidos', icon: '⚽' },
  { label: 'Ranking', ruta: '/rankings', icon: '📊' },
  { label: 'Perfil', ruta: '/perfil', icon: '○' },
] as const;

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'rgba(13,5,32,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        zIndex: 100,
      }}
    >
      {TABS.map(tab => {
        const activo =
          pathname === tab.ruta ||
          (tab.ruta === '/dashboard' && pathname.startsWith('/grupo/'));
        return (
          <button
            key={tab.ruta}
            type="button"
            onClick={() => router.push(tab.ruta)}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <span
              style={{
                fontSize: '1.1rem',
                color: activo ? '#F5C842' : 'rgba(255,255,255,0.35)',
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: activo ? '#F5C842' : 'rgba(255,255,255,0.35)',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

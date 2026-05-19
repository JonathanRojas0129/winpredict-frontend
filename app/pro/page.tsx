// app/pro/page.tsx
// Página de upgrade a plan PRO — integración MercadoPago
// crafted by JR ♥

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/errors';
import BottomNav from '@/components/layout/BottomNav';

const BENEFICIOS = [
  {
    icon: '🤖',
    titulo: 'Sugerencias IA',
    descripcion: 'Recibe el marcador recomendado por inteligencia artificial para cada partido',
    free: false,
  },
  {
    icon: '✏️',
    titulo: 'Editar pronósticos',
    descripcion: 'Cambia tu predicción hasta 5 minutos antes del partido',
    free: false,
  },
  {
    icon: '⚡',
    titulo: 'Cierre extendido',
    descripcion: 'Registra tu pronóstico hasta 5 min antes. Los FREE cierran 15 min antes',
    free: false,
  },
  {
    icon: '🔄',
    titulo: 'Auto-completado',
    descripcion: 'Si no registras a tiempo, la IA completa tu pronóstico automáticamente',
    free: false,
  },
  {
    icon: '📊',
    titulo: 'Ranking y pronósticos',
    descripcion: 'Compite en grupos y registra tus predicciones',
    free: true,
  },
  {
    icon: '⭐',
    titulo: 'Badge PRO exclusivo',
    descripcion: 'Destaca en el ranking con tu insignia PRO visible para todos',
    free: false,
  },
];

const COMPARACION = [
  { feature: 'Registrar pronósticos',     free: '✓',        pro: '✓' },
  { feature: 'Cierre de pronósticos',     free: '15 min',   pro: '5 min' },
  { feature: 'Editar pronóstico',         free: '—',        pro: '✓' },
  { feature: 'Sugerencias IA',            free: '—',        pro: '✓' },
  { feature: 'Auto-completado IA',        free: '—',        pro: '✓' },
  { feature: 'Badge PRO en ranking',      free: '—',        pro: '✓' },
  { feature: 'Participar en grupos',      free: '✓',        pro: '✓' },
];

export default function ProPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated, hydrate } = useAuthStore();
  const [loadingPago, setLoadingPago] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.es_pro) { router.push('/dashboard'); return; }
  }, [hydrated, isAuthenticated, router, user]);

  const iniciarPago = async () => {
    setLoadingPago(true);
    setError('');
    try {
      const res = await api.post('/pro/checkout');
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setError('No se pudo iniciar el pago. Intenta nuevamente.');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al conectar con el servidor de pagos.'));
    } finally {
      setLoadingPago(false);
    }
  };

  const card: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
  };

  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', paddingBottom: 96, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>
          ← Volver
        </button>
        <div style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.3rem', fontWeight: 800 }}>
          Win<span style={{ color: 'var(--gold)' }}>★</span>Predict
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⭐</div>
        <h1 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
          Hazte <span style={{ color: 'var(--gold)' }}>PRO</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Lleva tus pronósticos al siguiente nivel con IA y ventajas exclusivas
        </p>
      </div>

      {/* Card de precio */}
      <div style={{
        background: 'rgba(245,200,66,0.06)',
        border: '1px solid rgba(245,200,66,0.35)',
        borderRadius: 'var(--radius)', padding: '28px 24px',
        textAlign: 'center', marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          Un solo pago · Válido durante todo el torneo
        </div>
        <div style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '2.8rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 2 }}>
          $3.50
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 24 }}>
          USD · sin renovaciones
        </div>

        <button onClick={iniciarPago} disabled={loadingPago}
          style={{
            width: '100%', padding: '14px',
            background: loadingPago ? 'rgba(245,200,66,0.4)' : 'var(--gold)',
            color: '#1A0A3C', border: 'none', borderRadius: 12,
            fontWeight: 800, fontSize: '1rem',
            cursor: loadingPago ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', marginBottom: 12,
          }}>
          {loadingPago ? 'Redirigiendo...' : '🔒 Pagar con Mercado Pago'}
        </button>

        {error && (
          <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: '0.83rem', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Acepta PSE · Nequi · Daviplata · Tarjetas
        </div>
      </div>

      {/* Beneficios */}
      <h2 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
        Qué incluye PRO
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {BENEFICIOS.map(b => (
          <div key={b.titulo} style={{
            ...card, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
            opacity: b.free ? 0.6 : 1,
          }}>
            <div style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 2 }}>{b.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{b.titulo}</span>
                {!b.free && (
                  <span style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)', color: 'var(--gold)', fontSize: '0.62rem', fontWeight: 700, padding: '1px 7px', borderRadius: 100 }}>
                    PRO
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>{b.descripcion}</div>
            </div>
            <div style={{ fontSize: '1rem', flexShrink: 0 }}>
              {b.free ? '✓' : '⭐'}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla comparación */}
      <h2 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
        Free vs PRO
      </h2>

      <div style={{ ...card, marginBottom: 24, padding: '0', overflow: 'hidden' }}>
        {/* Cabecera */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--card-border)' }}>
          {['', 'Gratis', 'PRO ⭐'].map((col, i) => (
            <div key={i} style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.75rem', color: i === 2 ? 'var(--gold)' : 'var(--text-muted)', textAlign: i === 0 ? 'left' : 'center' }}>
              {col}
            </div>
          ))}
        </div>

        {/* Filas */}
        {COMPARACION.map((row, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', borderBottom: idx < COMPARACION.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
            <div style={{ padding: '11px 14px', fontSize: '0.82rem', color: 'var(--white)' }}>{row.feature}</div>
            <div style={{ padding: '11px 14px', fontSize: '0.82rem', textAlign: 'center', color: row.free === '—' ? 'var(--text-muted)' : 'var(--white)', fontWeight: row.free === '✓' ? 600 : 400 }}>
              {row.free}
            </div>
            <div style={{ padding: '11px 14px', fontSize: '0.82rem', textAlign: 'center', color: row.pro === '—' ? 'var(--text-muted)' : row.pro === '✓' ? '#4caf50' : 'var(--gold)', fontWeight: 700 }}>
              {row.pro}
            </div>
          </div>
        ))}
      </div>

      {/* CTA final */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <button onClick={iniciarPago} disabled={loadingPago}
          style={{
            width: '100%', padding: '14px 40px',
            background: loadingPago ? 'rgba(245,200,66,0.4)' : 'var(--gold)',
            color: '#1A0A3C', border: 'none', borderRadius: 12,
            fontWeight: 800, fontSize: '1rem',
            cursor: loadingPago ? 'not-allowed' : 'pointer',
          }}>
          {loadingPago ? 'Procesando...' : '⭐ Activar PRO por $3.50 USD'}
        </button>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
          Tu cuenta queda activa inmediatamente tras el pago
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

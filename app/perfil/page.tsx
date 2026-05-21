// app/perfil/page.tsx
// Perfil del usuario — con BottomNav integrado
// crafted by JR ♥

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';
import BottomNav from '@/components/layout/BottomNav';

interface EstadisticasGlobales {
  total_pronosticos: number;
  pronosticos_exactos: number;
  pronosticos_correctos: number;
  total_puntos: number;
  grupos_activos: number;
  mejor_posicion: number | null;
}

interface GrupoRaw {
  mis_puntos: number | null;
  mi_posicion: number | null;
  estado: string;
}

function inicialesAvatar(nombre: string) {
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PerfilPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated, hydrate, logout } = useAuthStore();
  const [stats, setStats] = useState<EstadisticasGlobales | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStats, setErrorStats] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    cargarStats();
  }, [hydrated, isAuthenticated, router]);

  const cargarStats = async () => {
    try {
      const [gruposRes, pronosRes] = await Promise.all([
        api.get('/grupos/mis-grupos'),
        api.get('/pronosticos/mis-pronosticos-global').catch(() => null),
      ]);

      const grupos: GrupoRaw[] = gruposRes.data;
      const totalPuntos = grupos.reduce((s: number, g: GrupoRaw) => s + (g.mis_puntos ?? 0), 0);
      const posiciones = grupos
        .map((g: GrupoRaw) => g.mi_posicion)
        .filter((p: number | null): p is number => typeof p === 'number' && p > 0);
      const mejorPos = posiciones.length > 0 ? Math.min(...posiciones) : null;
      const gruposActivos = grupos.filter((g: GrupoRaw) => g.estado === 'activo').length;
      const pronos = pronosRes?.data ?? {};

      setStats({
        total_pronosticos: pronos.total ?? 0,
        pronosticos_exactos: pronos.exactos ?? 0,
        pronosticos_correctos: pronos.correctos ?? 0,
        total_puntos: totalPuntos,
        grupos_activos: gruposActivos,
        mejor_posicion: mejorPos,
      });
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setErrorStats(true);
    } finally {
      setLoading(false);
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

  const precisionExacta = stats && stats.total_pronosticos > 0
    ? Math.round((stats.pronosticos_exactos / stats.total_pronosticos) * 100)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', paddingBottom: 96, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'var(--font-display, Syne, sans-serif)',
          fontSize: '1.5rem', fontWeight: 800, marginBottom: 4,
        }}>
          Win<span style={{ color: 'var(--gold)' }}>★</span>Predict
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display, Syne, sans-serif)',
          fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)',
        }}>
          Mi perfil
        </h1>
      </div>

      {/* Card principal del perfil */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>

          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple-mid), var(--purple-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 800, color: 'var(--white)',
            flexShrink: 0, border: '2px solid var(--card-border)',
          }}>
            {inicialesAvatar(user.nombre)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{
                fontFamily: 'var(--font-display, Syne, sans-serif)',
                fontSize: '1.2rem', fontWeight: 800,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.nombre}
              </h2>
              {user.es_pro && (
                <span style={{
                  background: 'rgba(245,200,66,0.15)',
                  border: '1px solid rgba(245,200,66,0.4)',
                  color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 700,
                  padding: '3px 8px', borderRadius: 100, flexShrink: 0,
                }}>⭐ PRO</span>
              )}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: 'var(--card-border)', marginBottom: 16 }} />

        {/* Plan + CTA */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: user.es_pro ? 'rgba(245,200,66,0.08)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${user.es_pro ? 'rgba(245,200,66,0.3)' : 'var(--card-border)'}`,
            borderRadius: 10, padding: '10px 16px',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Plan actual</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: user.es_pro ? 'var(--gold)' : 'var(--white)' }}>
              {user.es_pro ? '⭐ PRO' : '🆓 Gratuito'}
            </div>
          </div>

          {!user.es_pro && (
            <button
              onClick={() => router.push('/pro')}
              style={{
                background: 'var(--gold)', color: '#1A0A3C',
                border: 'none', borderRadius: 10,
                padding: '10px 20px', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer',
                flex: 1, minWidth: 120,
              }}
            >
              ⭐ Hazte PRO
            </button>
          )}
        </div>
      </div>

      {/* Stats globales */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{
          fontFamily: 'var(--font-display, Syne, sans-serif)',
          fontSize: '0.9rem', fontWeight: 700, marginBottom: 12,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Estadísticas globales
        </h3>

        {loading ? (
          <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
            Cargando estadísticas...
          </div>
        ) : errorStats ? (
          <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
            No se pudieron cargar las estadísticas
          </div>
        ) : stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Puntos', value: stats.total_puntos.toString(), icon: '⚡', color: 'var(--gold)' },
              { label: 'Mejor pos.', value: stats.mejor_posicion ? `#${stats.mejor_posicion}` : '--', icon: '🏆', color: 'var(--white)' },
              { label: 'Grupos', value: stats.grupos_activos.toString(), icon: '👥', color: 'var(--white)' },
              { label: 'Pronósticos', value: stats.total_pronosticos.toString(), icon: '✏️', color: 'var(--white)' },
              { label: 'Exactos', value: stats.pronosticos_exactos.toString(), icon: '🎯', color: '#4caf50' },
              { label: 'Precisión', value: `${precisionExacta}%`, icon: '📈', color: precisionExacta >= 30 ? 'var(--gold)' : 'var(--white)' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 12, padding: '14px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{stat.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-display, Syne, sans-serif)',
                  fontSize: '1.4rem', fontWeight: 800, color: stat.color,
                }}>
                  {stat.value}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: 3 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Barra de rendimiento */}
      {stats && stats.total_pronosticos > 0 && (
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{
            fontFamily: 'var(--font-display, Syne, sans-serif)',
            fontSize: '0.9rem', fontWeight: 700, marginBottom: 14,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Rendimiento
          </h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Precisión exacta</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)' }}>{precisionExacta}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: precisionExacta >= 30 ? 'var(--gold)' : 'var(--purple-light)',
                width: `${precisionExacta}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>🎯 {stats.pronosticos_exactos} exactos</span>
            <span>✓ {stats.pronosticos_correctos} correctos</span>
            <span>✏️ {stats.total_pronosticos} total</span>
          </div>
        </div>
      )}

      {/* Seguridad de la cuenta */}
      <button
        type="button"
        onClick={() => router.push('/perfil/cambiar-contrasena')}
        style={{
          width: '100%',
          background: 'rgba(193, 164, 97, 0.08)',
          border: '1px solid rgba(193, 164, 97, 0.35)',
          color: 'var(--gold)',
          borderRadius: 12,
          padding: '14px',
          fontWeight: 700,
          fontSize: '0.88rem',
          cursor: 'pointer',
          marginBottom: 12,
          transition: 'all 0.15s',
        }}
      >
        Cambiar contraseña
      </button>

      {/* Cerrar sesión */}
      <button
        onClick={() => { logout(); router.push('/login'); }}
        style={{
          width: '100%', background: 'transparent',
          border: '1px solid var(--card-border)',
          color: 'var(--text-muted)', borderRadius: 12,
          padding: '14px', fontWeight: 700, fontSize: '0.88rem',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff4444'; e.currentTarget.style.color = '#ff6666'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        Cerrar sesión
      </button>

      <BottomNav />
    </div>
  );
}

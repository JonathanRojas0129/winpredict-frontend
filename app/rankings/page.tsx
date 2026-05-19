// app/rankings/page.tsx
// Tabla de posiciones — con BottomNav integrado
// crafted by JR ♥

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';
import BottomNav from '@/components/layout/BottomNav';

interface EntradaRanking {
  posicion: number;
  user_id: string;
  nombre: string;
  avatar_url: string | null;
  es_pro: boolean;
  total_puntos: number;
  es_yo: boolean;
}

interface GrupoResumen {
  id: string;
  nombre: string;
  estado: string;
}

function inicialesAvatar(nombre: string) {
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function RankingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated, hydrate } = useAuthStore();

  const [grupos, setGrupos] = useState<GrupoResumen[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('');
  const [ranking, setRanking] = useState<EntradaRanking[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    cargarGrupos();

  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!grupoSeleccionado) return;
    cargarRanking(grupoSeleccionado);
  }, [grupoSeleccionado]);

  const cargarGrupos = async () => {
    try {
      const res = await api.get('/grupos/mis-grupos');
      const data: GrupoResumen[] = res.data;
      setGrupos(data);
      const primerActivo = data.find(g => g.estado === 'activo') ?? data[0];
      if (primerActivo) setGrupoSeleccionado(primerActivo.id);
    } catch (err) {
      console.error('Error cargando grupos:', err);
    } finally {
      setLoadingGrupos(false);
    }
  };

  const cargarRanking = async (grupoId: string) => {
    setLoadingRanking(true);
    try {
      const res = await api.get(`/ranking/${grupoId}`);
      setRanking(res.data);
    } catch (err) {
      console.error('Error cargando ranking:', err);
      setRanking([]);
    } finally {
      setLoadingRanking(false);
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

  const grupoActual = grupos.find(g => g.id === grupoSeleccionado);
  const miPosicion = ranking.find(r => r.es_yo);

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
          📊 Rankings
        </h1>
      </div>

      {loadingGrupos ? (
        <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
          Cargando grupos...
        </div>
      ) : grupos.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Sin grupos todavía</p>
          <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>Crea o únete a un grupo para ver rankings</p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'var(--gold)', color: '#1A0A3C',
              border: 'none', borderRadius: 10, padding: '10px 24px',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Ir al dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Tabs de grupos */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 20,
            overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none',
          }}>
            {grupos.map(g => (
              <button
                key={g.id}
                onClick={() => setGrupoSeleccionado(g.id)}
                style={{
                  padding: '8px 18px', borderRadius: 10, fontWeight: 700,
                  fontSize: '0.83rem', cursor: 'pointer', border: 'none',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  background: grupoSeleccionado === g.id ? 'var(--purple-mid)' : 'var(--card-bg)',
                  color: grupoSeleccionado === g.id ? 'var(--white)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {g.nombre}
              </button>
            ))}
          </div>

          {/* Mi posición destacada */}
          {miPosicion && !loadingRanking && (
            <div style={{
              background: 'rgba(124,79,224,0.12)',
              border: '1px solid rgba(124,79,224,0.35)',
              borderRadius: 'var(--radius)', padding: '16px 20px',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                fontFamily: 'var(--font-display, Syne, sans-serif)',
                fontSize: '2rem', fontWeight: 800,
                color: miPosicion.posicion <= 3 ? 'var(--gold)' : 'var(--purple-light)',
                minWidth: 40, textAlign: 'center',
              }}>
                {miPosicion.posicion === 1 ? '🥇'
                  : miPosicion.posicion === 2 ? '🥈'
                  : miPosicion.posicion === 3 ? '🥉'
                  : `#${miPosicion.posicion}`}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2, fontSize: '0.9rem' }}>
                  Tu posición en {grupoActual?.nombre}
                </div>
                <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.05rem' }}>
                  ⚡ {miPosicion.total_puntos} pts
                </div>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1rem', fontWeight: 700 }}>
                Tabla de posiciones
              </h2>
              {grupoActual && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {grupoActual.nombre}
                </span>
              )}
            </div>

            {loadingRanking ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Cargando...
              </div>
            ) : ranking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Aún no hay puntos</p>
                <p style={{ fontSize: '0.82rem' }}>Los puntos se asignan cuando los partidos finalizan</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Cabecera */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '40px 36px 1fr auto',
                  gap: 10, padding: '0 12px',
                  fontSize: '0.7rem', color: 'var(--text-muted)',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  <span style={{ textAlign: 'center' }}>#</span>
                  <span />
                  <span>Jugador</span>
                  <span>Pts</span>
                </div>

                {ranking.map((entrada) => (
                  <div
                    key={entrada.user_id}
                    style={{
                      display: 'grid', gridTemplateColumns: '40px 36px 1fr auto',
                      gap: 10, alignItems: 'center',
                      padding: '12px', borderRadius: 10,
                      background: entrada.es_yo
                        ? 'rgba(124,79,224,0.15)'
                        : entrada.posicion <= 3
                        ? 'rgba(245,200,66,0.05)'
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${
                        entrada.es_yo
                          ? 'rgba(124,79,224,0.4)'
                          : entrada.posicion <= 3
                          ? 'rgba(245,200,66,0.15)'
                          : 'var(--card-border)'
                      }`,
                    }}
                  >
                    {/* Posición */}
                    <div style={{
                      fontFamily: 'var(--font-display, Syne, sans-serif)',
                      fontWeight: 800, fontSize: '1rem', textAlign: 'center',
                      color: entrada.posicion <= 3 ? 'var(--gold)' : 'var(--text-muted)',
                    }}>
                      {entrada.posicion === 1 ? '🥇'
                        : entrada.posicion === 2 ? '🥈'
                        : entrada.posicion === 3 ? '🥉'
                        : `#${entrada.posicion}`}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: entrada.es_yo
                        ? 'linear-gradient(135deg, var(--purple-mid), var(--purple-light))'
                        : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700, color: 'var(--white)',
                      flexShrink: 0,
                    }}>
                      {inicialesAvatar(entrada.nombre)}
                    </div>

                    {/* Nombre */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{entrada.nombre}</span>
                        {entrada.es_yo && (
                          <span style={{ color: 'var(--purple-light)', fontSize: '0.72rem' }}>· Tú</span>
                        )}
                      </div>
                      {entrada.es_pro && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--gold)' }}>⭐ PRO</div>
                      )}
                    </div>

                    {/* Puntos */}
                    <div style={{
                      fontFamily: 'var(--font-display, Syne, sans-serif)',
                      fontSize: '1.05rem', fontWeight: 800,
                      color: entrada.posicion === 1 ? 'var(--gold)' : 'var(--white)',
                      textAlign: 'right',
                    }}>
                      {entrada.total_puntos}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}

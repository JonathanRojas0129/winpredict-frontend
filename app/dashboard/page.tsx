// app/dashboard/page.tsx
// Dashboard principal de WinPredict — rediseño mobile-first
// crafted by JR ♥

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';
import ModalCrearGrupo from '@/components/ui/ModalCrearGrupo';
import ModalUnirseGrupo from '@/components/ui/ModalUnirseGrupo';
import BottomNav from '@/components/layout/BottomNav';

interface GrupoResumen {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo_invitacion: string;
  premio_valor?: number | null;
  premio_moneda?: string | null;
  total_participantes: number;
  max_participantes: number;
  mi_rol: 'admin' | 'player';
  mis_puntos: number;
  mi_posicion?: number | null;
  estado: string;
}

interface ParticipanteResumen {
  posicion: number;
  nombre: string;
  total_puntos: number;
  es_yo: boolean;
}

function inicialesAvatar(nombre: string) {
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated, hydrate } = useAuthStore();
  const [grupos, setGrupos] = useState<GrupoResumen[]>([]);
  const [rankingsPorGrupo, setRankingsPorGrupo] = useState<Record<string, ParticipanteResumen[]>>({});
  const [modalCrear, setModalCrear] = useState(false);
  const [modalUnirse, setModalUnirse] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    cargarGrupos();
  
  }, [hydrated, isAuthenticated, router]);

  const cargarGrupos = async () => {
    try {
      const res = await api.get('/grupos/mis-grupos');
      const data: GrupoResumen[] = res.data;
      setGrupos(data);
      // Cargar top 3 ranking de cada grupo
      const rankings: Record<string, ParticipanteResumen[]> = {};
      await Promise.all(
        data.map(async (g) => {
          try {
            const r = await api.get(`/ranking/${g.id}`);
            rankings[g.id] = r.data.slice(0, 3);
          } catch {
            rankings[g.id] = [];
          }
        })
      );
      setRankingsPorGrupo(rankings);
    } catch (err) {
      console.error('Error cargando grupos:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPuntos = grupos.reduce((sum, g) => sum + (g.mis_puntos ?? 0), 0);
  const posicionesValidas = grupos
    .map(g => g.mi_posicion)
    .filter((p): p is number => typeof p === 'number' && p > 0);
  const mejorPosicion = posicionesValidas.length > 0 ? Math.min(...posicionesValidas) : null;
  const totalAciertos = grupos.reduce((sum, g) => sum + (g.mis_puntos > 0 ? 1 : 0), 0);

  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0520' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0520',
      maxWidth: 480, margin: '0 auto',
      position: 'relative', paddingBottom: 80,
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 20px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display, Syne, sans-serif)',
            fontSize: '1.3rem', fontWeight: 800, color: '#fff',
          }}>
            Win<span style={{ color: '#F5C842' }}>★</span>Predict
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Hola, {user.nombre}
          </div>
        </div>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => router.push('/perfil')}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C4FE0, #9B6FFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 800, color: '#fff',
              cursor: 'pointer', border: '2px solid rgba(124,79,224,0.5)',
            }}
          >
            {inicialesAvatar(user.nombre)}
          </div>
          {user.es_pro && (
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              background: '#F5C842', borderRadius: 100,
              fontSize: '0.55rem', fontWeight: 800,
              padding: '2px 5px', color: '#1A0A3C',
              border: '1px solid #0D0520',
            }}>PRO</div>
          )}
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Puntos', value: totalPuntos, icon: '⚡' },
          { label: 'Posición', value: mejorPosicion ? `${mejorPosicion}º` : '--', icon: '🏆' },
          { label: 'Aciertos', value: totalAciertos, icon: '🎯' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{stat.icon}</div>
            <div style={{
              fontFamily: 'var(--font-display, Syne, sans-serif)',
              fontSize: '1.4rem', fontWeight: 800, color: '#F5C842',
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Card PRO (solo usuarios free) ──────────────────────── */}
      {!user.es_pro && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3D1F8C 0%, #5B2FBE 100%)',
            border: '1px solid rgba(124,79,224,0.5)',
            borderRadius: 18, padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: '#F5C842', color: '#1A0A3C',
                fontSize: '0.7rem', fontWeight: 800,
                padding: '3px 8px', borderRadius: 100,
              }}>PRO · $3.5 USD</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-display, Syne, sans-serif)',
              fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 6,
            }}>
              Gana con inteligencia artificial
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 14, lineHeight: 1.5 }}>
              Un solo pago. Válido durante toda la polla. Sin renovaciones.
            </div>
            {['Marcadores sugeridos por IA', 'Auto-completado si no registras a tiempo', 'Probabilidades en tiempo real'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#F5C842', fontSize: '0.75rem' }}>★</span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>{b}</span>
              </div>
            ))}
            <button
              onClick={() => router.push('/pro')}
              style={{
                marginTop: 16, width: '100%',
                background: '#F5C842', color: '#1A0A3C',
                border: 'none', borderRadius: 12,
                padding: '12px', fontWeight: 800,
                fontSize: '0.95rem', cursor: 'pointer',
              }}
            >
              Activar PRO
            </button>
          </div>
        </div>
      )}

      {/* ── Badge PRO activo ────────────────────────────────────── */}
      {user.es_pro && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            background: 'rgba(245,200,66,0.08)',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(245,200,66,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}>⭐</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F5C842' }}>
                WinPredict PRO · Activo
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                Tienes acceso a todas las funciones PRO
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mis Grupos ─────────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{
            fontFamily: 'var(--font-display, Syne, sans-serif)',
            fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Mis Grupos
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setModalUnirse(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(124,79,224,0.5)',
                color: '#9B6FFF', borderRadius: 10,
                padding: '6px 14px', fontWeight: 700,
                fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              🔑 Unirse
            </button>
            <button
              onClick={() => setModalCrear(true)}
              style={{
                background: '#F5C842', color: '#1A0A3C',
                border: 'none', borderRadius: 10,
                padding: '6px 14px', fontWeight: 800,
                fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              + Crear
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
            Cargando grupos...
          </div>
        ) : grupos.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: '40px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16, fontSize: '0.9rem' }}>
              Aún no perteneces a ningún grupo
            </p>
            <button onClick={() => setModalCrear(true)} style={{
              background: '#F5C842', color: '#1A0A3C',
              border: 'none', borderRadius: 12,
              padding: '10px 24px', fontWeight: 800,
              fontSize: '0.9rem', cursor: 'pointer',
            }}>
              + Crear mi primer grupo
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grupos.map(grupo => {
              const topRanking = rankingsPorGrupo[grupo.id] ?? [];
              return (
                <div
                  key={grupo.id}
                  onClick={() => router.push(`/grupo/${grupo.id}`)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 18, padding: '18px',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,79,224,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                >
                  {/* Cabecera del grupo */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{grupo.nombre}</span>
                        {grupo.mi_rol === 'admin' && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            background: 'rgba(124,79,224,0.25)', color: '#9B6FFF',
                            border: '1px solid rgba(124,79,224,0.3)',
                            borderRadius: 6, padding: '2px 7px',
                          }}>Admin</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                        {grupo.total_participantes}/{grupo.max_participantes} participantes
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700,
                        background: grupo.estado === 'activo' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.08)',
                        color: grupo.estado === 'activo' ? '#4caf50' : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${grupo.estado === 'activo' ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 100, padding: '3px 10px',
                      }}>
                        {grupo.estado === 'activo' ? 'Activo' : 'Pendiente'}
                      </span>
                      {grupo.premio_valor && (
                        <div style={{ fontSize: '0.75rem', color: '#F5C842', marginTop: 6, fontWeight: 700 }}>
                          ★ {grupo.premio_moneda} {grupo.premio_valor.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mini ranking */}
                  {topRanking.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topRanking.map((p, i) => (
                        <div key={p.nombre} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 700,
                            color: i === 0 ? '#F5C842' : 'rgba(255,255,255,0.35)',
                            width: 16, textAlign: 'center',
                          }}>
                            {i + 1}.
                          </span>
                          <span style={{
                            fontSize: '0.82rem', fontWeight: p.es_yo ? 700 : 400,
                            color: p.es_yo ? '#9B6FFF' : 'rgba(255,255,255,0.7)',
                            flex: 1,
                          }}>
                            {p.nombre.split(' ')[0]} {p.es_yo ? '· tú' : ''}
                          </span>
                          {/* Barra de puntos */}
                          <div style={{
                            flex: 2, height: 4, borderRadius: 100,
                            background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', borderRadius: 100,
                              background: p.es_yo ? '#7C4FE0' : 'rgba(255,255,255,0.2)',
                              width: `${Math.min((p.total_puntos / (topRanking[0]?.total_puntos || 1)) * 100, 100)}%`,
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', width: 28, textAlign: 'right' }}>
                            {p.total_puntos}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'rgba(124,79,224,0.8)', textAlign: 'right' }}>
                    Ver grupo →
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Modales */}
      {modalCrear && (
        <ModalCrearGrupo onClose={() => setModalCrear(false)} onCreado={cargarGrupos} />
      )}
      {modalUnirse && (
        <ModalUnirseGrupo onClose={() => setModalUnirse(false)} onUnido={cargarGrupos} />
      )}
    </div>
  );
}

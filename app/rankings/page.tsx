// app/rankings/page.tsx
// Tabla de posiciones — con detalle expandible por fase y desglose
// crafted by JR ♥

'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface PartidoDetalle {
  partido_id: string;
  equipo_local: string;
  equipo_visitante: string;
  goles_local_real: number | null;
  goles_visitante_real: number | null;
  goles_local_pred: number | null;
  goles_visitante_pred: number | null;
  puntos_obtenidos: number | null;
  fue_autocompletado: boolean | null;
  fase?: string;
  fecha_hora?: string;
  desglose?: Record<string, number>;
}

interface JugadorDetalle {
  user_id: string;
  partidos_jugados: number;
  partidos: PartidoDetalle[];
}

const FASES_ORDEN = ['final', 'tercer_puesto', 'semifinal', 'cuartos', 'octavos', 'dieciseisavos', 'grupos'];

const FASES_LABEL: Record<string, string> = {
  grupos:        'Fase de grupos',
  dieciseisavos: 'Dieciseisavos',
  octavos:       'Octavos de final',
  cuartos:       'Cuartos de final',
  semifinal:     'Semifinales',
  tercer_puesto: 'Tercer puesto',
  final:         'Final',
};

const ICONOS_DESGLOSE: Record<string, string> = {
  marcador_exacto: '🎯',
  ganador_acertado: '✅',
  empate_acertado: '🤝',
  goles_acertados: '⚽',
  prediccion_unica: '💎',
};

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

  // Detalle expandible
  const [detalles, setDetalles]             = useState<Record<string, JugadorDetalle>>({});
  const [expandidoUser, setExpandidoUser]   = useState<string | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [expandidosFase, setExpandidosFase] = useState<Record<string, boolean>>({});

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    cargarGrupos();
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!grupoSeleccionado) return;
    cargarRanking(grupoSeleccionado);
    setDetalles({});
    setExpandidoUser(null);
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

  // Carga (una sola vez por grupo) el detalle completo de resultados
  const cargarDetalleSiFalta = useCallback(async () => {
    if (Object.keys(detalles).length > 0 || !grupoSeleccionado) return;
    setCargandoDetalle(true);
    try {
      const res = await api.get(`/pronosticos/resultados-grupo/${grupoSeleccionado}`);
      const map: Record<string, JugadorDetalle> = {};
      for (const j of res.data) {
        map[j.user_id] = { user_id: j.user_id, partidos_jugados: j.partidos_jugados, partidos: j.partidos };
      }
      setDetalles(map);
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setCargandoDetalle(false);
    }
  }, [detalles, grupoSeleccionado]);

  const toggleJugador = (userId: string) => {
    if (expandidoUser === userId) {
      setExpandidoUser(null);
      return;
    }
    setExpandidoUser(userId);
    cargarDetalleSiFalta();
  };

  const toggleFase = (key: string) => {
    setExpandidosFase(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const agruparPorFase = (partidos: PartidoDetalle[]) => {
    const grupos: Record<string, PartidoDetalle[]> = {};
    for (const p of partidos) {
      const fase = p.fase ?? 'grupos';
      if (!grupos[fase]) grupos[fase] = [];
      grupos[fase].push(p);
    }
    for (const fase in grupos) {
      grupos[fase].sort((a, b) => {
        const fa = a.fecha_hora ? new Date(a.fecha_hora).getTime() : 0;
        const fb = b.fecha_hora ? new Date(b.fecha_hora).getTime() : 0;
        return fb - fa;
      });
    }
    return grupos;
  };

  const puntosFase = (partidos: PartidoDetalle[]) =>
    partidos.reduce((sum, p) => sum + (p.puntos_obtenidos ?? 0), 0);

  const desgloseFase = (partidos: PartidoDetalle[]) => {
    const totales: Record<string, number> = {
      marcador_exacto: 0, ganador_acertado: 0, empate_acertado: 0,
      goles_acertados: 0, prediccion_unica: 0,
    };
    for (const p of partidos) {
      const d = p.desglose ?? {};
      for (const key of Object.keys(totales)) totales[key] += d[key] ?? 0;
    }
    return totales;
  };

  const renderPtsBadge = (pts: number | null) => {
    if (pts === null) return null;
    if (pts > 0) return (
      <span style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.3)', color: 'var(--gold)', borderRadius: 8, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700 }}>+{pts} pts</span>
    );
    return (
      <span style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.2)', color: '#FF5252', borderRadius: 8, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700 }}>0 pts</span>
    );
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

                {ranking.map((entrada) => {
                  const expandido = expandidoUser === entrada.user_id;
                  const detalle   = detalles[entrada.user_id];
                  const porFase   = detalle ? agruparPorFase(detalle.partidos) : {};

                  return (
                    <div key={entrada.user_id} style={{ borderRadius: 10, overflow: 'hidden' }}>
                      {/* Fila clickeable */}
                      <div
                        onClick={() => toggleJugador(entrada.user_id)}
                        style={{
                          display: 'grid', gridTemplateColumns: '40px 36px 1fr auto',
                          gap: 10, alignItems: 'center', cursor: 'pointer',
                          padding: '12px', borderRadius: expandido ? '10px 10px 0 0' : 10,
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
                          borderBottom: expandido ? 'none' : undefined,
                        }}
                      >
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            fontFamily: 'var(--font-display, Syne, sans-serif)',
                            fontSize: '1.05rem', fontWeight: 800,
                            color: entrada.posicion === 1 ? 'var(--gold)' : 'var(--white)',
                            textAlign: 'right',
                          }}>
                            {entrada.total_puntos}
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>pts</span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                        </div>
                      </div>

                      {/* Detalle expandido */}
                      {expandido && (
                        <div style={{
                          border: `1px solid ${entrada.es_yo ? 'rgba(124,79,224,0.4)' : 'var(--card-border)'}`,
                          borderTop: 'none', borderRadius: '0 0 10px 10px',
                          background: 'rgba(0,0,0,0.15)',
                        }}>
                          {cargandoDetalle && !detalle ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              Cargando detalle...
                            </div>
                          ) : !detalle ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              Sin datos disponibles
                            </div>
                          ) : (
                            FASES_ORDEN.filter(fase => porFase[fase]?.length > 0).map(fase => {
                              const partidosFase  = porFase[fase];
                              const keyFase       = `${entrada.user_id}-${fase}`;
                              const expandidoFase = expandidosFase[keyFase] ?? false;
                              const ptsFase        = puntosFase(partidosFase);
                              const jugadosFase    = partidosFase.filter(p => p.goles_local_pred !== null).length;
                              const desglose       = desgloseFase(partidosFase);
                              const hayDesglose    = Object.values(desglose).some(v => v > 0);

                              return (
                                <div key={fase} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div onClick={() => toggleFase(keyFase)} style={{ padding: '9px 14px', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hayDesglose ? 6 : 0 }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {FASES_LABEL[fase] ?? fase}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                          {jugadosFase} partidos · {ptsFase > 0 ? `+${ptsFase}` : ptsFase} pts
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', transform: expandidoFase ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                                      </div>
                                    </div>
                                    {hayDesglose && (
                                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                        {Object.entries(desglose).filter(([, v]) => v > 0).map(([key, val]) => (
                                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '2px 6px' }}>
                                            <span style={{ fontSize: '0.62rem' }}>{ICONOS_DESGLOSE[key]}</span>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--gold)' }}>+{val}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {expandidoFase && (
                                    <div style={{ padding: '4px 14px 10px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 44px 64px', gap: 4, padding: '6px 0' }}>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Partido</span>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center' }}>Real</span>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center' }}>Pred.</span>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center' }}>Pts</span>
                                      </div>
                                      {partidosFase.map(partido => (
                                        <div key={partido.partido_id} style={{ display: 'grid', gridTemplateColumns: '1fr 44px 44px 64px', gap: 4, alignItems: 'center', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                          <div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--white)', fontWeight: 600, lineHeight: 1.3 }}>
                                              {partido.equipo_local.split(' ')[0]} vs {partido.equipo_visitante.split(' ')[0]}
                                            </div>
                                            {partido.fue_autocompletado && (
                                              <div style={{ fontSize: '0.6rem', color: 'var(--purple-light)', marginTop: 1 }}>🤖 IA</div>
                                            )}
                                          </div>
                                          <div style={{ textAlign: 'center', fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--gold)' }}>
                                            {partido.goles_local_real}-{partido.goles_visitante_real}
                                          </div>
                                          <div style={{ textAlign: 'center', fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '0.8rem', fontWeight: 700, color: partido.goles_local_pred !== null ? 'var(--white)' : 'var(--text-muted)' }}>
                                            {partido.goles_local_pred !== null ? `${partido.goles_local_pred}-${partido.goles_visitante_pred}` : '-'}
                                          </div>
                                          <div style={{ textAlign: 'center' }}>{renderPtsBadge(partido.puntos_obtenidos)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
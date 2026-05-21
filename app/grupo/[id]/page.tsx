// app/grupo/[id]/page.tsx
// Vista de grupo — ranking, partidos terminados, banner PRO
// crafted by JR ♥

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';
import BottomNav from '@/components/layout/BottomNav';
import { getApiErrorMessage } from '@/lib/errors';

// ─── Tipos ───────────────────────────────────────────────────────────────

interface Participante {
  posicion: number;
  user_id: string;
  nombre: string;
  avatar_url: string | null;
  es_pro: boolean;
  total_puntos: number;
  es_yo: boolean;
}

interface Partido {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  bandera_local: string | null;
  bandera_visitante: string | null;
  fecha_hora: string;
  fase: string;
  grupo: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
  estado: string;
  cierre_pronosticos: string;
}

interface Pronostico {
  id: string;
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
  puntos_obtenidos: number | null;
}

interface GrupoInfo {
  nombre: string;
  codigo_invitacion: string;
  premio_valor: number | null;
  premio_moneda: string | null;
  total_participantes: number;
  max_participantes: number;
  mi_rol: string;
  mis_puntos: number;
  mi_posicion: number | null;
}

interface SolicitudIngreso {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  solicitado_en: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short', day: 'numeric',
    month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function codigoABandera(codigo: string | null): string {
  if (!codigo) return '🏳️';
  return codigo.toUpperCase().split('')
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

function inicialesAvatar(nombre: string) {
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(valor: number, moneda: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: moneda, maximumFractionDigits: 0,
  }).format(valor);
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function GrupoPage() {
  const router  = useRouter();
  const params  = useParams();
  const grupoId = params.id as string;

  const { user, hydrated, hydrate } = useAuthStore();

  const [tab, setTab]                 = useState<'ranking' | 'partidos' | 'solicitudes'>('ranking');
  const [grupo, setGrupo]             = useState<GrupoInfo | null>(null);
  const [ranking, setRanking]         = useState<Participante[]>([]);
  const [partidos, setPartidos]       = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<Record<string, Pronostico>>({});
  const [solicitudes, setSolicitudes] = useState<SolicitudIngreso[]>([]);
  const [solicitudMsg, setSolicitudMsg] = useState('');
  const [accionSolicitudId, setAccionSolicitudId] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push('/login'); return; }
    cargarTodo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const cargarSolicitudes = async (esAdmin: boolean) => {
    if (!esAdmin) {
      setSolicitudes([]);
      return;
    }
    try {
      const res = await api.get(`/grupos/${grupoId}/solicitudes`);
      setSolicitudes(res.data.solicitudes ?? []);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
      setSolicitudes([]);
    }
  };

  const cargarTodo = async () => {
    try {
      const [misGruposRes, rankingRes, partidosRes, pronosticosRes] = await Promise.all([
        api.get('/grupos/mis-grupos'),
        api.get(`/ranking/${grupoId}`),
        api.get('/partidos/'),
        api.get(`/pronosticos/mis-pronosticos/${grupoId}`),
      ]);

      const infoGrupo = misGruposRes.data.find((g: { id: string }) => g.id === grupoId);
      if (!infoGrupo) { router.push('/dashboard'); return; }
      setGrupo(infoGrupo);
      setRanking(rankingRes.data);

      setPartidos(partidosRes.data.filter((p: Partido) => p.estado === 'finalizado'));

      const pronosMap: Record<string, Pronostico> = {};
      for (const p of pronosticosRes.data) {
        pronosMap[p.partido_id] = p;
      }
      setPronosticos(pronosMap);

      await cargarSolicitudes(infoGrupo.mi_rol === 'admin');
    } catch (err) {
      const msg = getApiErrorMessage(err, '');
      if (msg.includes('pendiente de aprobación') || msg.includes('fue rechazada')) {
        router.push('/dashboard');
        return;
      }
      console.error('Error cargando grupo:', err);
    } finally {
      setLoading(false);
    }
  };

  const aprobarSolicitud = async (participanteId: string) => {
    setAccionSolicitudId(participanteId);
    setSolicitudMsg('');
    try {
      const res = await api.patch(
        `/grupos/${grupoId}/solicitudes/${participanteId}/aprobar`,
      );
      setSolicitudMsg(res.data.message || 'Usuario aprobado');
      await cargarTodo();
      setTab('ranking');
    } catch (err) {
      setSolicitudMsg(getApiErrorMessage(err, 'No se pudo aprobar la solicitud'));
    } finally {
      setAccionSolicitudId(null);
    }
  };

  const rechazarSolicitud = async (participanteId: string) => {
    setAccionSolicitudId(participanteId);
    setSolicitudMsg('');
    try {
      const res = await api.patch(
        `/grupos/${grupoId}/solicitudes/${participanteId}/rechazar`,
      );
      setSolicitudMsg(res.data.message || 'Usuario rechazado');
      await cargarSolicitudes(true);
    } catch (err) {
      setSolicitudMsg(getApiErrorMessage(err, 'No se pudo rechazar la solicitud'));
    } finally {
      setAccionSolicitudId(null);
    }
  };

  function formatSolicitudFecha(iso: string) {
    return new Date(iso).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const card: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
  };

  if (!hydrated || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Cargando grupo...</span>
      </div>
    );
  }

  if (!grupo || !user) return null;

  const esAdmin    = grupo.mi_rol === 'admin';
  const bolsaTotal = grupo.premio_valor && grupo.total_participantes
    ? grupo.premio_valor * grupo.total_participantes
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', paddingBottom: 96, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>
          ← Volver
        </button>
        <div style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.3rem', fontWeight: 800 }}>
          Win<span style={{ color: 'var(--gold)' }}>★</span>Predict
        </div>
      </div>

      {/* Info del grupo */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.3rem', fontWeight: 800 }}>
                {grupo.nombre}
              </h1>
              {esAdmin && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(124,79,224,0.2)', color: 'var(--purple-light)', border: '1px solid rgba(124,79,224,0.3)', borderRadius: 6, padding: '2px 8px' }}>
                  Admin
                </span>
              )}
            </div>

            {bolsaTotal && grupo.premio_moneda ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--gold)', marginBottom: 2 }}>
                💰 Bolsa: <strong>{formatCurrency(bolsaTotal, grupo.premio_moneda)}</strong>
              </div>
            ) : grupo.premio_valor && grupo.premio_moneda ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                💰 Ingreso: <strong style={{ color: 'var(--gold)' }}>{formatCurrency(grupo.premio_valor, grupo.premio_moneda)}</strong> por persona
              </div>
            ) : null}

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {grupo.total_participantes}/{grupo.max_participantes} participantes
            </div>
          </div>

          {/* Código solo para admin */}
          {esAdmin && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Código de invitación</div>
              <div style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: 4 }}>
                {grupo.codigo_invitacion}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          {[
            { label: 'Mis puntos',   value: grupo.mis_puntos ?? 0,                               icon: '⚡' },
            { label: 'Mi posición',  value: grupo.mi_posicion ? `#${grupo.mi_posicion}` : '--',  icon: '🏆' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 16px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '1rem', marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner PRO — solo para usuarios no PRO */}
      {!user.es_pro && (
        <div
          onClick={() => router.push('/pro')}
          style={{
            background: 'linear-gradient(135deg, rgba(124,79,224,0.3), rgba(245,200,66,0.15))',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 'var(--radius)', padding: '16px 20px',
            marginBottom: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontWeight: 800, fontSize: '0.95rem', marginBottom: 4 }}>
              ⭐ Hazte PRO
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Sugerencias IA · Editar pronósticos · Cierre 5 min antes
            </div>
          </div>
          <div style={{ background: 'var(--gold)', color: '#1A0A3C', borderRadius: 10, padding: '8px 16px', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
            Ver planes
          </div>
        </div>
      )}

      {/* Aviso solicitudes pendientes (admin) */}
      {esAdmin && solicitudes.length > 0 && tab !== 'solicitudes' && (
        <button
          type="button"
          onClick={() => setTab('solicitudes')}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: '14px 18px',
            borderRadius: 12,
            border: '1px solid rgba(245,200,66,0.45)',
            background: 'rgba(245,200,66,0.1)',
            color: 'var(--gold)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          🔔 {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} de ingreso pendiente{solicitudes.length !== 1 ? 's' : ''} — toca para revisar
        </button>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['ranking', 'partidos', ...(esAdmin ? (['solicitudes'] as const) : [])] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSolicitudMsg(''); }}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              border: 'none',
              background: tab === t ? 'var(--purple-mid)' : 'var(--card-bg)',
              color: tab === t ? 'var(--white)' : 'var(--text-muted)',
              transition: 'all 0.2s',
              position: 'relative',
            }}>
            {t === 'ranking' && '📊 Ranking'}
            {t === 'partidos' && '✅ Resultados'}
            {t === 'solicitudes' && (
              <>
                👤 Solicitudes
                {solicitudes.length > 0 && (
                  <span style={{
                    marginLeft: 6,
                    background: '#F5C842',
                    color: '#1A0A3C',
                    borderRadius: 100,
                    padding: '1px 7px',
                    fontSize: '0.7rem',
                  }}>
                    {solicitudes.length}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {solicitudMsg && (
        <div style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(124,79,224,0.15)',
          border: '1px solid rgba(124,79,224,0.35)',
          fontSize: '0.85rem',
          color: 'var(--purple-light)',
        }}>
          {solicitudMsg}
        </div>
      )}

      {/* Tab Ranking */}
      {tab === 'ranking' && (
        <div style={card}>
          <h2 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
            Tabla de posiciones
          </h2>
          {ranking.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Aún no hay puntos registrados</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ranking.map(p => (
                <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: p.es_yo ? 'rgba(124,79,224,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.es_yo ? 'rgba(124,79,224,0.4)' : 'var(--card-border)'}` }}>
                  <div style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display, Syne, sans-serif)', fontWeight: 800, fontSize: '1rem', color: p.posicion <= 3 ? 'var(--gold)' : 'var(--text-muted)' }}>
                    {p.posicion === 1 ? '🥇' : p.posicion === 2 ? '🥈' : p.posicion === 3 ? '🥉' : `#${p.posicion}`}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.es_yo ? 'linear-gradient(135deg, var(--purple-mid), var(--purple-light))' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--white)', flexShrink: 0 }}>
                    {inicialesAvatar(p.nombre)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      {p.nombre}
                      {p.es_yo && <span style={{ color: 'var(--purple-light)', fontSize: '0.72rem', marginLeft: 6 }}>· Tú</span>}
                    </div>
                    {p.es_pro && <div style={{ fontSize: '0.68rem', color: 'var(--gold)' }}>⭐ PRO</div>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)' }}>
                    {p.total_puntos}<span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Solicitudes — solo admin */}
      {tab === 'solicitudes' && esAdmin && (
        <div style={card}>
          <h2 style={{
            fontFamily: 'var(--font-display, Syne, sans-serif)',
            fontSize: '1rem',
            fontWeight: 700,
            marginBottom: 8,
          }}>
            Solicitudes de ingreso
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
            Aprueba o rechaza a quienes pidieron unirse con tu código de invitación.
          </p>
          {solicitudes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No hay solicitudes pendientes
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {solicitudes.map(s => {
                const procesando = accionSolicitudId === s.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(124,79,224,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}>
                        {inicialesAvatar(s.nombre)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{s.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Solicitó: {formatSolicitudFecha(s.solicitado_en)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        disabled={procesando}
                        onClick={() => aprobarSolicitud(s.id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 10,
                          border: 'none',
                          background: procesando ? 'var(--card-border)' : '#4CAF50',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: procesando ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {procesando ? '...' : '✓ Aprobar'}
                      </button>
                      <button
                        type="button"
                        disabled={procesando}
                        onClick={() => rechazarSolicitud(s.id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 10,
                          border: '1px solid rgba(255,80,80,0.4)',
                          background: 'transparent',
                          color: '#ff6b6b',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: procesando ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Resultados — partidos finalizados */}
      {tab === 'partidos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {partidos.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚽</div>
              <p>Aún no hay partidos finalizados</p>
            </div>
          ) : (
            partidos.map(partido => {
              const pronos = pronosticos[partido.id];
              return (
                <div key={partido.id} style={{ ...card, padding: '16px' }}>
                  {/* Fecha + grupo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatFecha(partido.fecha_hora)}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {partido.grupo && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--purple-light)', background: 'rgba(124,79,224,0.15)', borderRadius: 6, padding: '2px 8px' }}>
                          {partido.grupo}
                        </span>
                      )}
                      <span style={{ background: 'rgba(76,175,80,0.15)', color: '#4caf50', borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
                        Finalizado
                      </span>
                    </div>
                  </div>

                  {/* Equipos + resultado */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ textAlign: 'right', fontSize: '0.88rem', fontWeight: 700 }}>
                      {codigoABandera(partido.bandera_local)} {partido.equipo_local}
                    </div>
                    <div style={{ textAlign: 'center', fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', minWidth: 60 }}>
                      {partido.goles_local} - {partido.goles_visitante}
                    </div>
                    <div style={{ textAlign: 'left', fontSize: '0.88rem', fontWeight: 700 }}>
                      {partido.equipo_visitante} {codigoABandera(partido.bandera_visitante)}
                    </div>
                  </div>

                  {/* Pronóstico del usuario */}
                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, textAlign: 'center' }}>
                    {pronos ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                          Tu pronóstico: <strong style={{ color: 'var(--white)' }}>{pronos.goles_local} - {pronos.goles_visitante}</strong>
                        </span>
                        {pronos.puntos_obtenidos !== null && (
                          <span style={{
                            background: pronos.puntos_obtenidos > 0 ? 'rgba(245,200,66,0.15)' : 'rgba(255,80,80,0.1)',
                            border: `1px solid ${pronos.puntos_obtenidos > 0 ? 'rgba(245,200,66,0.4)' : 'rgba(255,80,80,0.3)'}`,
                            color: pronos.puntos_obtenidos > 0 ? 'var(--gold)' : '#ff6b6b',
                            borderRadius: 8, padding: '2px 10px',
                            fontSize: '0.77rem', fontWeight: 700,
                          }}>
                            {pronos.puntos_obtenidos > 0 ? `+${pronos.puntos_obtenidos} pts` : '0 pts'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>No hiciste pronóstico</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// app/partidos/page.tsx
// Partidos del torneo — pronósticos FREE y sugerencias PRO con top 3
// Selector de clasificado en fases eliminatorias cuando hay empate
// crafted by JR ♥

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';
import Image from 'next/image';
import BottomNav from '@/components/layout/BottomNav';
import { mapPartidoFromApi, type PartidoUI } from '@/lib/partidos';
import { getApiErrorMessage } from '@/lib/errors';

type Partido = PartidoUI;

interface Pronostico {
  id: string;
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
  puntos_obtenidos: number | null;
  clasificado_local: boolean | null;
}

interface ResultadoTop3 {
  goles_local: number;
  goles_visitante: number;
  probabilidad: number;
}

interface SugerenciaPro {
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
  probabilidad: number;
  top3?: ResultadoTop3[];
  probabilidades?: { Local: number; Empate: number; Visitante: number };
}

interface GrupoResumen {
  id: string;
  nombre: string;
  estado: string;
}

const C = {
  bg:          '#0D0520',
  bgCard:      'rgba(255,255,255,0.05)',
  border:      'rgba(255,255,255,0.08)',
  gold:        '#F5C842',
  goldMuted:   'rgba(245,200,66,0.12)',
  purple:      '#7C4FE0',
  purpleLight: '#9B6FFF',
  purpleMuted: 'rgba(124,79,224,0.15)',
  white:       '#FFFFFF',
  muted:       'rgba(255,255,255,0.4)',
  muted2:      'rgba(255,255,255,0.15)',
  green:       '#4CAF50',
  red:         '#FF5252',
  dark:        '#1A0A3C',
};

const FASES_ORDEN = ['grupos', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'tercer_puesto', 'final'];
const FASES_ELIMINATORIAS = ['dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'tercer_puesto', 'final'];

const FASES_LABEL: Record<string, string> = {
  grupos:        'Fase de Grupos',
  dieciseisavos: 'Dieciseisavos de Final',
  octavos:       'Octavos de Final',
  cuartos:       'Cuartos de Final',
  semifinal:     'Semifinales',
  tercer_puesto: 'Tercer Puesto',
  final:         'Final',
};

const FASES_BONO: Record<string, string> = {
  dieciseisavos: 'Bono Octavos',
  octavos:       'Bono Cuartos',
  cuartos:       'Bono Semifinales',
  semifinal:     'Bono Final',
  final:         'Bono Campeon',
};

type FiltroEstado = 'todos' | 'programado' | 'vivo' | 'finalizado';

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short', day: 'numeric',
    month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function codigoABandera(codigo: string | null): React.ReactElement {
  if (!codigo) return <span style={{ fontSize: '1.4rem' }}>🏳️</span>;
  const url = `https://flagcdn.com/48x36/${codigo.toLowerCase()}.png`;
  return (
    <Image src={url} alt={codigo} width={40} height={30}
      style={{ objectFit: 'cover', borderRadius: 4 }} />
  );
}

function tiempoRestante(cierre: string): string {
  const diff = new Date(cierre).getTime() - Date.now();
  if (diff <= 0) return 'Cerrado';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function PartidosPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated, hydrate } = useAuthStore();

  const [grupos, setGrupos]             = useState<GrupoResumen[]>([]);
  const [grupoId, setGrupoId]           = useState<string>('');
  const [partidos, setPartidos]         = useState<Partido[]>([]);
  const [pronosticos, setPronosticos]   = useState<Record<string, Pronostico>>({});
  const [sugerencias, setSugerencias]   = useState<Record<string, SugerenciaPro>>({});
  const [inputs, setInputs]             = useState<Record<string, { local: string; visitante: string }>>({});
  const [clasificados, setClasificados] = useState<Record<string, boolean | null>>({});
  const [guardando, setGuardando]       = useState<Record<string, boolean>>({});
  const [mensajes, setMensajes]         = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [filtro, setFiltro]             = useState<FiltroEstado>('todos');
  const [colapsados, setColapsados]     = useState<Record<string, boolean>>({});

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    cargarGrupos();
    cargarPartidos();

  }, [hydrated, isAuthenticated, router]);

  const cargarGrupos = async () => {
    try {
      const res = await api.get('/grupos/mis-grupos');
      const data: GrupoResumen[] = res.data;
      setGrupos(data);
      const primero = data.find(g => g.estado === 'activo') ?? data[0];
      if (primero) setGrupoId(primero.id);
    } catch (err) {
      console.error('Error cargando grupos:', err);
    }
  };

  const cargarPartidos = async () => {
    try {
      const res = await api.get('/partidos/');
      setPartidos((res.data as Parameters<typeof mapPartidoFromApi>[0][]).map(mapPartidoFromApi));
    } catch (err) {
      console.error('Error cargando partidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarPronosticos = useCallback(async (gid: string) => {
    try {
      const res = await api.get(`/pronosticos/mis-pronosticos/${gid}`);
      const map: Record<string, Pronostico> = {};
      const inp: Record<string, { local: string; visitante: string }> = {};
      const clas: Record<string, boolean | null> = {};
      for (const p of res.data) {
        map[p.partido_id] = p;
        inp[p.partido_id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
        if (p.clasificado_local !== undefined) {
          clas[p.partido_id] = p.clasificado_local;
        }
      }
      setPronosticos(map);
      setInputs(prev => ({ ...prev, ...inp }));
      setClasificados(prev => ({ ...prev, ...clas }));
    } catch (err) {
      console.error('Error cargando pronósticos:', err);
    }
  }, []);

  const cargarTodasLasSugerencias = useCallback(async () => {
    try {
        const res = await api.get('/sugerencias/');
        const map: Record<string, SugerenciaPro> = {};
        for (const s of res.data) {
            map[s.partido_id] = {
                partido_id:      s.partido_id,
                goles_local:     s.goles_local,
                goles_visitante: s.goles_visitante,
                probabilidad:    s.confianza,
                top3:            s.top3,           // ← agregar
                probabilidades:  s.probabilidades, // ← agregar
            };
        }
        setSugerencias(map);
    } catch { /* no PRO o error */ }
  }, []);

  useEffect(() => {
    if (!grupoId) return;
    cargarPronosticos(grupoId);
  }, [grupoId, cargarPronosticos]);

  useEffect(() => {
    if (!user?.es_pro || partidos.length === 0) return;
    cargarTodasLasSugerencias();
  }, [partidos, user?.es_pro, cargarTodasLasSugerencias]);

  const guardarPronostico = async (partidoId: string, fase: string) => {
    const input = inputs[partidoId];
    if (!input || !grupoId) return;
    const local     = parseInt(input.local);
    const visitante = parseInt(input.visitante);
    if (isNaN(local) || isNaN(visitante) || local < 0 || visitante < 0) {
      setMensajes(m => ({ ...m, [partidoId]: 'Marcador inválido' }));
      return;
    }

    // Validar que en fase eliminatoria con empate se haya seleccionado clasificado
    const esEliminatoria = FASES_ELIMINATORIAS.includes(fase);
    const esEmpate       = local === visitante;
    if (esEliminatoria && esEmpate && clasificados[partidoId] === undefined) {
      setMensajes(m => ({ ...m, [partidoId]: 'Debes indicar qué equipo clasifica en caso de empate' }));
      return;
    }

    setGuardando(g => ({ ...g, [partidoId]: true }));
    setMensajes(m => ({ ...m, [partidoId]: '' }));

    try {
      const payload: Record<string, unknown> = {
        partido_id:      partidoId,
        grupo_id:        grupoId,
        goles_local:     local,
        goles_visitante: visitante,
      };

      // Solo enviar clasificado_local si es eliminatoria con empate
      if (esEliminatoria && esEmpate) {
        payload.clasificado_local = clasificados[partidoId];
      }

      const res = await api.post('/pronosticos/', payload);
      setPronosticos(p => ({ ...p, [partidoId]: res.data }));
      setMensajes(m => ({ ...m, [partidoId]: '✓ Guardado' }));
      setTimeout(() => setMensajes(m => ({ ...m, [partidoId]: '' })), 2500);
    } catch (err: unknown) {
      setMensajes(m => ({ ...m, [partidoId]: getApiErrorMessage(err, 'Error al guardar') }));
    } finally {
      setGuardando(g => ({ ...g, [partidoId]: false }));
    }
  };

  const usarSugerencia = (partidoId: string, goles_local: number, goles_visitante: number) => {
    setInputs(prev => ({
      ...prev,
      [partidoId]: { local: String(goles_local), visitante: String(goles_visitante) },
    }));
  };

  const setInput = (partidoId: string, lado: 'local' | 'visitante', val: string) => {
    setInputs(prev => ({
      ...prev,
      [partidoId]: { ...prev[partidoId] ?? { local: '0', visitante: '0' }, [lado]: val },
    }));
  };

  const toggleColapsado = (key: string) => {
    setColapsados(c => ({ ...c, [key]: !c[key] }));
  };

  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ color: C.muted, fontSize: '0.9rem' }}>Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  const partidosFiltrados = filtro === 'todos' ? partidos : partidos.filter(p => p.estado === filtro);

  const porFase = FASES_ORDEN.reduce<Record<string, Partido[]>>((acc, fase) => {
    const lista = partidosFiltrados.filter(p => p.fase === fase);
    if (lista.length > 0) acc[fase] = lista;
    return acc;
  }, {}); 



  const agruparPorSubgrupo = (lista: Partido[]) =>
    lista.reduce<Record<string, Partido[]>>((acc, p) => {
      const key = p.grupo ?? 'Sin grupo';
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

  const counts = {
    todos:      partidos.length,
    programado: partidos.filter(p => p.estado === 'programado').length,
    vivo:       partidos.filter(p => p.estado === 'vivo').length,
    finalizado: partidos.filter(p => p.estado === 'finalizado').length,
  };

  const renderPartido = (partido: Partido) => {
    const finalizado     = partido.estado === 'finalizado';
    const vivo           = partido.estado === 'vivo';
    const cerrado        = new Date() >= new Date(partido.cierre_pronosticos);
    const abierto        = !cerrado && !finalizado && !vivo;
    const pronos         = pronosticos[partido.id];
    const sug            = sugerencias[partido.id];
    const inputAct       = inputs[partido.id] ?? { local: '', visitante: '' };
    const guardandoEste  = guardando[partido.id];
    const msg            = mensajes[partido.id];
    const esEliminatoria = FASES_ELIMINATORIAS.includes(partido.fase);

    const localVal    = parseInt(inputAct.local);
    const visitanteVal = parseInt(inputAct.visitante);
    const esEmpateInput = !isNaN(localVal) && !isNaN(visitanteVal) && localVal === visitanteVal;
    const mostrarClasificado = esEliminatoria && abierto && esEmpateInput;

    const nombreLocal  = partido.equipo_local;
    const nombreVisita = partido.equipo_visitante;

    return (
      <div key={partido.id} style={{
        background: vivo ? 'rgba(255,82,82,0.05)' : C.bgCard,
        border: `1px solid ${vivo ? 'rgba(255,82,82,0.2)' : C.border}`,
        borderRadius: 18, padding: '16px',
      }}>
        {/* Fecha + estado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '0.68rem', color: C.muted }}>{formatFecha(partido.fecha_hora)}</span>
          {vivo ? (
            <span style={{ background: 'rgba(255,82,82,0.18)', color: C.red, borderRadius: 100, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 700 }}>● EN VIVO</span>
          ) : finalizado ? (
            <span style={{ background: C.bgCard, color: C.muted, borderRadius: 100, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 600 }}>Finalizado</span>
          ) : cerrado ? (
            <span style={{ background: C.bgCard, color: C.muted, borderRadius: 100, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 600 }}>Cerrado</span>
          ) : (
            <span style={{ background: C.purpleMuted, color: C.purpleLight, borderRadius: 100, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 600 }}>
              Cierra en {tiempoRestante(partido.cierre_pronosticos)}
            </span>
          )}
        </div>

        {/* Equipos + marcador */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {codigoABandera(partido.bandera_local)}
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.white, lineHeight: 1.2 }}>{partido.equipo_local}</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 60 }}>
            {finalizado || vivo ? (
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: finalizado ? C.gold : C.red, letterSpacing: 2 }}>
                {partido.goles_local ?? 0} - {partido.goles_visitante ?? 0}
              </div>
            ) : (
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: C.muted }}>VS</div>
            )}
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {codigoABandera(partido.bandera_visitante)}
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.white, lineHeight: 1.2 }}>{partido.equipo_visitante}</div>
          </div>
        </div>

        {/* Pronóstico */}
        {finalizado ? (
          pronos ? (
            <div style={{ background: C.bgCard, borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: C.muted, marginBottom: 4 }}>
                Tu pronóstico: <strong style={{ color: C.white }}>{pronos.goles_local} - {pronos.goles_visitante}</strong>
                {pronos.clasificado_local !== null && pronos.clasificado_local !== undefined && (
                  <span style={{ color: C.purpleLight, marginLeft: 6 }}>
                    · Clasifica: {pronos.clasificado_local ? partido.equipo_local : partido.equipo_visitante}
                  </span>
                )}
              </div>
              {pronos.puntos_obtenidos !== null ? (
                <span style={{
                  background: pronos.puntos_obtenidos > 0 ? C.goldMuted : 'rgba(255,82,82,0.1)',
                  border: `1px solid ${pronos.puntos_obtenidos > 0 ? 'rgba(245,200,66,0.3)' : 'rgba(255,82,82,0.25)'}`,
                  color: pronos.puntos_obtenidos > 0 ? C.gold : C.red,
                  borderRadius: 8, padding: '3px 12px',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {pronos.puntos_obtenidos > 0 ? `+${pronos.puntos_obtenidos} pts` : '0 pts'}
                </span>
              ) : (
                <span style={{
                  background: 'rgba(124,79,224,0.12)',
                  border: '1px solid rgba(124,79,224,0.35)',
                  color: C.purpleLight,
                  borderRadius: 8, padding: '3px 12px',
                  fontSize: '0.72rem', fontWeight: 600,
                }}>
                  Puntos en proceso…
                </span>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: C.muted }}>No hiciste pronóstico</div>
          )
        ) : cerrado ? (
          pronos ? (
            <div style={{ background: C.bgCard, borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: C.muted }}>
                Pronóstico: <strong style={{ color: C.purpleLight }}>{pronos.goles_local} - {pronos.goles_visitante}</strong>
                {pronos.clasificado_local !== null && pronos.clasificado_local !== undefined && (
                  <span style={{ marginLeft: 6 }}>
                    · Clasifica: <strong style={{ color: C.gold }}>{pronos.clasificado_local ? partido.equipo_local : partido.equipo_visitante}</strong>
                  </span>
                )}
                <span style={{ marginLeft: 8, opacity: 0.5 }}>· Cerrado</span>
              </span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: C.red }}>⏱ No registraste pronóstico</div>
          )
        ) : abierto ? (
          <div>
            {/* Sugerencia PRO */}
            {user.es_pro && sug && ['grupos', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'tercer_puesto', 'final'].includes(partido.fase) && (
              <div style={{ background: C.goldMuted, border: `1px solid rgba(245,200,66,0.25)`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: '0.65rem', color: C.gold, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
                  ⭐ PREDICCIÓN ESTADÍSTICA IA
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {(sug.top3 ?? [{ goles_local: sug.goles_local, goles_visitante: sug.goles_visitante, probabilidad: sug.probabilidad }]).map((r, i) => (
                    <button key={i} onClick={() => usarSugerencia(partido.id, r.goles_local, r.goles_visitante)}
                      style={{ flex: 1, background: i === 0 ? C.gold : 'rgba(245,200,66,0.12)', color: i === 0 ? C.dark : C.gold, border: `1px solid ${i === 0 ? C.gold : 'rgba(245,200,66,0.3)'}`, borderRadius: 10, padding: '8px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', fontWeight: 800 }}>{r.goles_local} - {r.goles_visitante}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85 }}>{r.probabilidad}%</span>
                      {i === 0 && <span style={{ fontSize: '0.58rem', opacity: 0.7 }}>Más probable</span>}
                    </button>
                  ))}
                </div>
                {sug.probabilidades && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: nombreLocal.split(' ')[0],  val: sug.probabilidades.Local },
                      { label: 'Empate',                   val: sug.probabilidades.Empate },
                      { label: nombreVisita.split(' ')[0], val: sug.probabilidades.Visitante },
                    ].map(p => (
                      <div key={p.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', color: C.muted, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: C.white }}>{p.val}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Banner PRO para FREE */}
            {!user.es_pro && (
              <div onClick={() => router.push('/pro')}
                style={{ background: 'rgba(124,79,224,0.08)', border: '1px solid rgba(124,79,224,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: C.purpleLight }}>⭐ Hazte PRO para ver predicciones IA y top 3 marcadores</span>
                <span style={{ fontSize: '0.72rem', color: C.gold, fontWeight: 700, flexShrink: 0 }}>Ver →</span>
              </div>
            )}

            {/* Inputs marcador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <input type="number" min="0" max="20" value={inputAct.local}
                onChange={e => setInput(partido.id, 'local', e.target.value)} placeholder="0"
                style={{ width: 48, padding: '8px 4px', textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.white, fontSize: '1.1rem', fontWeight: 800, outline: 'none', fontFamily: 'Syne, sans-serif' }}
                onFocus={e => e.target.style.borderColor = C.purpleLight}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <span style={{ color: C.muted, fontWeight: 700, fontSize: '1rem' }}>-</span>
              <input type="number" min="0" max="20" value={inputAct.visitante}
                onChange={e => setInput(partido.id, 'visitante', e.target.value)} placeholder="0"
                style={{ width: 48, padding: '8px 4px', textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.white, fontSize: '1.1rem', fontWeight: 800, outline: 'none', fontFamily: 'Syne, sans-serif' }}
                onFocus={e => e.target.style.borderColor = C.purpleLight}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button onClick={() => guardarPronostico(partido.id, partido.fase)} disabled={guardandoEste}
                style={{ padding: '10px 18px', background: guardandoEste ? C.muted2 : C.purple, color: C.white, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: guardandoEste ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {guardandoEste ? '...' : pronos ? 'Actualizar' : 'Guardar'}
              </button>
            </div>

            {/* Selector de clasificado — solo en eliminatorias con empate */}
            {mostrarClasificado && (
              <div style={{ marginTop: 12, background: 'rgba(124,79,224,0.1)', border: '1px solid rgba(124,79,224,0.3)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: C.purpleLight, fontWeight: 700, marginBottom: 8 }}>
                  ⚽ Empate — ¿Quién clasifica?
                  {FASES_BONO[partido.fase] && (
                    <span style={{ color: C.gold, marginLeft: 6 }}>· Acierta quién avanza y ganas el {FASES_BONO[partido.fase]}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setClasificados(c => ({ ...c, [partido.id]: true }))}
                    style={{
                      flex: 1, padding: '10px 8px',
                      background: clasificados[partido.id] === true ? C.purple : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${clasificados[partido.id] === true ? C.purpleLight : C.border}`,
                      borderRadius: 10, cursor: 'pointer',
                      color: C.white, fontWeight: 700, fontSize: '0.78rem',
                      textAlign: 'center', transition: 'all 0.15s',
                    }}
                  >
                    {partido.equipo_local}
                  </button>
                  <button
                    onClick={() => setClasificados(c => ({ ...c, [partido.id]: false }))}
                    style={{
                      flex: 1, padding: '10px 8px',
                      background: clasificados[partido.id] === false ? C.purple : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${clasificados[partido.id] === false ? C.purpleLight : C.border}`,
                      borderRadius: 10, cursor: 'pointer',
                      color: C.white, fontWeight: 700, fontSize: '0.78rem',
                      textAlign: 'center', transition: 'all 0.15s',
                    }}
                  >
                    {partido.equipo_visitante}
                  </button>
                </div>
              </div>
            )}

            {msg && (
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.78rem', color: msg.startsWith('✓') ? C.green : C.red }}>
                {msg}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, maxWidth: 480, margin: '0 auto', paddingBottom: 88, fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: C.white }}>
          Win<span style={{ color: C.gold }}>★</span>Predict
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: C.white }}>⚽ Partidos</div>
      </div>

      {/* Selector de grupo */}
      {grupos.length > 0 && (
        <div style={{ padding: '14px 20px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', borderBottom: `1px solid ${C.border}` }}>
          {grupos.map(g => (
            <button key={g.id} onClick={() => setGrupoId(g.id)}
              style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 100, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', border: 'none', background: grupoId === g.id ? C.purple : C.bgCard, color: grupoId === g.id ? C.white : C.muted, transition: 'all 0.2s' }}>
              {g.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {([
          { key: 'todos',      label: 'Todos',       color: C.white },
          { key: 'vivo',       label: '● En vivo',   color: C.red },
          { key: 'programado', label: 'Próximos',    color: C.purpleLight },
          { key: 'finalizado', label: 'Finalizados', color: C.muted },
        ] as { key: FiltroEstado; label: string; color: string }[]).map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 100, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', border: 'none', background: filtro === f.key ? 'rgba(255,255,255,0.1)' : C.bgCard, color: filtro === f.key ? f.color : C.muted, transition: 'all 0.2s' }}>
            {f.label}
            <span style={{ marginLeft: 5, fontSize: '0.68rem', opacity: 0.6 }}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.muted }}>Cargando partidos...</div>
      ) : partidosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚽</div>
          <p style={{ fontSize: '0.9rem' }}>No hay partidos en esta categoría</p>
        </div>
      ) : (
        <div style={{ padding: '8px 20px 0' }}>
          {Object.entries(porFase).map(([fase, listaFase]) => (
            <div key={fase} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.purpleLight, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12, paddingLeft: 2 }}>
                {FASES_LABEL[fase] ?? fase}
              </div>

              {fase === 'grupos' && filtro !== 'programado'? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(agruparPorSubgrupo(listaFase))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([subgrupo, listaSubgrupo]) => {
                      const clave       = `grupos-${subgrupo}`;
                      const colapsado   = colapsados[clave] ?? false;
                      const finalizados = listaSubgrupo.filter(p => p.estado === 'finalizado').length;
                      return (
                        <div key={subgrupo} style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                          <button onClick={() => toggleColapsado(clave)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.purpleMuted, border: 'none', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: C.purpleLight }}>{subgrupo}</span>
                              <span style={{ fontSize: '0.7rem', color: C.muted }}>{finalizados}/{listaSubgrupo.length} jugados</span>
                            </div>
                            <span style={{ color: C.muted, fontSize: '0.85rem', display: 'inline-block', transform: colapsado ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                          </button>
                          {!colapsado && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px' }}>
                              {listaSubgrupo.map(p => renderPartido(p))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {listaFase.map(p => renderPartido(p))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

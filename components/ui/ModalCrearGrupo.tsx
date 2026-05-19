// components/ui/ModalCrearGrupo.tsx
// Modal multi-paso para crear grupo: info → reglas → premios
// Alineado con GrupoIn del backend y tabla grupos de Supabase
// crafted by JR ♥

'use client';

import { useState } from 'react';
import api from '@/lib/axios';

interface Props {
  onClose: () => void;
  onCreado: () => void;
}

const MONEDAS = ['COP', 'USD', 'EUR', 'BRL', 'MXN', 'ARS'];

// Valores por defecto recomendados — rango 0-10 según backend
const REGLAS_DEFAULT = {
  pts_marcador_exacto:  5,
  pts_ganador:          3,
  pts_empate:           2,
  pts_gol:              1,
  pts_prediccion_unica: 2,
  bono_dieciseisavos:   1,
  bono_octavos:         2,
  bono_cuartos:         3,
  bono_semifinales:     4,
  bono_final:           5,
};

type Reglas = typeof REGLAS_DEFAULT;

const REGLAS_INFO: { key: keyof Reglas; label: string; info: string }[] = [
  { key: 'pts_marcador_exacto',  label: 'Marcador exacto',    info: 'Puntos por adivinar el marcador exacto del partido' },
  { key: 'pts_ganador',          label: 'Ganador acertado',   info: 'Puntos por adivinar solo el equipo ganador' },
  { key: 'pts_empate',           label: 'Empate acertado',    info: 'Puntos por predecir correctamente un empate' },
  { key: 'pts_gol',              label: 'Gol acertado',       info: 'Puntos por cada gol acertado en el marcador' },
  { key: 'pts_prediccion_unica', label: 'Predicción única',   info: 'Bonus por ser el único en acertar ese resultado' },
  { key: 'bono_dieciseisavos',   label: 'Bono Dieciseisavos', info: 'Puntos extra en fase de dieciseisavos' },
  { key: 'bono_octavos',         label: 'Bono Octavos',       info: 'Puntos extra en fase de octavos' },
  { key: 'bono_cuartos',         label: 'Bono Cuartos',       info: 'Puntos extra en cuartos de final' },
  { key: 'bono_semifinales',     label: 'Bono Semifinales',   info: 'Puntos extra en semifinales' },
  { key: 'bono_final',           label: 'Bono Final',         info: 'Puntos extra en la final' },
];

const DIST_DEFAULT = { pct_1: 60, pct_2: 30, pct_3: 10, pct_4: 0 };
type Dist = typeof DIST_DEFAULT;

const PASO_LABELS = ['Información', 'Reglas', 'Premios'];

export default function ModalCrearGrupo({ onClose, onCreado }: Props) {
  const [paso, setPaso] = useState(1);

  // Paso 1
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [maxParticipantes, setMaxParticipantes] = useState('50');
  const [premioValor, setPremioValor] = useState('');
  const [premioMoneda, setPremioMoneda] = useState('COP');

  // Paso 2
  const [reglas, setReglas] = useState<Reglas>({ ...REGLAS_DEFAULT });

  // Paso 3 — solo visual, no se envía al backend
  const [dist, setDist] = useState<Dist>({ ...DIST_DEFAULT });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tooltipActivo, setTooltipActivo] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--card-border)',
    borderRadius: 10, color: 'var(--white)',
    fontSize: '0.92rem', outline: 'none',
    transition: 'border-color 0.2s', marginTop: 5,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem', color: 'var(--text-muted)',
  };

  const validarPaso1 = () => {
    if (!nombre.trim()) { setError('El nombre del grupo es obligatorio'); return false; }
    const max = parseInt(maxParticipantes);
    if (isNaN(max) || max < 2 || max > 500) {
      setError('El máximo de participantes debe estar entre 2 y 500'); return false;
    }
    if (premioValor) {
      const v = parseFloat(premioValor);
      if (isNaN(v) || v <= 0) { setError('El valor de ingreso debe ser un número positivo'); return false; }
    }
    return true;
  };

  const totalPct = dist.pct_1 + dist.pct_2 + dist.pct_3 + dist.pct_4;

  const handleSiguiente = () => {
    setError('');
    if (paso === 1 && !validarPaso1()) return;
    if (paso < 3) { setPaso(p => p + 1); return; }
    handleCrear();
  };

  const handleCrear = async () => {
    if (totalPct !== 100) {
      setError(`La suma de porcentajes debe ser 100%. Actualmente: ${totalPct}%`);
      return;
    }
    setLoading(true);
    setError('');
    const valorNum = premioValor ? parseFloat(premioValor) : null;
    try {
      await api.post('/grupos/', {
        nombre:            nombre.trim(),
        descripcion:       descripcion.trim() || undefined,
        max_participantes: parseInt(maxParticipantes),
        premio_valor:      valorNum,
        premio_moneda:     valorNum ? premioMoneda : undefined,
        reglas,
      });
      onCreado();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Error al crear el grupo');
      setLoading(false);
    }
  };

  const updateRegla = (key: keyof Reglas, val: string) => {
    const num = parseInt(val);
    setReglas(r => ({ ...r, [key]: isNaN(num) ? 0 : Math.min(10, Math.max(0, num)) }));
  };

  const updateDist = (key: keyof Dist, val: string) => {
    const num = parseInt(val);
    setDist(p => ({ ...p, [key]: isNaN(num) ? 0 : Math.min(100, Math.max(0, num)) }));
  };

  // Premio estimado con grupo lleno
  const premioTotal = premioValor && maxParticipantes
    ? parseFloat(premioValor) * parseInt(maxParticipantes)
    : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: premioMoneda, maximumFractionDigits: 0,
    }).format(val);

  const estimado = (pct: number) =>
    premioTotal > 0 ? formatCurrency(premioTotal * pct / 100) : null;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', zIndex: 50,
      }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)',
        padding: '28px 28px 24px',
        width: '92%', maxWidth: 500,
        maxHeight: '88vh', overflowY: 'auto',
        zIndex: 51,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.15rem', fontWeight: 700 }}>
            👥 Crear grupo
          </h2>
          <span style={{
            background: 'var(--purple-mid)', color: 'var(--white)',
            borderRadius: 100, padding: '4px 12px',
            fontSize: '0.78rem', fontWeight: 700,
          }}>
            {paso} / 3
          </span>
        </div>

        {/* Barra de progreso */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map(p => (
            <div key={p} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                height: 4, width: '100%', borderRadius: 100,
                background: p <= paso ? 'var(--gold)' : 'var(--card-border)',
                transition: 'background 0.25s',
              }} />
              <span style={{ fontSize: '0.67rem', fontWeight: 600, color: p <= paso ? 'var(--gold)' : 'var(--text-muted)' }}>
                {PASO_LABELS[p - 1]}
              </span>
            </div>
          ))}
        </div>

        {/* ── PASO 1: Información ── */}
        {paso === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nombre del grupo *</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Los Cracks del Mundial" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
                onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div>
              <label style={labelStyle}>Descripción (opcional)</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: Grupo del trabajo" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
                onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Máximo de participantes * <span style={{ color: 'var(--purple-light)' }}>(2 – 500)</span>
              </label>
              <input type="number" min="2" max="500" value={maxParticipantes}
                onChange={e => setMaxParticipantes(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
                onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>
                Valor de ingreso por participante
                <span style={{ color: 'var(--purple-light)', marginLeft: 6 }}>(0 = gratis)</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" min="0" step="any" value={premioValor}
                  onChange={e => setPremioValor(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
                  onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                />
                <select value={premioMoneda} onChange={e => setPremioMoneda(e.target.value)}
                  style={{
                    padding: '11px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 10, color: 'var(--white)',
                    fontSize: '0.9rem', outline: 'none', cursor: 'pointer', minWidth: 80,
                  }}
                >
                  {MONEDAS.map(m => (
                    <option key={m} value={m} style={{ background: '#1E1040' }}>{m}</option>
                  ))}
                </select>
              </div>
              {premioValor && parseFloat(premioValor) > 0 && (
                <div style={{
                  marginTop: 8, padding: '8px 12px',
                  background: 'rgba(245,200,66,0.08)',
                  border: '1px solid rgba(245,200,66,0.2)',
                  borderRadius: 8, fontSize: '0.78rem', color: 'var(--gold)',
                }}>
                  💰 Premio total estimado con grupo lleno ({maxParticipantes} personas):{' '}
                  <strong>{formatCurrency(premioTotal)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PASO 2: Reglas ── */}
        {paso === 2 && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.5 }}>
              Define cuántos puntos gana cada jugador. Rango: <strong style={{ color: 'var(--gold)' }}>0 – 10 pts</strong>.
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Los valores recomendados ya están cargados.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {REGLAS_INFO.map(({ key, label, info }) => (
                <div key={key} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 10, padding: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', flex: 1, lineHeight: 1.3 }}>{label}</span>
                    <span
                      onMouseEnter={() => setTooltipActivo(key)}
                      onMouseLeave={() => setTooltipActivo(null)}
                      style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'rgba(155,114,245,0.2)',
                        border: '1px solid var(--purple-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: 'var(--purple-light)',
                        cursor: 'help', flexShrink: 0, position: 'relative',
                      }}
                    >
                      i
                      {tooltipActivo === key && (
                        <div style={{
                          position: 'absolute', bottom: '120%', right: 0,
                          background: '#2E1F55', border: '1px solid var(--card-border)',
                          borderRadius: 8, padding: '8px 10px',
                          fontSize: '0.72rem', color: 'var(--white)',
                          width: 180, zIndex: 60, lineHeight: 1.4,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                          pointerEvents: 'none',
                        }}>
                          {info}
                        </div>
                      )}
                    </span>
                  </div>
                  <input
                    type="number" min="0" max="10" step="1"
                    value={reglas[key]}
                    onChange={e => updateRegla(key, e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 8, color: 'var(--white)',
                      fontSize: '1rem', fontWeight: 700, outline: 'none',
                      textAlign: 'center',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setReglas({ ...REGLAS_DEFAULT })}
              style={{
                marginTop: 14, background: 'transparent',
                border: '1px solid var(--card-border)',
                color: 'var(--text-muted)', borderRadius: 8,
                padding: '7px 14px', fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              ↺ Restaurar valores recomendados
            </button>
          </div>
        )}

        {/* ── PASO 3: Distribución de premios ── */}
        {paso === 3 && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Define qué porcentaje del premio recibe cada posición. La suma debe ser{' '}
              <strong style={{ color: 'var(--gold)' }}>100%</strong>.
              {premioTotal > 0 && (
                <span style={{ color: 'var(--gold)' }}> Premio total estimado: <strong>{formatCurrency(premioTotal)}</strong></span>
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {([
                { key: 'pct_1' as keyof Dist, label: '🥇 1er lugar', color: '#FFD700' },
                { key: 'pct_2' as keyof Dist, label: '🥈 2do lugar', color: '#C0C0C0' },
                { key: 'pct_3' as keyof Dist, label: '🥉 3er lugar', color: '#CD7F32' },
                { key: 'pct_4' as keyof Dist, label: '4to lugar',    color: 'var(--text-muted)' },
              ]).map(({ key, label, color }) => (
                <div key={key} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color, minWidth: 100 }}>{label}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 100,
                          background: color === 'var(--text-muted)' ? 'var(--purple-light)' : color,
                          width: `${Math.min(dist[key], 100)}%`,
                          transition: 'width 0.2s',
                        }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number" min="0" max="100"
                        value={dist[key]}
                        onChange={e => updateDist(key, e.target.value)}
                        style={{
                          width: 56, padding: '7px 6px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--card-border)',
                          borderRadius: 8, color: 'var(--white)',
                          fontSize: '1rem', fontWeight: 700,
                          outline: 'none', textAlign: 'center',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>%</span>
                    </div>
                  </div>
                  {estimado(dist[key]) && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: 6, paddingLeft: 112 }}>
                      ≈ {estimado(dist[key])} <span style={{ color: 'var(--text-muted)' }}>(grupo lleno)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: totalPct === 100 ? 'rgba(76,175,80,0.1)' : 'rgba(255,80,80,0.1)',
              border: `1px solid ${totalPct === 100 ? 'rgba(76,175,80,0.4)' : 'rgba(255,80,80,0.4)'}`,
              borderRadius: 10, padding: '12px 16px', marginBottom: 10,
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total</span>
              <span style={{
                fontFamily: 'var(--font-display, Syne, sans-serif)',
                fontSize: '1.2rem', fontWeight: 800,
                color: totalPct === 100 ? '#4caf50' : '#ff6b6b',
              }}>
                {totalPct}%
              </span>
            </div>

            <button
              onClick={() => setDist({ ...DIST_DEFAULT })}
              style={{
                background: 'transparent', border: '1px solid var(--card-border)',
                color: 'var(--text-muted)', borderRadius: 8,
                padding: '7px 14px', fontSize: '0.78rem', cursor: 'pointer',
              }}
            >
              ↺ Restaurar 60 / 30 / 10 / 0
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.3)',
            borderRadius: 8, padding: '10px 14px',
            fontSize: '0.83rem', color: '#ff6b6b', marginTop: 16,
          }}>
            {error}
          </div>
        )}

        {/* Navegación */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={paso === 1 ? onClose : () => { setError(''); setPaso(p => p - 1); }}
            style={{
              flex: 1, padding: 12, background: 'transparent',
              border: '1px solid var(--card-border)', color: 'var(--text-muted)',
              borderRadius: 10, cursor: 'pointer', fontSize: '0.92rem',
            }}
          >
            {paso === 1 ? 'Cancelar' : '← Atrás'}
          </button>
          <button
            onClick={handleSiguiente}
            disabled={loading}
            style={{
              flex: 2, padding: 12,
              background: loading ? 'var(--card-border)' : 'var(--gold)',
              color: '#1A0A3C', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: '0.92rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creando...' : paso < 3 ? 'Siguiente →' : '✓ Crear grupo'}
          </button>
        </div>
      </div>
    </>
  );
}

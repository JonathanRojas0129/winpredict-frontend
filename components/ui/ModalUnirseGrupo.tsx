// components/ui/ModalUnirseGrupo.tsx
// Modal para unirse a un grupo con código de invitación
// crafted by JR ♥

'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/errors';

interface Props {
  onClose: () => void;
  onUnido: () => void;
}

interface GrupoPreview {
  nombre: string;
  descripcion?: string;
  total_participantes: number;
  max_participantes: number;
  premio_valor?: number | null;
  premio_moneda?: string | null;
}

interface SolicitudEnviada {
  message: string;
  grupo_nombre: string;
}

const MENSAJE_PENDIENTE_DEFAULT =
  'Solicitud enviada. El administrador del grupo debe aprobar tu ingreso.';

export default function ModalUnirseGrupo({ onClose, onUnido }: Props) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState('');
  const [solicitudEnviada, setSolicitudEnviada] = useState<SolicitudEnviada | null>(null);
  const [preview, setPreview] = useState<GrupoPreview | null>(null);

  const resetForm = () => {
    setCodigo('');
    setPreview(null);
    setError('');
    setSolicitudEnviada(null);
  };

  const handleBuscar = async () => {
    if (codigo.trim().length < 4) {
      setError('Ingresa el código de invitación');
      return;
    }
    setLoadingPreview(true);
    setError('');
    setPreview(null);
    setSolicitudEnviada(null);
    try {
      const res = await api.get(`/grupos/preview/${codigo.trim().toUpperCase()}`);
      setPreview(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string }; status?: number } };
      const status = e.response?.status;
      if (status === 404 || status === 405) {
        await handleUnirse();
      } else {
        setError(getApiErrorMessage(err, 'Código inválido o grupo no encontrado'));
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUnirse = async () => {
    if (!codigo.trim()) {
      setError('Ingresa el código de invitación');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/grupos/unirse', {
        codigo_invitacion: codigo.trim().toUpperCase(),
      });
      setSolicitudEnviada({
        message: res.data?.message || MENSAJE_PENDIENTE_DEFAULT,
        grupo_nombre: res.data?.grupo_nombre || preview?.nombre || 'el grupo',
      });
      setPreview(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Código inválido o grupo no encontrado'));
    } finally {
      setLoading(false);
    }
  };

  const formatPremio = (valor: number, moneda: string) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 0,
    }).format(valor);

  const handleCerrarExito = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '32px 28px',
          width: '92%',
          maxWidth: 420,
          zIndex: 51,
        }}
      >
        {solicitudEnviada ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
              <h2
                style={{
                  fontFamily: 'var(--font-display, Syne, sans-serif)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                Pendiente por aprobación
              </h2>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  marginBottom: 16,
                }}
              >
                Tu solicitud para unirte a{' '}
                <strong style={{ color: 'var(--gold)' }}>
                  {solicitudEnviada.grupo_nombre}
                </strong>{' '}
                fue registrada correctamente.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(245,200,66,0.12)',
                border: '1px solid rgba(245,200,66,0.4)',
                borderRadius: 12,
                padding: '16px 18px',
                marginBottom: 24,
                lineHeight: 1.55,
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                ¿Qué sigue?
              </div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                {solicitudEnviada.message}
              </p>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                Cuando el administrador apruebe tu ingreso, el grupo aparecerá en tu inicio.
                Mientras tanto no podrás pronosticar en ese grupo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCerrarExito}
              style={{
                width: '100%',
                padding: 14,
                background: 'var(--gold)',
                color: '#1A0A3C',
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </>
        ) : (
          <>
            <h2
              style={{
                fontFamily: 'var(--font-display, Syne, sans-serif)',
                fontSize: '1.15rem',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              🔑 Unirse a un grupo
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Ingresa el código que te compartió el administrador del grupo.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Código de invitación
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value.toUpperCase());
                  setPreview(null);
                  setError('');
                  setSolicitudEnviada(null);
                }}
                placeholder="Ej: ABC123"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${preview ? 'rgba(76,175,80,0.5)' : 'var(--card-border)'}`,
                  borderRadius: 10,
                  color: 'var(--white)',
                  fontSize: '1.2rem',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '6px',
                  fontWeight: 700,
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--purple-light)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = preview
                    ? 'rgba(76,175,80,0.5)'
                    : 'var(--card-border)';
                }}
                onKeyDown={(e) => e.key === 'Enter' && !preview && handleBuscar()}
              />
            </div>

            {preview && (
              <>
                <div
                  style={{
                    background: 'rgba(76,175,80,0.08)',
                    border: '1px solid rgba(76,175,80,0.3)',
                    borderRadius: 12,
                    padding: '16px',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>👥</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {preview.nombre}
                      </div>
                      {preview.descripcion && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {preview.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      👤 {preview.total_participantes} / {preview.max_participantes}{' '}
                      participantes
                    </div>
                    {preview.premio_valor && preview.premio_moneda && (
                      <div
                        style={{
                          background: 'rgba(245,200,66,0.1)',
                          border: '1px solid rgba(245,200,66,0.2)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          color: 'var(--gold)',
                        }}
                      >
                        💰 {formatPremio(preview.premio_valor, preview.premio_moneda)}
                      </div>
                    )}
                    {preview.total_participantes >= preview.max_participantes && (
                      <div
                        style={{
                          background: 'rgba(255,80,80,0.1)',
                          border: '1px solid rgba(255,80,80,0.3)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          color: '#ff6b6b',
                        }}
                      >
                        ⚠️ Grupo lleno
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(124,79,224,0.12)',
                    border: '1px solid rgba(124,79,224,0.35)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 16,
                    fontSize: '0.82rem',
                    color: 'var(--purple-light)',
                    lineHeight: 1.5,
                  }}
                >
                  ⏳ Al solicitar ingreso, quedarás{' '}
                  <strong>pendiente por aprobación</strong> del administrador del grupo.
                </div>
              </>
            )}

            {error && (
              <div
                style={{
                  background: 'rgba(255,80,80,0.1)',
                  border: '1px solid rgba(255,80,80,0.3)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.83rem',
                  color: '#ff6b6b',
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: 12,
                  background: 'transparent',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-muted)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                }}
              >
                Cancelar
              </button>

              {!preview ? (
                <button
                  type="button"
                  onClick={handleBuscar}
                  disabled={loadingPreview || codigo.trim().length < 4}
                  style={{
                    flex: 2,
                    padding: 12,
                    background:
                      loadingPreview || codigo.trim().length < 4
                        ? 'var(--card-border)'
                        : 'var(--purple-mid)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor:
                      loadingPreview || codigo.trim().length < 4
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {loadingPreview ? 'Buscando...' : 'Buscar grupo →'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnirse}
                  disabled={
                    loading || preview.total_participantes >= preview.max_participantes
                  }
                  style={{
                    flex: 2,
                    padding: 12,
                    background:
                      loading || preview.total_participantes >= preview.max_participantes
                        ? 'var(--card-border)'
                        : 'var(--gold)',
                    color: '#1A0A3C',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor:
                      loading || preview.total_participantes >= preview.max_participantes
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {loading ? 'Enviando...' : '✓ Solicitar ingreso'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

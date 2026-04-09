// components/ui/ModalUnirseGrupo.tsx
// Modal para unirse a un grupo con código de invitación
// crafted by JR ♥

'use client';

import { useState } from 'react';
import api from '@/lib/axios';

interface Props {
  onClose: () => void;
  onUnido: () => void;
}

export default function ModalUnirseGrupo({ onClose, onUnido }: Props) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnirse = async () => {
    if (!codigo) { setError('Ingresa el código de invitación'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/grupos/unirse', { codigo_invitacion: codigo });
      onUnido();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Código inválido o grupo no encontrado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)',
        padding: '36px 32px',
        width: '100%', maxWidth: 400,
        zIndex: 51,
      }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '1.2rem', fontWeight: 700,
          marginBottom: 8,
        }}>
          🔑 Unirse a un grupo
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
          Ingresa el código que te compartió el administrador del grupo.
        </p>

        {/* Input código */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Código de invitación
          </label>
          <input
            type="text"
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ej: ABC123"
            style={{
              width: '100%', padding: '14px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--card-border)',
              borderRadius: 10, color: 'var(--white)',
              fontSize: '1.1rem', outline: 'none',
              textAlign: 'center', letterSpacing: '4px',
              fontWeight: 700, transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
            onKeyDown={e => e.key === 'Enter' && handleUnirse()}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.3)',
            borderRadius: 8, padding: '10px 14px',
            fontSize: '0.85rem', color: '#ff6b6b',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12,
            background: 'transparent',
            border: '1px solid var(--card-border)',
            color: 'var(--text-muted)',
            borderRadius: 10, cursor: 'pointer',
            fontSize: '0.95rem',
          }}>
            Cancelar
          </button>
          <button onClick={handleUnirse} disabled={loading} style={{
            flex: 1, padding: 12,
            background: loading ? 'var(--card-border)' : 'var(--purple-mid)',
            color: 'var(--white)', border: 'none',
            borderRadius: 10, fontWeight: 700,
            fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Uniéndose...' : 'Unirse'}
          </button>
        </div>
      </div>
    </>
  );
}
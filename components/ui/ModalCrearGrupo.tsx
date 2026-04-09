// components/ui/ModalCrearGrupo.tsx
// Modal para crear un nuevo grupo
// crafted by JR ♥

'use client';

import { useState } from 'react';
import api from '@/lib/axios';

interface Props {
  onClose: () => void;
  onCreado: () => void;
}

export default function ModalCrearGrupo({ onClose, onCreado }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [premio, setPremio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCrear = async () => {
    if (!nombre) { setError('El nombre del grupo es obligatorio'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/grupos/', { nombre, descripcion, premio });
      onCreado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--card-border)',
    borderRadius: 10, color: 'var(--white)',
    fontSize: '0.95rem', outline: 'none',
    transition: 'border-color 0.2s',
    marginTop: 6,
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
        width: '100%', maxWidth: 440,
        zIndex: 51,
      }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '1.2rem', fontWeight: 700,
          marginBottom: 24,
        }}>
          👥 Crear nuevo grupo
        </h2>

        {/* Nombre */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Nombre del grupo *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Los Cracks del Mundial"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
          />
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Descripción (opcional)
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Ej: Grupo del trabajo"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
          />
        </div>

        {/* Premio */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Premio (opcional)
          </label>
          <input
            type="text"
            value={premio}
            onChange={e => setPremio(e.target.value)}
            placeholder="Ej: COP 200.000"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
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
          <button onClick={handleCrear} disabled={loading} style={{
            flex: 1, padding: 12,
            background: loading ? 'var(--card-border)' : 'var(--gold)',
            color: '#1A0A3C', border: 'none',
            borderRadius: 10, fontWeight: 700,
            fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Creando...' : 'Crear grupo'}
          </button>
        </div>
      </div>
    </>
  );
}
// app/dashboard/page.tsx
// Dashboard principal de WinPredict
// crafted by JR ♥

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/axios';
import ModalCrearGrupo from '@/components/ui/ModalCrearGrupo';

interface Grupo {
  id: string;
  nombre: string;
  descripcion: string;
  premio: string;
  codigo_invitacion: string;
  total_puntos: number;
  posicion: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [modalCrear, setModalCrear] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      cargarGrupos();
    }
  }, [isAuthenticated]);

  const cargarGrupos = async () => {
    try {
      const res = await api.get('/grupos/mis-grupos');
      setGrupos(res.data);
    } catch (err) {
      console.error('Error cargando grupos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)',
        padding: '16px 24px', marginBottom: 24,
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: 800 }}>
          Win<span style={{ color: 'var(--gold)' }}>★</span>Predict
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user.es_pro && (
            <span style={{
              background: 'rgba(245,200,66,0.15)',
              border: '1px solid rgba(245,200,66,0.4)',
              color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: 100,
            }}>⭐ PRO</span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Hola, <strong style={{ color: 'var(--white)' }}>{user.nombre}</strong>
          </span>
          <button onClick={() => { logout(); router.push('/login'); }} style={{
            background: 'transparent', border: '1px solid var(--card-border)',
            color: 'var(--text-muted)', borderRadius: 8, padding: '6px 14px',
            fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget).style.borderColor = 'var(--purple-light)';
              (e.currentTarget).style.color = 'var(--white)';
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.borderColor = 'var(--card-border)';
              (e.currentTarget).style.color = 'var(--text-muted)';
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {[
          { label: 'Puntos', value: '0', icon: '⚡' },
          { label: 'Posición', value: '--', icon: '📊' },
          { label: 'Aciertos', value: '0', icon: '✅' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)' }}>
              {stat.value}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mis grupos */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)', padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
            Mis grupos
          </h2>
          <button onClick={() => setModalCrear(true)} style={{
            background: 'var(--gold)', color: '#1A0A3C',
            border: 'none', borderRadius: 8,
            padding: '8px 18px', fontWeight: 700,
            fontSize: '0.85rem', cursor: 'pointer',
          }}>
            + Crear grupo
          </button>
        </div>

        {/* Lista de grupos o estado vacío */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Cargando grupos...
          </div>
        ) : grupos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</div>
            <p style={{ marginBottom: 16 }}>Aún no perteneces a ningún grupo</p>
            <button onClick={() => setModalCrear(true)} style={{
              background: 'var(--gold)', color: '#1A0A3C',
              border: 'none', borderRadius: 10,
              padding: '10px 24px', fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer',
            }}>
              + Crear grupo
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grupos.map(grupo => (
              <div key={grupo.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget).style.borderColor = 'var(--purple-light)'}
                onMouseLeave={e => (e.currentTarget).style.borderColor = 'var(--card-border)'}
              >
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{grupo.nombre}</div>
                  {grupo.premio && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>
                      🏆 {grupo.premio}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    Código: <strong style={{ color: 'var(--white)' }}>{grupo.codigo_invitacion}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--purple-light)' }}>
                    Ver grupo →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear grupo */}
      {modalCrear && (
        <ModalCrearGrupo
          onClose={() => setModalCrear(false)}
          onCreado={cargarGrupos}
        />
      )}
    </div>
  );
}
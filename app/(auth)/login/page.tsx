// app/(auth)/login/page.tsx
// crafted by JR ♥  |  fix: hydrate al montar + redirect si ya autenticado

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, hydrate, hydrated, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hidratar y redirigir si ya hay sesión activa
  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [hydrated, isAuthenticated]);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      setAuth(user, access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const detail = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(typeof detail === 'string' ? detail : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{
        position: 'fixed', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(124,79,224,0.2) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)',
        padding: '40px 36px',
        width: '100%', maxWidth: 420,
        position: 'relative',
      }}>
        <div style={{
          textAlign: 'center', marginBottom: 32,
          fontFamily: 'var(--font-display, Syne, sans-serif)',
          fontSize: '1.8rem', fontWeight: 800,
        }}>
          Win<span style={{ color: 'var(--gold)' }}>★</span>Predict
        </div>

        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
          Bienvenido de vuelta
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: 32 }}>
          Ingresa a tu cuenta para continuar
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--card-border)',
              borderRadius: 10, color: 'var(--white)',
              fontSize: '0.95rem', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--card-border)',
              borderRadius: 10, color: 'var(--white)',
              fontSize: '0.95rem', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--purple-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

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

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: 14,
            background: loading ? 'var(--card-border)' : 'var(--gold)',
            color: '#1A0A3C', border: 'none',
            borderRadius: 10, fontWeight: 700,
            fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: 'var(--purple-light)', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
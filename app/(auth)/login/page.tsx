// app/(auth)/login/page.tsx
// Inicio de sesión — validación por campo (sin política estricta en contraseña)
// crafted by JR ♥

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import { authInputStyle, fieldErrorStyle } from '@/components/auth/PasswordFieldWithPolicy';
import { validateEmailField, validateLoginPasswordField } from '@/lib/authFormValidation';
import { getApiErrorMessage } from '@/lib/errors';
import { GOLD } from '@/lib/brand';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordUpdated = searchParams.get('msg') === 'password_updated';
  const successMessage = searchParams.get('message');
  const { setAuth, hydrate, hydrated, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [hydrated, isAuthenticated, router]);

  const validateForm = (): boolean => {
    const eErr = validateEmailField(email);
    const pErr = validateLoginPasswordField(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setTouched({ email: true, password: true });
    return !eErr && !pErr;
  };

  const handleLogin = async () => {
    setError('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      setAuth(user, access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '24px',
      }}
    >
      <div
        style={{
          position: 'fixed',
          width: 600,
          height: 600,
          background:
            'radial-gradient(circle, rgba(124,79,224,0.2) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '40px 36px',
          width: '100%',
          maxWidth: 420,
          position: 'relative',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 32,
            fontFamily: 'var(--font-display, Syne, sans-serif)',
            fontSize: '1.8rem',
            fontWeight: 800,
          }}
        >
          Win<span style={{ color: 'var(--gold)' }}>★</span>Predict
        </div>

        <h1
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          Bienvenido de vuelta
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Ingresa a tu cuenta para continuar
        </p>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) setEmailError(validateEmailField(e.target.value));
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, email: true }));
              setEmailError(validateEmailField(email));
            }}
            placeholder="tu@correo.com"
            style={{
              ...authInputStyle,
              borderColor: touched.email && emailError ? 'rgba(255,80,80,0.5)' : undefined,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-light)';
            }}
            aria-invalid={!!emailError}
          />
          {touched.email && emailError && (
            <p style={fieldErrorStyle} role="alert">
              {emailError}
            </p>
          )}
        </div>

        {passwordUpdated && (
          <div
            style={{
              background: 'rgba(193, 164, 97, 0.12)',
              border: '1px solid rgba(193, 164, 97, 0.35)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: GOLD,
              marginBottom: 16,
            }}
            role="status"
          >
            {successMessage || 'Contraseña actualizada. Ya puedes iniciar sesión.'}
          </div>
        )}

        <div style={{ marginBottom: 8 }}>
          <label
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) {
                setPasswordError(validateLoginPasswordField(e.target.value));
              }
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }));
              setPasswordError(validateLoginPasswordField(password));
            }}
            placeholder="Tu contraseña"
            style={{
              ...authInputStyle,
              borderColor:
                touched.password && passwordError ? 'rgba(255,80,80,0.5)' : undefined,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-light)';
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            aria-invalid={!!passwordError}
          />
          {touched.password && passwordError && (
            <p style={fieldErrorStyle} role="alert">
              {passwordError}
            </p>
          )}
          <p style={{ textAlign: 'right', marginTop: 8, marginBottom: 0 }}>
            <Link
              href="/forgot-password"
              style={{
                fontSize: '0.8rem',
                color: 'var(--purple-light)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: '#ff6b6b',
              marginBottom: 16,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            background: loading ? 'var(--card-border)' : 'var(--gold)',
            color: '#1A0A3C',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
          }}
        >
          ¿No tienes cuenta?{' '}
          <Link
            href="/register"
            style={{
              color: 'var(--purple-light)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

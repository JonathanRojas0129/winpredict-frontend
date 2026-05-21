// app/forgot-password/page.tsx
// Paso 1: verificar email en BD y redirigir con JWT temporal (sin correo)

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { authInputStyle, fieldErrorStyle } from '@/components/auth/PasswordFieldWithPolicy';
import { validateEmailField } from '@/lib/authFormValidation';
import { getApiErrorMessage } from '@/lib/errors';
import { ERROR_RED, primaryButtonStyle } from '@/lib/brand';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineMessage, setInlineMessage] = useState('');

  const handleSubmit = async () => {
    const err = validateEmailField(email);
    setEmailError(err);
    setTouched(true);
    setInlineMessage('');
    if (err) return;

    setLoading(true);
    try {
      const { data } = await api.post<{
        reset_token?: string;
        google?: boolean;
        message?: string;
      }>('/auth/forgot-password', { email: email.trim() });

      if (data.google) {
        setInlineMessage(
          data.message ||
            'Esta cuenta usa Google. Ingresa con el botón Continuar con Google.',
        );
        return;
      }

      if (data.reset_token) {
        router.push(
          `/reset-password?token=${encodeURIComponent(data.reset_token)}`,
        );
        return;
      }
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { detail?: string } } };
      if (ax.response?.status === 404) {
        setInlineMessage(
          ax.response.data?.detail || 'No encontramos una cuenta con ese correo.',
        );
        return;
      }
      setInlineMessage(getApiErrorMessage(err, 'Ocurrió un error al procesar tu solicitud.'));
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
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '40px 36px',
          width: '100%',
          maxWidth: 420,
        }}
      >
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          Recuperar contraseña
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Ingresa el correo de tu cuenta local para continuar con el restablecimiento.
        </p>

        <div style={{ marginBottom: 20 }}>
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
              if (touched) setEmailError(validateEmailField(e.target.value));
              setInlineMessage('');
            }}
            onBlur={() => {
              setTouched(true);
              setEmailError(validateEmailField(email));
            }}
            placeholder="tu@correo.com"
            style={{
              ...authInputStyle,
              borderColor: touched && emailError ? 'rgba(255,80,80,0.5)' : undefined,
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {touched && emailError && (
            <p style={fieldErrorStyle} role="alert">
              {emailError}
            </p>
          )}
        </div>

        {inlineMessage && (
          <div
            style={{
              background: 'rgba(255,80,80,0.1)',
              border: `1px solid rgba(255,80,80,0.3)`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: ERROR_RED,
              marginBottom: 16,
            }}
            role="alert"
          >
            {inlineMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...primaryButtonStyle,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Verificando...' : 'Continuar'}
        </button>

        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
          }}
        >
          <Link
            href="/login"
            style={{ color: 'var(--purple-light)', fontWeight: 600, textDecoration: 'none' }}
          >
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

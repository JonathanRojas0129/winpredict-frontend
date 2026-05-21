// app/(auth)/register/page.tsx
// Registro con política de contraseñas robusta (componente reutilizable)
// crafted by JR ♥

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import PasswordFieldWithPolicy, {
  authInputStyle,
  fieldErrorStyle,
  syncPasswordFieldErrors,
} from '@/components/auth/PasswordFieldWithPolicy';
import {
  validateEmailField,
  validateNombreField,
  validatePolicyPasswordField,
} from '@/lib/authFormValidation';
import { getApiErrorMessage } from '@/lib/errors';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [nombreError, setNombreError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState({
    nombre: false,
    email: false,
    password: false,
  });

  const validateForm = (): boolean => {
    const nErr = validateNombreField(nombre);
    const eErr = validateEmailField(email);
    const pErrs = validatePolicyPasswordField(password);

    setNombreError(nErr);
    setEmailError(eErr);
    setPasswordErrors(pErrs);
    setTouched({ nombre: true, email: true, password: true });

    return !nErr && !eErr && pErrs.length === 0;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post('/auth/registro', { nombre, email, password });
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      setAuth(user, access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al registrarse'));
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
            fontFamily: 'Syne, sans-serif',
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
          Crea tu cuenta gratis
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Únete y empieza a pronosticar el Mundial 2026
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
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (touched.nombre) setNombreError(validateNombreField(e.target.value));
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, nombre: true }));
              setNombreError(validateNombreField(nombre));
            }}
            placeholder="Tu nombre"
            style={{
              ...authInputStyle,
              borderColor: touched.nombre && nombreError ? 'rgba(255,80,80,0.5)' : undefined,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-light)';
            }}
          />
          {touched.nombre && nombreError && (
            <p style={fieldErrorStyle} role="alert">
              {nombreError}
            </p>
          )}
        </div>

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
          />
          {touched.email && emailError && (
            <p style={fieldErrorStyle} role="alert">
              {emailError}
            </p>
          )}
        </div>

        <PasswordFieldWithPolicy
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (touched.password) setPasswordErrors(syncPasswordFieldErrors(v, true));
          }}
          touched={touched.password}
          onBlur={() => {
            setTouched((t) => ({ ...t, password: true }));
            setPasswordErrors(syncPasswordFieldErrors(password, true));
          }}
          errors={passwordErrors}
          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
        />

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
          onClick={handleRegister}
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
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>

        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
          }}
        >
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            style={{
              color: 'var(--purple-light)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

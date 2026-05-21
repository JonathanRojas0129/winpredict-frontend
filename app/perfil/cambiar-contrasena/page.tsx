// app/perfil/cambiar-contrasena/page.tsx
// Cambio de contraseña — misma política que registro
// crafted by JR ♥

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import BottomNav from '@/components/layout/BottomNav';
import PasswordFieldWithPolicy, {
  authInputStyle,
  fieldErrorStyle,
  syncPasswordFieldErrors,
} from '@/components/auth/PasswordFieldWithPolicy';
import {
  validateLoginPasswordField,
  validatePasswordConfirm,
  validatePolicyPasswordField,
} from '@/lib/authFormValidation';
import { getApiErrorMessage } from '@/lib/errors';

export default function CambiarContrasenaPage() {
  const router = useRouter();
  const { hydrated, isAuthenticated, hydrate } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentError, setCurrentError] = useState('');
  const [newErrors, setNewErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState('');
  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.push('/login');
  }, [hydrated, isAuthenticated, router]);

  const validateForm = (): boolean => {
    const curErr = validateLoginPasswordField(currentPassword);
    const newErrs = validatePolicyPasswordField(newPassword);
    const confErr = validatePasswordConfirm(newPassword, confirmPassword);

    setCurrentError(curErr);
    setNewErrors(newErrs);
    setConfirmError(confErr);
    setTouched({ current: true, new: true, confirm: true });

    return !curErr && newErrs.length === 0 && !confErr;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.patch('/auth/cambiar-contrasena', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTouched({ current: false, new: false, confirm: false });
      setTimeout(() => router.push('/perfil'), 1500);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar la contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Cargando...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '20px',
        paddingBottom: 96,
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <Link
        href="/perfil"
        style={{
          display: 'inline-block',
          marginBottom: 20,
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          textDecoration: 'none',
        }}
      >
        ← Volver al perfil
      </Link>

      <h1
        style={{
          fontFamily: 'var(--font-display, Syne, sans-serif)',
          fontSize: '1.25rem',
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        Cambiar contraseña
      </h1>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        Tu nueva contraseña debe cumplir la misma política de seguridad que al registrarte.
      </p>

      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '24px 20px',
        }}
      >
        {/* Contraseña actual — sin política (puede ser antigua) */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Contraseña actual
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (touched.current) setCurrentError(validateLoginPasswordField(e.target.value));
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, current: true }));
              setCurrentError(validateLoginPasswordField(currentPassword));
            }}
            placeholder="Tu contraseña actual"
            style={{
              ...authInputStyle,
              borderColor: touched.current && currentError ? 'rgba(255,80,80,0.5)' : undefined,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-light)';
            }}
          />
          {touched.current && currentError && (
            <p style={fieldErrorStyle} role="alert">
              {currentError}
            </p>
          )}
        </div>

        <PasswordFieldWithPolicy
          id="new-password"
          label="Nueva contraseña"
          value={newPassword}
          onChange={(v) => {
            setNewPassword(v);
            if (touched.new) setNewErrors(syncPasswordFieldErrors(v, true));
            if (touched.confirm) {
              setConfirmError(validatePasswordConfirm(v, confirmPassword));
            }
          }}
          touched={touched.new}
          onBlur={() => {
            setTouched((t) => ({ ...t, new: true }));
            setNewErrors(syncPasswordFieldErrors(newPassword, true));
          }}
          errors={newErrors}
          marginBottom={16}
        />

        {/* Confirmación */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Confirmar nueva contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (touched.confirm) {
                setConfirmError(validatePasswordConfirm(newPassword, e.target.value));
              }
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, confirm: true }));
              setConfirmError(validatePasswordConfirm(newPassword, confirmPassword));
            }}
            placeholder="Repite la nueva contraseña"
            style={{
              ...authInputStyle,
              borderColor: touched.confirm && confirmError ? 'rgba(255,80,80,0.5)' : undefined,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple-light)';
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {touched.confirm && confirmError && (
            <p style={fieldErrorStyle} role="alert">
              {confirmError}
            </p>
          )}
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

        {success && (
          <div
            style={{
              background: 'rgba(76,175,80,0.1)',
              border: '1px solid rgba(76,175,80,0.35)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: '#4caf50',
              marginBottom: 16,
            }}
            role="status"
          >
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
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
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

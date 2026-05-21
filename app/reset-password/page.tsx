// app/reset-password/page.tsx
// Paso 2: validar JWT temporal y establecer nueva contraseña (sin email ni Supabase recovery)

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import PasswordFieldWithPolicy, {
  syncPasswordFieldErrors,
} from '@/components/auth/PasswordFieldWithPolicy';
import { authInputStyle, fieldErrorStyle } from '@/components/auth/PasswordFieldWithPolicy';
import {
  validatePasswordConfirm,
  validatePolicyPasswordField,
} from '@/lib/authFormValidation';
import { validatePassword } from '@/lib/passwordValidation';
import { getApiErrorMessage } from '@/lib/errors';
import { ERROR_RED, primaryButtonStyle } from '@/lib/brand';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Token solo en memoria (desde query param al montar, sin localStorage)
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [accountEmail, setAccountEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newErrors, setNewErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);
  const policyOk = passwordValidation.isValid;

  const confirmMismatch = useMemo(() => {
    if (!confirmPassword) return '';
    return validatePasswordConfirm(newPassword, confirmPassword);
  }, [newPassword, confirmPassword]);

  const showConfirmError = confirmPassword.length > 0 && !!confirmMismatch;
  const canSubmit = policyOk && !confirmMismatch && confirmPassword.length > 0;

  useEffect(() => {
    const raw = searchParams.get('token');
    if (!raw) {
      setTokenValid(false);
      return;
    }
    setResetToken(raw);

    api
      .get<{ valid: boolean; email: string }>('/auth/validate-reset-token', {
        params: { token: raw },
      })
      .then((res) => {
        setTokenValid(true);
        setAccountEmail(res.data.email);
      })
      .catch(() => {
        setTokenValid(false);
      });
  }, [searchParams]);

  const handleSubmit = async () => {
    const policyErrors = validatePolicyPasswordField(newPassword);
    const confErr = validatePasswordConfirm(newPassword, confirmPassword);

    setNewErrors(policyErrors);
    setTouched({ new: true, confirm: true });
    setError('');

    if (policyErrors.length > 0 || confErr || !resetToken) return;

    setLoading(true);
    try {
      const { data } = await api.post<{ message: string }>('/auth/reset-password', {
        token: resetToken,
        new_password: newPassword,
      });

      router.push(`/login?msg=password_updated&message=${encodeURIComponent(data.message)}`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar la contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text-muted)',
        }}
      >
        Verificando enlace...
      </div>
    );
  }

  if (tokenValid === false) {
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
            textAlign: 'center',
          }}
        >
          <p style={{ color: ERROR_RED, marginBottom: 24, lineHeight: 1.5 }}>
            El enlace expiró. Solicita uno nuevo.
          </p>
          <Link href="/forgot-password">
            <button type="button" style={primaryButtonStyle}>
              Volver a recuperar contraseña
            </button>
          </Link>
        </div>
      </div>
    );
  }

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
          Nueva contraseña
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {accountEmail
            ? `Cuenta: ${accountEmail}`
            : 'Elige una contraseña segura para tu cuenta.'}
        </p>

        <PasswordFieldWithPolicy
          id="new-password-reset"
          label="Nueva contraseña"
          value={newPassword}
          onChange={(v) => {
            setNewPassword(v);
            if (touched.new) setNewErrors(syncPasswordFieldErrors(v, true));
          }}
          touched={touched.new}
          onBlur={() => {
            setTouched((t) => ({ ...t, new: true }));
            setNewErrors(syncPasswordFieldErrors(newPassword, true));
          }}
          errors={newErrors}
          marginBottom={16}
        />

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
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            placeholder="Repite la nueva contraseña"
            style={{
              ...authInputStyle,
              borderColor: showConfirmError ? 'rgba(255,80,80,0.5)' : undefined,
            }}
          />
          {showConfirmError && (
            <p style={fieldErrorStyle} role="alert">
              {confirmMismatch}
            </p>
          )}
        </div>

        {error && (
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
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          style={{
            ...primaryButtonStyle,
            opacity: loading || !canSubmit ? 0.7 : 1,
            cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </div>
    </div>
  );
}

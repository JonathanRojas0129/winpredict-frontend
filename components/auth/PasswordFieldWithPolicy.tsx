'use client';

/**
 * Campo de contraseña reutilizable con política robusta, fortaleza y errores por regla.
 * Usar en registro y cambio de contraseña (no en login: ahí solo se verifica credencial).
 */

import { useMemo } from 'react';
import PasswordStrength from '@/components/PasswordStrength';
import { validatePassword } from '@/lib/passwordValidation';

export const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#ff6b6b',
  marginTop: 6,
  lineHeight: 1.4,
};

export const authInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--card-border)',
  borderRadius: 10,
  color: 'var(--white)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

interface PasswordFieldWithPolicyProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  touched: boolean;
  onBlur: () => void;
  errors: string[];
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  marginBottom?: number;
}

export default function PasswordFieldWithPolicy({
  id = 'password',
  label = 'Contraseña',
  value,
  onChange,
  touched,
  onBlur,
  errors,
  placeholder = 'Mín. 8 caracteres, mayúscula, número y especial',
  onKeyDown,
  marginBottom = 24,
}: PasswordFieldWithPolicyProps) {
  const validation = useMemo(() => validatePassword(value), [value]);
  const hasErrors = touched && errors.length > 0;

  return (
    <div style={{ marginBottom }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          display: 'block',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          ...authInputStyle,
          borderColor: hasErrors ? 'rgba(255,80,80,0.5)' : undefined,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--purple-light)';
        }}
        onKeyDown={onKeyDown}
        aria-invalid={hasErrors}
        aria-describedby={`${id}-requirements`}
      />

      <PasswordStrength validation={validation} password={value} />

      {hasErrors && (
        <div id={`${id}-requirements`} style={{ marginTop: 8 }}>
          {errors.map((msg) => (
            <p key={msg} style={fieldErrorStyle} role="alert">
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Sincroniza errores de política al escribir o al salir del campo */
export function syncPasswordFieldErrors(
  password: string,
  touched: boolean,
  emptyMessage = 'La contraseña es obligatoria.',
): string[] {
  if (!touched) return [];
  if (!password) return [emptyMessage];
  return validatePassword(password).failedMessages;
}

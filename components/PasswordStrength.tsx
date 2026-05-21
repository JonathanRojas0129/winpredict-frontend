'use client';

/**
 * Indicador visual de fortaleza de contraseña (4 niveles).
 * Colores del sistema: Midnight Blue #1A2238 y Gold #C1A461.
 */

import {
  getPasswordStrengthLevel,
  getStrengthLabel,
  type PasswordStrengthLevel,
  type PasswordValidationResult,
} from '@/lib/passwordValidation';

const MIDNIGHT_BLUE = '#1A2238';
const GOLD = '#C1A461';

/** Configuración visual por nivel de fortaleza */
const LEVEL_CONFIG: Record<
  PasswordStrengthLevel,
  { bars: number; barColor: string; labelColor: string }
> = {
  debil: { bars: 1, barColor: '#E57373', labelColor: '#E57373' },
  regular: { bars: 2, barColor: '#FFB74D', labelColor: '#FFB74D' },
  fuerte: { bars: 3, barColor: GOLD, labelColor: GOLD },
  muy_fuerte: { bars: 4, barColor: GOLD, labelColor: GOLD },
};

interface PasswordStrengthProps {
  /** Resultado de validatePassword() para la contraseña actual */
  validation: PasswordValidationResult;
  password: string;
}

export default function PasswordStrength({
  validation,
  password,
}: PasswordStrengthProps) {
  // Sin texto si el campo está vacío
  if (!password) return null;

  const level = getPasswordStrengthLevel(validation.score, password.length);
  const config = LEVEL_CONFIG[level];
  const label = getStrengthLabel(level);

  return (
    <div
      style={{
        marginTop: 10,
        paddingLeft: 10,
        borderLeft: `3px solid ${MIDNIGHT_BLUE}`,
      }}
      aria-live="polite"
    >
      {/* Barra de progreso con 4 segmentos */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 8,
        }}
        role="meter"
        aria-valuenow={config.bars}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Fortaleza de contraseña: ${label}`}
      >
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background:
                segment <= config.bars
                  ? config.barColor
                  : 'rgba(193, 164, 97, 0.2)',
              transition: 'background 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Etiqueta del nivel */}
      <p
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: config.labelColor,
          margin: 0,
        }}
      >
        Fortaleza: {label}
      </p>

      {/* Lista de requisitos con estado por regla */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '10px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {validation.rules.map((rule) => (
          <li
            key={rule.key}
            style={{
              fontSize: '0.72rem',
              color: rule.passed ? GOLD : 'rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <span style={{ color: rule.passed ? GOLD : '#E57373', flexShrink: 0 }}>
              {rule.passed ? '✓' : '○'}
            </span>
            <span>{rule.message}</span>
          </li>
        ))}
      </ul>

    </div>
  );
}

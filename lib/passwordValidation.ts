/**
 * Política de contraseñas — validación reutilizable en tiempo real (sin librerías externas).
 * Reglas alineadas con el backend (app/core/password_policy.py).
 */

/** Longitud mínima exigida */
export const MIN_PASSWORD_LENGTH = 8;

/** Expresión para detectar al menos un carácter especial permitido */
const SPECIAL_CHARS_REGEX = /[@#!$%&*-]/;

/** Identificadores de cada regla de la política */
export type PasswordRuleKey =
  | 'min_length'
  | 'uppercase'
  | 'lowercase'
  | 'digit'
  | 'special'
  | 'no_spaces';

/** Resultado de evaluar una regla individual */
export interface PasswordRuleResult {
  key: PasswordRuleKey;
  passed: boolean;
  message: string;
}

/** Resultado completo de la validación de contraseña */
export interface PasswordValidationResult {
  isValid: boolean;
  rules: PasswordRuleResult[];
  /** Mensajes solo de reglas que fallan (para mostrar bajo el campo) */
  failedMessages: string[];
  /** Mapa regla → mensaje de error o null si cumple */
  errorsByRule: Record<PasswordRuleKey, string | null>;
  /** Cantidad de reglas cumplidas (0–6), usada por PasswordStrength */
  score: number;
}

/** Mensajes de error en español, uno por regla */
const ERROR_MESSAGES: Record<PasswordRuleKey, string> = {
  min_length: 'La contraseña debe tener al menos 8 caracteres.',
  uppercase: 'La contraseña debe incluir al menos una letra mayúscula (A-Z).',
  lowercase: 'La contraseña debe incluir al menos una letra minúscula (a-z).',
  digit: 'La contraseña debe incluir al menos un número (0-9).',
  special:
    'La contraseña debe incluir al menos un carácter especial (@, #, !, $, %, &, *, -).',
  no_spaces: 'La contraseña no puede contener espacios en blanco.',
};

/** Orden fijo de reglas para UI consistente */
const RULE_ORDER: PasswordRuleKey[] = [
  'min_length',
  'uppercase',
  'lowercase',
  'digit',
  'special',
  'no_spaces',
];

/**
 * Evalúa si la contraseña cumple una regla concreta.
 */
function evaluateRule(password: string, key: PasswordRuleKey): boolean {
  switch (key) {
    case 'min_length':
      return password.length >= MIN_PASSWORD_LENGTH;
    case 'uppercase':
      return /[A-Z]/.test(password);
    case 'lowercase':
      return /[a-z]/.test(password);
    case 'digit':
      return /[0-9]/.test(password);
    case 'special':
      return SPECIAL_CHARS_REGEX.test(password);
    case 'no_spaces':
      return !/[\s]/.test(password);
    default:
      return false;
  }
}

/**
 * Valida la contraseña contra todas las reglas en tiempo real.
 * Devuelve estado por regla y mensajes específicos de las que fallan.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const rules: PasswordRuleResult[] = RULE_ORDER.map((key) => {
    const passed = password.length === 0 ? false : evaluateRule(password, key);
    return {
      key,
      passed,
      message: ERROR_MESSAGES[key],
    };
  });

  const failedMessages = rules.filter((r) => !r.passed).map((r) => r.message);

  const errorsByRule = RULE_ORDER.reduce(
    (acc, key) => {
      const rule = rules.find((r) => r.key === key)!;
      acc[key] = rule.passed ? null : rule.message;
      return acc;
    },
    {} as Record<PasswordRuleKey, string | null>,
  );

  const score = rules.filter((r) => r.passed).length;

  return {
    isValid: password.length > 0 && failedMessages.length === 0,
    rules,
    failedMessages,
    errorsByRule,
    score,
  };
}

/** Niveles de fortaleza visual (4 escalones) */
export type PasswordStrengthLevel = 'debil' | 'regular' | 'fuerte' | 'muy_fuerte';

const STRENGTH_LABELS: Record<PasswordStrengthLevel, string> = {
  debil: 'Débil',
  regular: 'Regular',
  fuerte: 'Fuerte',
  muy_fuerte: 'Muy fuerte',
};

/**
 * Calcula el nivel de fortaleza según reglas cumplidas.
 * - 0–1 reglas: débil
 * - 2–3 reglas: regular
 * - 4–5 reglas: fuerte
 * - 6 reglas: muy fuerte
 */
export function getPasswordStrengthLevel(
  score: number,
  passwordLength: number,
): PasswordStrengthLevel {
  if (passwordLength === 0) return 'debil';
  if (score <= 1) return 'debil';
  if (score <= 3) return 'regular';
  if (score <= 5) return 'fuerte';
  return 'muy_fuerte';
}

/** Etiqueta en español del nivel de fortaleza */
export function getStrengthLabel(level: PasswordStrengthLevel): string {
  return STRENGTH_LABELS[level];
}

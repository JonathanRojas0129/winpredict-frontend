/**
 * Validaciones de formularios de autenticación (sin librerías externas).
 * Login: solo campos obligatorios (no bloquea cuentas con contraseña antigua).
 * Registro / cambio: política robusta vía validatePassword.
 */

import { validatePassword } from '@/lib/passwordValidation';

/** Valida correo para login o registro */
export function validateEmailField(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return 'El correo electrónico es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Ingresa un correo electrónico válido.';
  }
  return '';
}

/** Valida nombre en registro */
export function validateNombreField(nombre: string): string {
  if (!nombre.trim()) return 'El nombre es obligatorio.';
  return '';
}

/** Contraseña en login: solo que no esté vacía */
export function validateLoginPasswordField(password: string): string {
  if (!password) return 'La contraseña es obligatoria.';
  return '';
}

/** Contraseña con política robusta (registro / nueva contraseña) */
export function validatePolicyPasswordField(password: string): string[] {
  if (!password) return ['La contraseña es obligatoria.'];
  return validatePassword(password).failedMessages;
}

/** Confirma que ambas contraseñas coinciden */
export function validatePasswordConfirm(
  password: string,
  confirm: string,
): string {
  if (!confirm) return 'Debes confirmar la nueva contraseña.';
  if (password !== confirm) return 'Las contraseñas no coinciden.';
  return '';
}

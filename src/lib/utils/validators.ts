/**
 * Petits validateurs réutilisables (le gros de la validation passe par zod
 * dans les formulaires).
 */

import { VALIDATION } from "@/lib/constants";

export const isValidEmail = (email: string): boolean =>
  VALIDATION.EMAIL_REGEX.test(email.trim());

export const isValidPassword = (password: string): boolean =>
  password.length >= VALIDATION.PASSWORD_MIN_LENGTH;

/** Numéro local : chiffres, espaces et séparateurs uniquement. */
export const isValidPhone = (phone: string): boolean =>
  /^[0-9\s.\-()]{5,20}$/.test(phone.trim());

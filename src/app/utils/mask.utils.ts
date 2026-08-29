/**
 * Utility functions for input formatting and masking
 */

/**
 * Formats a Brazilian CPF: 000.000.000-00
 */
export function formatCpf(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d+)/, '$1.$2');
  }
  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
}

/**
 * Formats Brazilian Phone / Mobile: (00) 0000-0000 or (00) 00000-0000
 */
export function formatPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return digits.replace(/(\d{2})(\d+)/, '($1) $2');
  }
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

/**
 * Formats Brazilian License Plates (supports both Old Brazilian AAA-9999 and Mercosul AAA9A99 / AAA-9A99)
 * - Mercosul: 3 letters, 1 digit, 1 letter, 2 digits (e.g. BRA2E19 or BRA-2E19)
 * - Old Standard: 3 letters, 4 digits (e.g. ABC-1234)
 */
export function formatPlate(value: string): string {
  if (!value) return '';
  // Extract alphanumeric characters only, uppercase, max 7 chars
  let raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

  // If 3 or fewer characters, return them uppercase (letters)
  if (raw.length <= 3) {
    // Only allow letters in first 3 positions
    return raw.replace(/[^A-Z]/g, '');
  }

  // Format with hyphen after 3 letters: AAA-9999 or AAA-9A99
  const prefix = raw.slice(0, 3).replace(/[^A-Z]/g, '');
  const suffix = raw.slice(3);

  if (prefix.length === 3) {
    return `${prefix}-${suffix}`;
  }

  return raw;
}

/**
 * Formats pure numeric string (removes all non-digit characters)
 */
export function formatOnlyNumbers(value: string, maxLength?: number): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

// src/utils/securityUtils.ts
/**
 * Sanitizes input to prevent XSS by escaping HTML characters and trimming whitespace.
 * @param input - The input string to sanitize
 * @returns Sanitized string or empty string if input is falsy
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validates an email address using a strict regex compatible with Firebase Auth.
 * @param email - The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(sanitizeInput(email));
};

/**
 * Validates a phone number by normalizing input and checking E.164 format.
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  // Normalize: remove spaces, dashes, parentheses, keep +
  const normalized = phone.replace(/[\s()-]/g, '');
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(normalized);
};
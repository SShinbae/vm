/**
 * Validation utilities for authentication forms
 * Security improvements for email and password validation
 */

/**
 * Validate email format using proper regex
 * Prevents invalid emails like "test@" or "@test"
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Password validation result interface
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

/**
 * Password requirement checks
 */
export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Check individual password requirements
 */
export const checkPasswordRequirements = (
  password: string,
): PasswordRequirements => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

/**
 * Validate password with full complexity requirements
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  const requirements = checkPasswordRequirements(password);

  if (!requirements.minLength) {
    errors.push("At least 8 characters");
  }
  if (!requirements.hasUppercase) {
    errors.push("One uppercase letter");
  }
  if (!requirements.hasLowercase) {
    errors.push("One lowercase letter");
  }
  if (!requirements.hasNumber) {
    errors.push("One number");
  }
  if (!requirements.hasSpecialChar) {
    errors.push('One special character (!@#$%^&*(),.?":{}|<>)');
  }

  // Calculate strength based on requirements met
  const metCount = Object.values(requirements).filter(Boolean).length;
  let strength: "weak" | "medium" | "strong" = "weak";

  if (metCount >= 5) {
    strength = "strong";
  } else if (metCount >= 3) {
    strength = "medium";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Get human-readable password requirement labels
 */
export const PASSWORD_REQUIREMENTS = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUppercase", label: "One uppercase letter (A-Z)" },
  { key: "hasLowercase", label: "One lowercase letter (a-z)" },
  { key: "hasNumber", label: "One number (0-9)" },
  { key: "hasSpecialChar", label: "One special character (!@#$%^&*)" },
] as const;

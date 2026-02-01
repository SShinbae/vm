/**
 * Auth form schemas with Zod validation
 */

import { z } from "zod";

/**
 * Password validation regex patterns
 */
const passwordPatterns = {
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

/**
 * Base password schema with security requirements
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or less")
  .refine((val) => passwordPatterns.hasUpperCase.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => passwordPatterns.hasLowerCase.test(val), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((val) => passwordPatterns.hasNumber.test(val), {
    message: "Password must contain at least one number",
  });

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

/**
 * Registration form schema
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .max(255, "Email must be 255 characters or less")
      .toLowerCase()
      .trim(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    fullName: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Full name must be 100 characters or less")
      .trim(),
    username: z
      .string()
      .max(50, "Username must be 50 characters or less")
      .trim()
      .optional()
      .or(z.literal("")),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Forgot password form schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .toLowerCase()
    .trim(),
});

/**
 * Reset password form schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Update password form schema (for logged-in users)
 */
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

/**
 * Types inferred from auth schemas
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

/**
 * Default values for auth forms
 */
export const loginDefaultValues: LoginFormData = {
  email: "",
  password: "",
};

export const registerDefaultValues: Omit<RegisterFormData, "acceptTerms"> & {
  acceptTerms: boolean;
} = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  username: "",
  acceptTerms: false,
};

export const forgotPasswordDefaultValues: ForgotPasswordFormData = {
  email: "",
};

export const resetPasswordDefaultValues: ResetPasswordFormData = {
  password: "",
  confirmPassword: "",
};

/**
 * Password strength calculator
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  level: "weak" | "fair" | "good" | "strong";
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Use at least 8 characters");

  if (password.length >= 12) score += 1;

  if (passwordPatterns.hasUpperCase.test(password)) score += 1;
  else feedback.push("Add an uppercase letter");

  if (passwordPatterns.hasLowerCase.test(password)) score += 1;
  else feedback.push("Add a lowercase letter");

  if (passwordPatterns.hasNumber.test(password)) score += 1;
  else feedback.push("Add a number");

  if (passwordPatterns.hasSpecialChar.test(password)) score += 1;
  else feedback.push("Add a special character (!@#$%...)");

  let level: "weak" | "fair" | "good" | "strong";
  if (score <= 2) level = "weak";
  else if (score <= 3) level = "fair";
  else if (score <= 4) level = "good";
  else level = "strong";

  return { score, level, feedback };
}

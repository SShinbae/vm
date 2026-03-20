/**
 * Auth Schema Tests
 *
 * Tests for Zod validation schemas and password utilities.
 */

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  calculatePasswordStrength,
  loginDefaultValues,
  registerDefaultValues,
  forgotPasswordDefaultValues,
  resetPasswordDefaultValues,
} from "@/src/shared/schemas/authSchema";

describe("loginSchema", () => {
  it("should validate correct email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("should reject invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("should lowercase email", () => {
    const result = loginSchema.safeParse({
      email: "USER@Example.COM",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("should reject email longer than 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    const result = loginSchema.safeParse({
      email: longEmail,
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });
});

describe("registerSchema", () => {
  const validData = {
    email: "user@example.com",
    password: "Abcdef1!",
    confirmPassword: "Abcdef1!",
    fullName: "John Doe",
    username: "johndoe",
    acceptTerms: true,
  };

  it("should validate correct full data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject password mismatch on confirmPassword path", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("confirmPassword");
    }
  });

  it("should reject password missing uppercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "abcdef1!",
      confirmPassword: "abcdef1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password missing lowercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "ABCDEF1!",
      confirmPassword: "ABCDEF1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password missing number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Abcdefg!",
      confirmPassword: "Abcdefg!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Ab1!",
      confirmPassword: "Ab1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password longer than 128 characters", () => {
    const longPw = "Aa1!" + "a".repeat(125);
    const result = registerSchema.safeParse({
      ...validData,
      password: longPw,
      confirmPassword: longPw,
    });
    expect(result.success).toBe(false);
  });

  it("should require fullName", () => {
    const result = registerSchema.safeParse({
      ...validData,
      fullName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("fullName");
    }
  });

  it("should reject fullName longer than 100 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      fullName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("fullName");
    }
  });

  it("should accept optional username as empty string", () => {
    const result = registerSchema.safeParse({
      ...validData,
      username: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept missing username", () => {
    const { username, ...rest } = validData;
    const result = registerSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("should require acceptTerms to be true", () => {
    const result = registerSchema.safeParse({
      ...validData,
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("acceptTerms");
    }
  });

  it("should lowercase email", () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: "USER@Example.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("should validate correct email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("should validate matching strong passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Abcdef1!",
      confirmPassword: "Abcdef1!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject password mismatch", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Abcdef1!",
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("confirmPassword");
    }
  });

  it("should reject weak password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePasswordSchema", () => {
  it("should validate correct data", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: "NewPass1!",
      confirmPassword: "NewPass1!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject when passwords do not match", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: "NewPass1!",
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("confirmPassword");
    }
  });

  it("should reject when new password equals current password", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "SamePass1!",
      newPassword: "SamePass1!",
      confirmPassword: "SamePass1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("newPassword");
    }
  });

  it("should require currentPassword", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "NewPass1!",
      confirmPassword: "NewPass1!",
    });
    expect(result.success).toBe(false);
  });
});

describe("calculatePasswordStrength", () => {
  it("should return score 0 and weak for empty string", () => {
    const result = calculatePasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.level).toBe("weak");
  });

  it("should return weak for short lowercase only", () => {
    const result = calculatePasswordStrength("abc");
    expect(result.level).toBe("weak");
  });

  it("should return fair for 8+ chars with upper and lower", () => {
    const result = calculatePasswordStrength("Abcdefgh");
    // score: length>=8(1), hasUpper(1), hasLower(1) = 3
    expect(result.level).toBe("fair");
  });

  it("should return good for 8+ chars with upper, lower, number", () => {
    const result = calculatePasswordStrength("Abcdefg1");
    // score: length>=8(1), hasUpper(1), hasLower(1), hasNumber(1) = 4
    expect(result.level).toBe("good");
  });

  it("should return strong for 12+ chars with all character types", () => {
    const result = calculatePasswordStrength("Abcdefghij1!");
    // score: length>=8(1), length>=12(1), hasUpper(1), hasLower(1), hasNumber(1), hasSpecial(1) = 6
    expect(result.level).toBe("strong");
  });

  it("should include correct feedback for missing requirements", () => {
    const result = calculatePasswordStrength("abc");
    expect(result.feedback).toContain("Use at least 8 characters");
    expect(result.feedback).toContain("Add an uppercase letter");
    expect(result.feedback).toContain("Add a number");
    expect(result.feedback).toContain("Add a special character (!@#$%...)");
  });

  it("should not include feedback for met requirements", () => {
    const result = calculatePasswordStrength("Abcdefghij1!");
    expect(result.feedback).toHaveLength(0);
  });
});

describe("default values", () => {
  it("loginDefaultValues should have empty email and password", () => {
    expect(loginDefaultValues.email).toBe("");
    expect(loginDefaultValues.password).toBe("");
  });

  it("registerDefaultValues should have empty fields and false acceptTerms", () => {
    expect(registerDefaultValues.email).toBe("");
    expect(registerDefaultValues.password).toBe("");
    expect(registerDefaultValues.confirmPassword).toBe("");
    expect(registerDefaultValues.fullName).toBe("");
    expect(registerDefaultValues.username).toBe("");
    expect(registerDefaultValues.acceptTerms).toBe(false);
  });

  it("forgotPasswordDefaultValues should have empty email", () => {
    expect(forgotPasswordDefaultValues.email).toBe("");
  });

  it("resetPasswordDefaultValues should have empty fields", () => {
    expect(resetPasswordDefaultValues.password).toBe("");
    expect(resetPasswordDefaultValues.confirmPassword).toBe("");
  });
});

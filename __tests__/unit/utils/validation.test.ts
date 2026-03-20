/**
 * Validation Utils Tests
 *
 * Tests for email and password validation utilities.
 */

import {
  isValidEmail,
  checkPasswordRequirements,
  validatePassword,
  PASSWORD_REQUIREMENTS,
} from "@/utils/validation";

describe("isValidEmail", () => {
  it("should return true for valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it('should return false for "test@"', () => {
    expect(isValidEmail("test@")).toBe(false);
  });

  it('should return false for "@test"', () => {
    expect(isValidEmail("@test")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("should trim whitespace before validating", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });

  it("should handle domain with multiple parts", () => {
    expect(isValidEmail("user@domain.co.uk")).toBe(true);
  });

  it('should return false for "user@.com"', () => {
    expect(isValidEmail("user@.com")).toBe(false);
  });

  it("should return true for minimal valid email", () => {
    expect(isValidEmail("a@b.c")).toBe(true);
  });
});

describe("checkPasswordRequirements", () => {
  it("should return all true for strong password", () => {
    const result = checkPasswordRequirements("Abcdef1!");
    expect(result.minLength).toBe(true);
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
  });

  it("should return minLength false for short password", () => {
    const result = checkPasswordRequirements("Ab1!");
    expect(result.minLength).toBe(false);
  });

  it("should return hasUppercase false for no uppercase", () => {
    const result = checkPasswordRequirements("abcdef1!");
    expect(result.hasUppercase).toBe(false);
  });

  it("should return hasLowercase false for no lowercase", () => {
    const result = checkPasswordRequirements("ABCDEF1!");
    expect(result.hasLowercase).toBe(false);
  });

  it("should return hasNumber false for no number", () => {
    const result = checkPasswordRequirements("Abcdefg!");
    expect(result.hasNumber).toBe(false);
  });

  it("should return hasSpecialChar false for no special char", () => {
    const result = checkPasswordRequirements("Abcdefg1");
    expect(result.hasSpecialChar).toBe(false);
  });
});

describe("validatePassword", () => {
  it("should return isValid true and strong for fully valid password", () => {
    const result = validatePassword("Abcdef1!");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.strength).toBe("strong");
  });

  it("should return 5 errors and weak for empty string", () => {
    const result = validatePassword("");
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(5);
    expect(result.strength).toBe("weak");
  });

  it("should return medium when 3 of 5 requirements met", () => {
    // "Abcdefgh" has minLength, hasUppercase, hasLowercase = 3/5
    const result = validatePassword("Abcdefgh");
    expect(result.strength).toBe("medium");
  });

  it("should return strong when all requirements met", () => {
    const result = validatePassword("Abcdef1!");
    expect(result.strength).toBe("strong");
  });

  it("should produce correct error for missing minLength", () => {
    const result = validatePassword("Ab1!");
    expect(result.errors).toContain("At least 8 characters");
  });

  it("should produce correct error for missing uppercase", () => {
    const result = validatePassword("abcdefg1!");
    expect(result.errors).toContain("One uppercase letter");
  });

  it("should produce correct error for missing lowercase", () => {
    const result = validatePassword("ABCDEFG1!");
    expect(result.errors).toContain("One lowercase letter");
  });

  it("should produce correct error for missing number", () => {
    const result = validatePassword("Abcdefgh!");
    expect(result.errors).toContain("One number");
  });

  it("should produce correct error for missing special char", () => {
    const result = validatePassword("Abcdefg1");
    expect(result.errors).toContain(
      'One special character (!@#$%^&*(),.?":{}|<>)',
    );
  });
});

describe("PASSWORD_REQUIREMENTS", () => {
  it("should have 5 entries", () => {
    expect(PASSWORD_REQUIREMENTS).toHaveLength(5);
  });

  it("each entry should have key and label", () => {
    for (const req of PASSWORD_REQUIREMENTS) {
      expect(req.key).toBeDefined();
      expect(req.label).toBeDefined();
      expect(typeof req.key).toBe("string");
      expect(typeof req.label).toBe("string");
    }
  });
});

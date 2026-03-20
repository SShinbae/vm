/**
 * Group Schema Tests
 *
 * Tests for Zod validation schemas.
 */

import {
  groupSchema,
  groupUpdateSchema,
  groupInviteSchema,
  groupDefaultValues,
  groupInviteDefaultValues,
} from "@/src/shared/schemas/groupSchema";

describe("groupSchema", () => {
  it("should validate correct name and description", () => {
    const result = groupSchema.safeParse({
      name: "Fleet Alpha",
      description: "Main fleet group",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = groupSchema.safeParse({
      name: "",
      description: "Some description",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("should reject name over 100 characters", () => {
    const result = groupSchema.safeParse({
      name: "A".repeat(101),
      description: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("should accept optional description as empty string", () => {
    const result = groupSchema.safeParse({
      name: "Fleet Alpha",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept missing description", () => {
    const result = groupSchema.safeParse({ name: "Fleet Alpha" });
    expect(result.success).toBe(true);
  });

  it("should reject description over 500 characters", () => {
    const result = groupSchema.safeParse({
      name: "Fleet Alpha",
      description: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("should trim whitespace", () => {
    const result = groupSchema.safeParse({
      name: "  Fleet Alpha  ",
      description: "  Some desc  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Fleet Alpha");
      expect(result.data.description).toBe("Some desc");
    }
  });
});

describe("groupUpdateSchema", () => {
  it("should accept all fields as optional", () => {
    const result = groupUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept partial updates", () => {
    const result = groupUpdateSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });
});

describe("groupInviteSchema", () => {
  it("should validate correct email", () => {
    const result = groupInviteSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = groupInviteSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("should lowercase email", () => {
    const result = groupInviteSchema.safeParse({
      email: "USER@Example.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("should reject email over 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    const result = groupInviteSchema.safeParse({ email: longEmail });
    expect(result.success).toBe(false);
  });
});

describe("default values", () => {
  it("groupDefaultValues should have empty name and description", () => {
    expect(groupDefaultValues.name).toBe("");
    expect(groupDefaultValues.description).toBe("");
  });

  it("groupInviteDefaultValues should have empty email", () => {
    expect(groupInviteDefaultValues.email).toBe("");
  });
});

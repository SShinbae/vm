/**
 * Group form schema with Zod validation
 */

import { z } from "zod";

/**
 * Schema for creating a new group
 */
export const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or less")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for updating a group
 */
export const groupUpdateSchema = groupSchema.partial();

/**
 * Schema for inviting a member to a group
 */
export const groupInviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .toLowerCase()
    .trim(),
});

/**
 * Type inferred from the group schema
 */
export type GroupFormData = z.infer<typeof groupSchema>;
export type GroupUpdateFormData = z.infer<typeof groupUpdateSchema>;
export type GroupInviteFormData = z.infer<typeof groupInviteSchema>;

/**
 * Default values for group form
 */
export const groupDefaultValues: GroupFormData = {
  name: "",
  description: "",
};

/**
 * Default values for group invite form
 */
export const groupInviteDefaultValues: GroupInviteFormData = {
  email: "",
};

/**
 * Vehicle form schema with Zod validation
 */

import { z } from "zod";

const currentYear = new Date().getFullYear();

/**
 * Schema for creating a new vehicle
 */
export const vehicleSchema = z.object({
  make: z
    .string()
    .min(1, "Make is required")
    .max(50, "Make must be 50 characters or less")
    .trim(),
  model: z
    .string()
    .min(1, "Model is required")
    .max(50, "Model must be 50 characters or less")
    .trim(),
  year: z
    .number({ message: "Year is required" })
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .max(currentYear + 1, `Year cannot be more than ${currentYear + 1}`),
  license_plate: z
    .string()
    .min(1, "License plate is required")
    .max(20, "License plate must be 20 characters or less")
    .trim()
    .toUpperCase(),
  vin: z
    .string()
    .max(17, "VIN must be 17 characters or less")
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .max(30, "Color must be 30 characters or less")
    .trim()
    .optional()
    .or(z.literal("")),
  main_image_url: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for updating a vehicle (all fields optional)
 */
export const vehicleUpdateSchema = vehicleSchema.partial();

/**
 * Type inferred from the vehicle schema
 */
export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type VehicleUpdateFormData = z.infer<typeof vehicleUpdateSchema>;

/**
 * Default values for vehicle form
 */
export const vehicleDefaultValues: VehicleFormData = {
  make: "",
  model: "",
  year: currentYear,
  license_plate: "",
  vin: "",
  color: "",
};

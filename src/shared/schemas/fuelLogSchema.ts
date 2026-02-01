/**
 * Fuel log form schema with Zod validation
 */

import { z } from "zod";

/**
 * Schema for creating a new fuel log
 */
export const fuelLogSchema = z.object({
  vehicle_id: z
    .string({ message: "Vehicle is required" })
    .uuid("Invalid vehicle ID")
    .min(1, "Vehicle is required"),
  liters_filled: z
    .number({ message: "Liters filled is required" })
    .positive("Liters must be greater than 0")
    .max(500, "Liters seems too high"),
  cost: z
    .number({ message: "Cost is required" })
    .min(0, "Cost cannot be negative")
    .max(100000, "Cost seems too high"),
  fuel_price: z
    .number({ message: "Fuel price is required" })
    .positive("Fuel price must be greater than 0"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  odometer_reading: z
    .number({ message: "Odometer reading is required" })
    .int("Odometer must be a whole number")
    .min(0, "Odometer cannot be negative")
    .max(2000000, "Odometer reading seems too high"),
  location: z
    .string()
    .max(200, "Location must be 200 characters or less")
    .trim()
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for updating a fuel log (all fields optional except vehicle_id)
 */
export const fuelLogUpdateSchema = fuelLogSchema
  .partial()
  .required({ vehicle_id: true });

/**
 * Type inferred from the fuel log schema
 */
export type FuelLogFormData = z.infer<typeof fuelLogSchema>;
export type FuelLogUpdateFormData = z.infer<typeof fuelLogUpdateSchema>;

/**
 * Default values for fuel log form
 */
export const fuelLogDefaultValues: Partial<FuelLogFormData> = {
  liters_filled: undefined,
  cost: undefined,
  fuel_price: undefined,
  date: new Date().toISOString().split("T")[0],
  odometer_reading: undefined,
  location: "",
};

/**
 * Helper to calculate liters from cost and price
 */
export function calculateLiters(cost: number, pricePerLiter: number): number {
  if (pricePerLiter <= 0) return 0;
  return Math.round((cost / pricePerLiter) * 100) / 100;
}

/**
 * Helper to calculate cost from liters and price
 */
export function calculateCost(liters: number, pricePerLiter: number): number {
  return Math.round(liters * pricePerLiter * 100) / 100;
}

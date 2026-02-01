/**
 * Mileage log form schema with Zod validation
 */

import { z } from "zod";

/**
 * Schema for creating a new mileage log
 */
export const mileageLogSchema = z.object({
  vehicle_id: z
    .string({ message: "Vehicle is required" })
    .uuid("Invalid vehicle ID")
    .min(1, "Vehicle is required"),
  odometer_reading: z
    .number({ message: "Odometer reading is required" })
    .int("Odometer must be a whole number")
    .min(0, "Odometer cannot be negative")
    .max(2000000, "Odometer reading seems too high"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less")
    .trim()
    .optional()
    .or(z.literal("")),
});

/**
 * Schema for updating a mileage log (all fields optional except vehicle_id)
 */
export const mileageLogUpdateSchema = mileageLogSchema.partial().required({
  vehicle_id: true,
});

/**
 * Type inferred from the mileage log schema
 */
export type MileageLogFormData = z.infer<typeof mileageLogSchema>;
export type MileageLogUpdateFormData = z.infer<typeof mileageLogUpdateSchema>;

/**
 * Default values for mileage log form
 */
export const mileageLogDefaultValues: Partial<MileageLogFormData> = {
  odometer_reading: undefined,
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

/**
 * Create a mileage log schema with minimum odometer validation
 */
export function createMileageLogSchemaWithMin(minOdometer: number) {
  return mileageLogSchema.extend({
    odometer_reading: z
      .number({ message: "Odometer reading is required" })
      .int("Odometer must be a whole number")
      .min(
        minOdometer,
        `Odometer must be at least ${minOdometer.toLocaleString()} km (last recorded reading)`,
      )
      .max(2000000, "Odometer reading seems too high"),
  });
}

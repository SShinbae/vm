/**
 * Service log form schema with Zod validation
 */

import { z } from "zod";

/**
 * Service types enum
 */
export const serviceTypes = [
  "oil_change",
  "tire_rotation",
  "brake_service",
  "general_maintenance",
  "repair",
  "inspection",
  "other",
] as const;

export type ServiceTypeValue = (typeof serviceTypes)[number];

/**
 * Schema for a service item (itemized breakdown)
 */
export const serviceItemSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less")
    .trim(),
  price: z
    .number({ message: "Price is required" })
    .min(0, "Price cannot be negative")
    .max(100000, "Price seems too high"),
});

/**
 * Schema for creating a new service log
 */
export const serviceLogSchema = z.object({
  vehicle_id: z
    .string({ message: "Vehicle is required" })
    .uuid("Invalid vehicle ID")
    .min(1, "Vehicle is required"),
  service_type: z.enum(serviceTypes, {
    message: "Service type is required",
  }),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be 1000 characters or less")
    .trim(),
  cost: z
    .number({ message: "Cost must be a number" })
    .min(0, "Cost cannot be negative")
    .max(1000000, "Cost seems too high")
    .optional(),
  items: z.array(serviceItemSchema).optional(),
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
  next_service_due: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional()
    .or(z.literal("")),
  receipt_image_url: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal("")),
  auto_filled: z.boolean().optional(),
});

/**
 * Schema for updating a service log (all fields optional except vehicle_id)
 */
export const serviceLogUpdateSchema = serviceLogSchema.partial().required({
  vehicle_id: true,
});

/**
 * Type inferred from the service log schema
 */
export type ServiceLogFormData = z.infer<typeof serviceLogSchema>;
export type ServiceLogUpdateFormData = z.infer<typeof serviceLogUpdateSchema>;
export type ServiceItemFormData = z.infer<typeof serviceItemSchema>;

/**
 * Default values for service log form
 */
export const serviceLogDefaultValues: Partial<ServiceLogFormData> = {
  service_type: undefined,
  description: "",
  cost: undefined,
  items: [],
  date: new Date().toISOString().split("T")[0],
  odometer_reading: undefined,
  next_service_due: "",
  receipt_image_url: "",
  auto_filled: false,
};

/**
 * Service type labels for display
 */
export const serviceTypeLabels: Record<ServiceTypeValue, string> = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  brake_service: "Brake Service",
  general_maintenance: "General Maintenance",
  repair: "Repair",
  inspection: "Inspection",
  other: "Other",
};

/**
 * Calculate total cost from items
 */
export function calculateTotalFromItems(
  items: ServiceItemFormData[] | undefined,
): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => total + (item.price || 0), 0);
}

/**
 * Notification preferences form schema with Zod validation
 */

import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  // Per-type toggles
  service_reminders_enabled: z.boolean().default(true),
  mileage_reminders_enabled: z.boolean().default(true),
  cost_alerts_enabled: z.boolean().default(true),
  analytics_insights_enabled: z.boolean().default(true),
  log_updates_enabled: z.boolean().default(true),
  group_members_enabled: z.boolean().default(true),
  invitations_enabled: z.boolean().default(true),

  // Delivery toggles
  push_notifications_enabled: z.boolean().default(true),
  in_app_toasts_enabled: z.boolean().default(true),

  // Service reminder timing
  service_reminder_days: z
    .array(z.number().int().positive())
    .default([30, 7, 3]),

  // Mileage thresholds
  mileage_reminder_thresholds: z
    .array(z.number().int().positive())
    .default([5000, 1000]),

  // Cost alerts
  monthly_spending_threshold: z.number().positive().nullable().default(null),
  fuel_price_alert_percentage: z.number().int().min(1).max(100).default(20),

  // Analytics frequency
  analytics_frequency: z.enum(["weekly", "monthly", "never"]).default("weekly"),

  // Quiet hours
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format")
    .default("22:00"),
  quiet_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format")
    .default("07:00"),
  quiet_days: z.array(z.number().int().min(0).max(6)).default([]),
  timezone: z.string().default("UTC"),

  // Frequency limiting
  max_per_type_per_day: z.number().int().min(1).max(50).default(3),

  // Snooze
  snoozed_types: z.record(z.string(), z.string()).default({}),
});

export const notificationPreferencesUpdateSchema =
  notificationPreferencesSchema.partial();

export type NotificationPreferencesFormData = z.infer<
  typeof notificationPreferencesSchema
>;
export type NotificationPreferencesUpdateFormData = z.infer<
  typeof notificationPreferencesUpdateSchema
>;

export const notificationPreferencesDefaultValues: NotificationPreferencesFormData =
  {
    service_reminders_enabled: true,
    mileage_reminders_enabled: true,
    cost_alerts_enabled: true,
    analytics_insights_enabled: true,
    log_updates_enabled: true,
    group_members_enabled: true,
    invitations_enabled: true,
    push_notifications_enabled: true,
    in_app_toasts_enabled: true,
    service_reminder_days: [30, 7, 3],
    mileage_reminder_thresholds: [5000, 1000],
    monthly_spending_threshold: null,
    fuel_price_alert_percentage: 20,
    analytics_frequency: "weekly",
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    quiet_days: [],
    timezone: "UTC",
    max_per_type_per_day: 3,
    snoozed_types: {},
  };

/**
 * Form schema exports
 *
 * All form validation schemas using Zod.
 */

// Vehicle
export {
  vehicleSchema,
  vehicleUpdateSchema,
  vehicleDefaultValues,
  type VehicleFormData,
  type VehicleUpdateFormData,
} from "./vehicleSchema";

// Fuel Log
export {
  fuelLogSchema,
  fuelLogUpdateSchema,
  fuelLogDefaultValues,
  calculateLiters,
  calculateCost,
  type FuelLogFormData,
  type FuelLogUpdateFormData,
} from "./fuelLogSchema";

// Service Log
export {
  serviceLogSchema,
  serviceLogUpdateSchema,
  serviceItemSchema,
  serviceLogDefaultValues,
  serviceTypes,
  serviceTypeLabels,
  calculateTotalFromItems,
  type ServiceLogFormData,
  type ServiceLogUpdateFormData,
  type ServiceItemFormData,
  type ServiceTypeValue,
} from "./serviceLogSchema";

// Mileage Log
export {
  mileageLogSchema,
  mileageLogUpdateSchema,
  mileageLogDefaultValues,
  createMileageLogSchemaWithMin,
  type MileageLogFormData,
  type MileageLogUpdateFormData,
} from "./mileageLogSchema";

// Group
export {
  groupSchema,
  groupUpdateSchema,
  groupInviteSchema,
  groupDefaultValues,
  groupInviteDefaultValues,
  type GroupFormData,
  type GroupUpdateFormData,
  type GroupInviteFormData,
} from "./groupSchema";

// Notification Preferences
export {
  notificationPreferencesSchema,
  notificationPreferencesUpdateSchema,
  notificationPreferencesDefaultValues,
  type NotificationPreferencesFormData,
  type NotificationPreferencesUpdateFormData,
} from "./notificationPreferencesSchema";

// Auth
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  loginDefaultValues,
  registerDefaultValues,
  forgotPasswordDefaultValues,
  resetPasswordDefaultValues,
  calculatePasswordStrength,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
  type UpdatePasswordFormData,
} from "./authSchema";

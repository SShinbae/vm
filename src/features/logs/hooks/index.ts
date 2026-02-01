/**
 * Log hooks exports
 */

// Fuel Logs
export {
  useFuelLogs,
  useAllFuelLogs,
  useFuelLog,
  useFuelLogsByDateRange,
  useLatestFuelLog,
  useFuelStats,
  useCreateFuelLog,
  useUpdateFuelLog,
  useDeleteFuelLog,
} from "./useFuelLogs";

// Service Logs
export {
  useServiceLogs,
  useAllServiceLogs,
  useServiceLog,
  useServiceLogsByType,
  useLatestServiceLog,
  useUpcomingServices,
  useServiceStats,
  useCreateServiceLog,
  useUpdateServiceLog,
  useDeleteServiceLog,
} from "./useServiceLogs";

// Mileage Logs
export {
  useMileageLogs,
  useAllMileageLogs,
  useMileageLog,
  useLatestMileageLog,
  useMaxOdometer,
  useTotalDistance,
  useCreateMileageLog,
  useUpdateMileageLog,
  useDeleteMileageLog,
} from "./useMileageLogs";

/**
 * Repository exports
 *
 * Data access layer for Supabase tables using the Repository pattern.
 */

// Base
export {
  BaseRepository,
  type QueryFilters,
  type RepositoryError,
} from "./BaseRepository";

// Vehicle
export { VehicleRepository, vehicleRepository } from "./VehicleRepository";

// Logs
export { FuelLogRepository, fuelLogRepository } from "./FuelLogRepository";
export {
  ServiceLogRepository,
  serviceLogRepository,
} from "./ServiceLogRepository";
export {
  MileageLogRepository,
  mileageLogRepository,
} from "./MileageLogRepository";

// Groups
export { GroupRepository, groupRepository } from "./GroupRepository";

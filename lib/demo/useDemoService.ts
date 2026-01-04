/**
 * Demo Service Hook
 *
 * Automatically switches between real and demo services based on demo mode state.
 * This allows the app to seamlessly use mock data when in demo mode.
 */

import { useDemoMode } from "@/lib/contexts/DemoContext";
import {
  demoVehicleService,
  demoLoggingService,
  demoAnalyticsService,
  demoGroupService,
  demoAuthService,
  demoNotificationService,
} from "./demoServices";

/**
 * Hook to get the appropriate service based on demo mode
 *
 * Usage:
 * ```ts
 * const { isDemoMode, vehicleService } = useDemoService();
 *
 * // Use the service normally - it will automatically use demo or real service
 * const vehicles = await vehicleService.getVehicles();
 * ```
 */
export function useDemoService() {
  const { isDemoMode } = useDemoMode();

  return {
    isDemoMode,
    vehicleService: isDemoMode ? demoVehicleService : null,
    loggingService: isDemoMode ? demoLoggingService : null,
    analyticsService: isDemoMode ? demoAnalyticsService : null,
    groupService: isDemoMode ? demoGroupService : null,
    authService: isDemoMode ? demoAuthService : null,
    notificationService: isDemoMode ? demoNotificationService : null,
  };
}

/**
 * Helper function to conditionally use demo service or real service
 *
 * Usage:
 * ```ts
 * import { vehicleService } from '@/lib/services/vehicleService';
 * import { withDemoService } from '@/lib/demo/useDemoService';
 *
 * const getVehicles = async (isDemoMode) => {
 *   return withDemoService(
 *     isDemoMode,
 *     demoVehicleService.getVehicles,
 *     vehicleService.getVehicles
 *   );
 * };
 * ```
 */
export async function withDemoService<T>(
  isDemoMode: boolean,
  demoFn: () => Promise<T>,
  realFn: () => Promise<T>,
): Promise<T> {
  return isDemoMode ? demoFn() : realFn();
}

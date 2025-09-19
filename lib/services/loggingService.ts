import { supabase } from '../../services/supabaseClient';
import {
  MileageLog,
  FuelLog,
  ServiceLog,
  MileageLogInsert,
  FuelLogInsert,
  ServiceLogInsert,
  MileageLogUpdate,
  FuelLogUpdate,
  ServiceLogUpdate,
  ApiResponse,
} from '../../types';

export class MileageLogService {
  static async getMileageLogs(vehicleId?: string): Promise<ApiResponse<MileageLog[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Build base query for owned vehicles
      let ownedQuery = supabase
        .from('mileage_logs')
        .select(`
          *,
          vehicles!inner(make, model, year, license_plate, user_id)
        `)
        .eq('vehicles.user_id', user.id)
        .order('date', { ascending: false });

      if (vehicleId) {
        ownedQuery = ownedQuery.eq('vehicle_id', vehicleId);
      }

      // First, get the shared vehicle IDs that the user has access to
      let sharedVehicleIds: string[] = [];
      if (!vehicleId) {
        // Get user's group memberships
        const { data: userGroups, error: groupError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (!groupError && userGroups && userGroups.length > 0) {
          const groupIds = userGroups.map(g => g.group_id);

          // Get vehicles shared with these groups
          const { data: sharedVehicles, error: shareError } = await supabase
            .from('vehicle_group_shares')
            .select('vehicle_id')
            .in('group_id', groupIds);

          if (!shareError && sharedVehicles) {
            sharedVehicleIds = sharedVehicles.map(sv => sv.vehicle_id);
          }
        }
      }

      // Get logs for both owned vehicles and shared vehicles
      const [ownedLogsResult, sharedLogsResult] = await Promise.all([
        // Owned vehicle logs
        ownedQuery,

        // Shared vehicle logs (only if we have shared vehicle IDs)
        sharedVehicleIds.length > 0 ? supabase
          .from('mileage_logs')
          .select(`
            *,
            vehicles!inner(make, model, year, license_plate, user_id)
          `)
          .in('vehicle_id', sharedVehicleIds)
          .order('date', { ascending: false })
        : Promise.resolve({ data: [], error: null })
      ]);

      // Handle errors
      if (ownedLogsResult.error) {
        console.error('Error fetching owned mileage logs:', ownedLogsResult.error);
        return { data: null, error: ownedLogsResult.error.message, loading: false };
      }

      if (sharedLogsResult.error) {
        console.warn('Error fetching shared mileage logs:', sharedLogsResult.error);
        // Don't fail completely, just use owned logs
      }

      // Combine and sort all logs
      const ownedLogs = ownedLogsResult.data || [];
      const sharedLogs = (sharedLogsResult.data || []).map(log => ({
        ...log,
        is_shared_vehicle: true // Mark as shared for UI indicators
      }));

      const allLogs = [...ownedLogs, ...sharedLogs];

      // Remove duplicates (in case user owns and has access to same vehicle through sharing)
      const uniqueLogs = allLogs.filter((log, index, self) =>
        index === self.findIndex(l => l.id === log.id)
      );

      // Sort by date descending
      uniqueLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { data: uniqueLogs, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching mileage logs:', error);
      return { data: null, error: 'Failed to fetch mileage logs', loading: false };
    }
  }

  static async createMileageLog(log: Omit<MileageLogInsert, 'user_id'>): Promise<ApiResponse<MileageLog>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(log.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Vehicle not found or access denied', loading: false };
      }

      // Check for duplicate date entries for the same vehicle
      const { data: existing } = await supabase
        .from('mileage_logs')
        .select('id')
        .eq('vehicle_id', log.vehicle_id)
        .eq('date', log.date);

      if (existing && existing.length > 0) {
        return { data: null, error: 'A mileage entry already exists for this date', loading: false };
      }

      const { data, error } = await supabase
        .from('mileage_logs')
        .insert({
          ...log,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating mileage log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error creating mileage log:', error);
      return { data: null, error: 'Failed to create mileage log', loading: false };
    }
  }

  static async updateMileageLog(id: string, updates: MileageLogUpdate): Promise<ApiResponse<MileageLog>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // First, get the log to check vehicle access
      const { data: existingLog, error: fetchError } = await supabase
        .from('mileage_logs')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingLog) {
        return { data: null, error: 'Log not found', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(existingLog.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Access denied', loading: false };
      }

      const { data, error } = await supabase
        .from('mileage_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating mileage log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error updating mileage log:', error);
      return { data: null, error: 'Failed to update mileage log', loading: false };
    }
  }

  static async deleteMileageLog(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // First, get the log to check vehicle access
      const { data: existingLog, error: fetchError } = await supabase
        .from('mileage_logs')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingLog) {
        return { data: null, error: 'Log not found', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(existingLog.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Access denied', loading: false };
      }

      const { error } = await supabase
        .from('mileage_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting mileage log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error deleting mileage log:', error);
      return { data: null, error: 'Failed to delete mileage log', loading: false };
    }
  }

  /**
   * Helper method to check if a user can access a vehicle (owns it or has shared access through groups)
   */
  private static async canUserAccessVehicle(vehicleId: string, userId: string): Promise<boolean> {
    try {
      // First, check if user owns the vehicle
      const { data: ownedVehicle, error: ownedError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .single();

      if (!ownedError && ownedVehicle) {
        return true; // User owns the vehicle
      }

      // If not owned, check if vehicle is shared with user through groups
      // First, get user's group memberships
      const { data: userGroups, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (groupError || !userGroups || userGroups.length === 0) {
        return false; // No groups to check
      }

      const groupIds = userGroups.map(g => g.group_id);

      // Check if vehicle is shared with any of these groups
      const { data: sharedVehicles, error: shareError } = await supabase
        .from('vehicle_group_shares')
        .select('vehicle_id')
        .eq('vehicle_id', vehicleId)
        .in('group_id', groupIds);

      return !shareError && sharedVehicles && sharedVehicles.length > 0;

    } catch (error) {
      console.error('Error checking vehicle access:', error);
      return false;
    }
  }
}

export class FuelLogService {
  static async getFuelLogs(vehicleId?: string): Promise<ApiResponse<FuelLog[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Build base query for owned vehicles
      let ownedQuery = supabase
        .from('fuel_logs')
        .select(`
          *,
          vehicles!inner(make, model, year, license_plate, user_id)
        `)
        .eq('vehicles.user_id', user.id)
        .order('date', { ascending: false });

      if (vehicleId) {
        ownedQuery = ownedQuery.eq('vehicle_id', vehicleId);
      }

      // First, get the shared vehicle IDs that the user has access to
      let sharedVehicleIds: string[] = [];
      if (!vehicleId) {
        // Get user's group memberships
        const { data: userGroups, error: groupError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (!groupError && userGroups && userGroups.length > 0) {
          const groupIds = userGroups.map(g => g.group_id);

          // Get vehicles shared with these groups
          const { data: sharedVehicles, error: shareError } = await supabase
            .from('vehicle_group_shares')
            .select('vehicle_id')
            .in('group_id', groupIds);

          if (!shareError && sharedVehicles) {
            sharedVehicleIds = sharedVehicles.map(sv => sv.vehicle_id);
          }
        }
      }

      // Get logs for both owned vehicles and shared vehicles
      const [ownedLogsResult, sharedLogsResult] = await Promise.all([
        // Owned vehicle logs
        ownedQuery,

        // Shared vehicle logs (only if we have shared vehicle IDs)
        sharedVehicleIds.length > 0 ? supabase
          .from('fuel_logs')
          .select(`
            *,
            vehicles!inner(make, model, year, license_plate, user_id)
          `)
          .in('vehicle_id', sharedVehicleIds)
          .order('date', { ascending: false })
        : Promise.resolve({ data: [], error: null })
      ]);

      // Handle errors
      if (ownedLogsResult.error) {
        console.error('Error fetching owned fuel logs:', ownedLogsResult.error);
        return { data: null, error: ownedLogsResult.error.message, loading: false };
      }

      if (sharedLogsResult.error) {
        console.warn('Error fetching shared fuel logs:', sharedLogsResult.error);
        // Don't fail completely, just use owned logs
      }

      // Combine and sort all logs
      const ownedLogs = ownedLogsResult.data || [];
      const sharedLogs = (sharedLogsResult.data || []).map(log => ({
        ...log,
        is_shared_vehicle: true // Mark as shared for UI indicators
      }));

      const allLogs = [...ownedLogs, ...sharedLogs];

      // Remove duplicates (in case user owns and has access to same vehicle through sharing)
      const uniqueLogs = allLogs.filter((log, index, self) =>
        index === self.findIndex(l => l.id === log.id)
      );

      // Sort by date descending
      uniqueLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { data: uniqueLogs, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching fuel logs:', error);
      return { data: null, error: 'Failed to fetch fuel logs', loading: false };
    }
  }

  static async createFuelLog(log: Omit<FuelLogInsert, 'user_id'>): Promise<ApiResponse<FuelLog>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(log.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Vehicle not found or access denied', loading: false };
      }

      const { data, error } = await supabase
        .from('fuel_logs')
        .insert({
          ...log,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating fuel log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error creating fuel log:', error);
      return { data: null, error: 'Failed to create fuel log', loading: false };
    }
  }

  static async updateFuelLog(id: string, updates: FuelLogUpdate): Promise<ApiResponse<FuelLog>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // First, get the log to check vehicle access
      const { data: existingLog, error: fetchError } = await supabase
        .from('fuel_logs')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingLog) {
        return { data: null, error: 'Log not found', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(existingLog.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Access denied', loading: false };
      }

      const { data, error } = await supabase
        .from('fuel_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating fuel log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error updating fuel log:', error);
      return { data: null, error: 'Failed to update fuel log', loading: false };
    }
  }

  static async deleteFuelLog(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // First, get the log to check vehicle access
      const { data: existingLog, error: fetchError } = await supabase
        .from('fuel_logs')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingLog) {
        return { data: null, error: 'Log not found', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(existingLog.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Access denied', loading: false };
      }

      const { error } = await supabase
        .from('fuel_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting fuel log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error deleting fuel log:', error);
      return { data: null, error: 'Failed to delete fuel log', loading: false };
    }
  }

  /**
   * Helper method to check if a user can access a vehicle (owns it or has shared access through groups)
   */
  private static async canUserAccessVehicle(vehicleId: string, userId: string): Promise<boolean> {
    try {
      // First, check if user owns the vehicle
      const { data: ownedVehicle, error: ownedError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .single();

      if (!ownedError && ownedVehicle) {
        return true; // User owns the vehicle
      }

      // If not owned, check if vehicle is shared with user through groups
      // First, get user's group memberships
      const { data: userGroups, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (groupError || !userGroups || userGroups.length === 0) {
        return false; // No groups to check
      }

      const groupIds = userGroups.map(g => g.group_id);

      // Check if vehicle is shared with any of these groups
      const { data: sharedVehicles, error: shareError } = await supabase
        .from('vehicle_group_shares')
        .select('vehicle_id')
        .eq('vehicle_id', vehicleId)
        .in('group_id', groupIds);

      return !shareError && sharedVehicles && sharedVehicles.length > 0;

    } catch (error) {
      console.error('Error checking vehicle access:', error);
      return false;
    }
  }
}

export class ServiceLogService {
  static async getServiceLogs(vehicleId?: string): Promise<ApiResponse<ServiceLog[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Build base query for owned vehicles
      let ownedQuery = supabase
        .from('service_logs')
        .select(`
          *,
          vehicles!inner(make, model, year, license_plate, user_id)
        `)
        .eq('vehicles.user_id', user.id)
        .order('date', { ascending: false });

      if (vehicleId) {
        ownedQuery = ownedQuery.eq('vehicle_id', vehicleId);
      }

      // First, get the shared vehicle IDs that the user has access to
      let sharedVehicleIds: string[] = [];
      if (!vehicleId) {
        // Get user's group memberships
        const { data: userGroups, error: groupError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (!groupError && userGroups && userGroups.length > 0) {
          const groupIds = userGroups.map(g => g.group_id);

          // Get vehicles shared with these groups
          const { data: sharedVehicles, error: shareError } = await supabase
            .from('vehicle_group_shares')
            .select('vehicle_id')
            .in('group_id', groupIds);

          if (!shareError && sharedVehicles) {
            sharedVehicleIds = sharedVehicles.map(sv => sv.vehicle_id);
          }
        }
      }

      // Get logs for both owned vehicles and shared vehicles
      const [ownedLogsResult, sharedLogsResult] = await Promise.all([
        // Owned vehicle logs
        ownedQuery,

        // Shared vehicle logs (only if we have shared vehicle IDs)
        sharedVehicleIds.length > 0 ? supabase
          .from('service_logs')
          .select(`
            *,
            vehicles!inner(make, model, year, license_plate, user_id)
          `)
          .in('vehicle_id', sharedVehicleIds)
          .order('date', { ascending: false })
        : Promise.resolve({ data: [], error: null })
      ]);

      // Handle errors
      if (ownedLogsResult.error) {
        console.error('Error fetching owned service logs:', ownedLogsResult.error);
        return { data: null, error: ownedLogsResult.error.message, loading: false };
      }

      if (sharedLogsResult.error) {
        console.warn('Error fetching shared service logs:', sharedLogsResult.error);
        // Don't fail completely, just use owned logs
      }

      // Combine and sort all logs
      const ownedLogs = ownedLogsResult.data || [];
      const sharedLogs = (sharedLogsResult.data || []).map(log => ({
        ...log,
        is_shared_vehicle: true // Mark as shared for UI indicators
      }));

      const allLogs = [...ownedLogs, ...sharedLogs];

      // Remove duplicates (in case user owns and has access to same vehicle through sharing)
      const uniqueLogs = allLogs.filter((log, index, self) =>
        index === self.findIndex(l => l.id === log.id)
      );

      // Sort by date descending
      uniqueLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { data: uniqueLogs, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching service logs:', error);
      return { data: null, error: 'Failed to fetch service logs', loading: false };
    }
  }

  static async createServiceLog(log: Omit<ServiceLogInsert, 'user_id'>): Promise<ApiResponse<ServiceLog>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(log.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Vehicle not found or access denied', loading: false };
      }

      const { data, error } = await supabase
        .from('service_logs')
        .insert({
          ...log,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating service log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error creating service log:', error);
      return { data: null, error: 'Failed to create service log', loading: false };
    }
  }

  static async updateServiceLog(id: string, updates: ServiceLogUpdate): Promise<ApiResponse<ServiceLog>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // First, get the log to check vehicle access
      const { data: existingLog, error: fetchError } = await supabase
        .from('service_logs')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingLog) {
        return { data: null, error: 'Log not found', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(existingLog.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Access denied', loading: false };
      }

      const { data, error } = await supabase
        .from('service_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating service log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error updating service log:', error);
      return { data: null, error: 'Failed to update service log', loading: false };
    }
  }

  static async deleteServiceLog(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // First, get the log to check vehicle access
      const { data: existingLog, error: fetchError } = await supabase
        .from('service_logs')
        .select('vehicle_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingLog) {
        return { data: null, error: 'Log not found', loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await this.canUserAccessVehicle(existingLog.vehicle_id, user.id);

      if (!hasAccess) {
        return { data: null, error: 'Access denied', loading: false };
      }

      const { error } = await supabase
        .from('service_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting service log:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error deleting service log:', error);
      return { data: null, error: 'Failed to delete service log', loading: false };
    }
  }

  /**
   * Helper method to check if a user can access a vehicle (owns it or has shared access through groups)
   */
  private static async canUserAccessVehicle(vehicleId: string, userId: string): Promise<boolean> {
    try {
      // First, check if user owns the vehicle
      const { data: ownedVehicle, error: ownedError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .single();

      if (!ownedError && ownedVehicle) {
        return true; // User owns the vehicle
      }

      // If not owned, check if vehicle is shared with user through groups
      // First, get user's group memberships
      const { data: userGroups, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (groupError || !userGroups || userGroups.length === 0) {
        return false; // No groups to check
      }

      const groupIds = userGroups.map(g => g.group_id);

      // Check if vehicle is shared with any of these groups
      const { data: sharedVehicles, error: shareError } = await supabase
        .from('vehicle_group_shares')
        .select('vehicle_id')
        .eq('vehicle_id', vehicleId)
        .in('group_id', groupIds);

      return !shareError && sharedVehicles && sharedVehicles.length > 0;

    } catch (error) {
      console.error('Error checking vehicle access:', error);
      return false;
    }
  }
}
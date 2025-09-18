import { supabase } from '../../services/supabaseClient';
import {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  VehicleWithLogs,
  VehicleWithGroupInfo,
  ApiResponse,
} from '../../types';

export class VehicleService {
  static async getVehicles(): Promise<ApiResponse<VehicleWithGroupInfo[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      console.log('🔍 Starting vehicle fetch for user:', user.id);

      // Step 1: Get user's own vehicles
      const { data: ownVehicles, error: ownError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError) {
        console.error('❌ Error fetching own vehicles:', ownError);
        return { data: null, error: ownError.message, loading: false };
      }

      console.log('✅ Own vehicles found:', ownVehicles?.length || 0);

      // Step 2: Get shared vehicles using the new v2 selective sharing system
      const { data: sharedVehicles, error: sharedError } = await supabase
        .from('vehicles')
        .select(`
          *,
          profiles!vehicles_user_id_fkey(id, full_name, email)
        `)
        .neq('user_id', user.id);

      if (sharedError) {
        console.log('⚠️ Could not fetch shared vehicles (this is normal if v2 schema not fully set up):', sharedError.message);
      }

      console.log('✅ Shared vehicles found:', sharedVehicles?.length || 0);

      // Step 3: Mark vehicles with proper metadata
      const ownVehiclesMarked: VehicleWithGroupInfo[] = (ownVehicles || []).map(vehicle => ({
        ...vehicle,
        is_group_vehicle: false,
        owner_profile: null
      }));

      const sharedVehiclesMarked: VehicleWithGroupInfo[] = (sharedVehicles || []).map(vehicle => ({
        ...vehicle,
        is_group_vehicle: true,
        owner_profile: vehicle.profiles
      }));

      console.log('🎉 Vehicle fetch completed:', {
        userId: user.id,
        ownVehicles: ownVehiclesMarked.length,
        sharedVehicles: sharedVehiclesMarked.length,
      });

      // Return vehicles sorted by creation date
      const result = [...ownVehiclesMarked, ...sharedVehiclesMarked];
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { data: result, error: null, loading: false };
    } catch (error) {
      console.error('💥 Unexpected error fetching vehicles:', error);
      return { data: null, error: 'Failed to fetch vehicles', loading: false };
    }
  }

  static async getVehiclesSeparated(): Promise<ApiResponse<{
    ownVehicles: VehicleWithGroupInfo[];
    sharedVehicles: VehicleWithGroupInfo[];
  }>> {
    try {
      const response = await this.getVehicles();

      if (response.error || !response.data) {
        return {
          data: null,
          error: response.error,
          loading: false
        };
      }

      const ownVehicles = response.data.filter(v => !v.is_group_vehicle);
      const sharedVehicles = response.data.filter(v => v.is_group_vehicle);

      console.log('📊 Vehicles separated:', {
        ownCount: ownVehicles.length,
        sharedCount: sharedVehicles.length
      });

      return {
        data: { ownVehicles, sharedVehicles },
        error: null,
        loading: false
      };
    } catch (error) {
      console.error('💥 Error separating vehicles:', error);
      return {
        data: null,
        error: 'Failed to separate vehicles',
        loading: false
      };
    }
  }

  static async getVehicleById(id: string): Promise<ApiResponse<VehicleWithLogs>> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          mileage_logs(*, created_at),
          fuel_logs(*, created_at),
          service_logs(*, created_at)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching vehicle:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching vehicle:', error);
      return { data: null, error: 'Failed to fetch vehicle', loading: false };
    }
  }

  static async createVehicle(vehicle: Omit<VehicleInsert, 'user_id'>): Promise<ApiResponse<Vehicle>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Check for duplicate license plate
      const { data: existing } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', vehicle.license_plate)
        .eq('user_id', user.id);

      if (existing && existing.length > 0) {
        return { data: null, error: 'A vehicle with this license plate already exists', loading: false };
      }

      const vehicleData: any = {
        ...vehicle,
        user_id: user.id,
      };

      console.log('🔄 Creating vehicle:', vehicleData);

      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        return { data: null, error: error.message, loading: false };
      }

      console.log('✅ Vehicle created successfully:', data.id);
      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error creating vehicle:', error);
      return { data: null, error: 'Failed to create vehicle', loading: false };
    }
  }

  static async updateVehicle(id: string, updates: VehicleUpdate): Promise<ApiResponse<Vehicle>> {
    try {
      // If updating license plate, check for duplicates
      if (updates.license_plate) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          return { data: null, error: 'User not authenticated', loading: false };
        }

        const { data: existing } = await supabase
          .from('vehicles')
          .select('id')
          .eq('license_plate', updates.license_plate)
          .eq('user_id', user.id)
          .neq('id', id);

        if (existing && existing.length > 0) {
          return { data: null, error: 'A vehicle with this license plate already exists', loading: false };
        }
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error updating vehicle:', error);
      return { data: null, error: 'Failed to update vehicle', loading: false };
    }
  }

  static async deleteVehicle(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vehicle:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error deleting vehicle:', error);
      return { data: null, error: 'Failed to delete vehicle', loading: false };
    }
  }

  static async getVehicleStats(vehicleId: string) {
    try {
      // Get latest mileage
      const { data: latestMileage } = await supabase
        .from('mileage_logs')
        .select('odometer_reading')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })
        .limit(1);

      // Get fuel efficiency (last 5 fuel-ups)
      const { data: fuelLogs } = await supabase
        .from('fuel_logs')
        .select('liters_filled, odometer_reading')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })
        .limit(5);

      // Get next service due
      const { data: nextService } = await supabase
        .from('service_logs')
        .select('next_service_due, service_type')
        .eq('vehicle_id', vehicleId)
        .not('next_service_due', 'is', null)
        .order('next_service_due', { ascending: true })
        .limit(1);

      return {
        currentMileage: latestMileage?.[0]?.odometer_reading || 0,
        fuelLogs: fuelLogs || [],
        nextService: nextService?.[0] || null,
      };
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      return {
        currentMileage: 0,
        fuelLogs: [],
        nextService: null,
      };
    }
  }

  // New v2 methods for selective sharing

  static async shareVehicleWithGroups(vehicleId: string, groupIds: string[]): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Verify user owns the vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('user_id')
        .eq('id', vehicleId)
        .single();

      if (vehicleError || vehicle.user_id !== user.id) {
        return { data: null, error: 'You can only share your own vehicles', loading: false };
      }

      // Remove existing shares
      await supabase
        .from('vehicle_group_shares')
        .delete()
        .eq('vehicle_id', vehicleId);

      // Add new shares
      if (groupIds.length > 0) {
        const shares = groupIds.map(groupId => ({
          vehicle_id: vehicleId,
          group_id: groupId,
          shared_by: user.id
        }));

        const { error: shareError } = await supabase
          .from('vehicle_group_shares')
          .insert(shares);

        if (shareError) {
          console.error('Error sharing vehicle:', shareError);
          return { data: null, error: shareError.message, loading: false };
        }
      }

      console.log(`✅ Vehicle ${vehicleId} shared with ${groupIds.length} groups`);
      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error sharing vehicle:', error);
      return { data: null, error: 'Failed to share vehicle', loading: false };
    }
  }

  static async getVehicleSharedGroups(vehicleId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('vehicle_group_shares')
        .select('group_id')
        .eq('vehicle_id', vehicleId);

      if (error) {
        console.error('Error fetching vehicle shares:', error);
        return { data: null, error: error.message, loading: false };
      }

      const groupIds = (data || []).map(share => share.group_id);
      return { data: groupIds, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching vehicle shares:', error);
      return { data: null, error: 'Failed to fetch vehicle shares', loading: false };
    }
  }
}
import { supabase } from '../../services/supabaseClient';
import {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  VehicleWithLogs,
  ApiResponse,
} from '../../types';

export class VehicleService {
  static async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching vehicles:', error);
      return { data: null, error: 'Failed to fetch vehicles', loading: false };
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

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          ...vehicle,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        return { data: null, error: error.message, loading: false };
      }

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
}
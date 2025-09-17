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

      let query = supabase
        .from('mileage_logs')
        .select(`
          *,
          vehicles!inner(make, model, year, license_plate, user_id)
        `)
        .eq('vehicles.user_id', user.id)
        .order('date', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching mileage logs:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };
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

      // Validate that user owns the vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', log.vehicle_id)
        .eq('user_id', user.id)
        .single();

      if (vehicleError || !vehicle) {
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
}

export class FuelLogService {
  static async getFuelLogs(vehicleId?: string): Promise<ApiResponse<FuelLog[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      let query = supabase
        .from('fuel_logs')
        .select(`
          *,
          vehicles!inner(make, model, year, license_plate, user_id)
        `)
        .eq('vehicles.user_id', user.id)
        .order('date', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching fuel logs:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };
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

      // Validate that user owns the vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', log.vehicle_id)
        .eq('user_id', user.id)
        .single();

      if (vehicleError || !vehicle) {
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
}

export class ServiceLogService {
  static async getServiceLogs(vehicleId?: string): Promise<ApiResponse<ServiceLog[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      let query = supabase
        .from('service_logs')
        .select(`
          *,
          vehicles!inner(make, model, year, license_plate, user_id)
        `)
        .eq('vehicles.user_id', user.id)
        .order('date', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching service logs:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };
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

      // Validate that user owns the vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', log.vehicle_id)
        .eq('user_id', user.id)
        .single();

      if (vehicleError || !vehicle) {
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
}
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

      // Step 1: Get user's own vehicles (always works with basic RLS)
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

      // Step 2: Get user's group memberships
      const { data: groupMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      console.log('👥 User is member of groups:', groupMemberships?.length || 0);

      let groupVehicles: any[] = [];

      if (groupMemberships && groupMemberships.length > 0) {
        const groupIds = groupMemberships.map(gm => gm.group_id);

        // Get all other members of these groups
        const { data: allGroupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds)
          .neq('user_id', user.id);

        console.log('👥 Other group members found:', allGroupMembers?.length || 0);

        if (allGroupMembers && allGroupMembers.length > 0) {
          const memberUserIds = [...new Set(allGroupMembers.map(gm => gm.user_id))];

          // Also get group owners' user IDs (owners can share vehicles with members)
          const { data: groupOwners } = await supabase
            .from('groups')
            .select('owner_id')
            .in('id', groupIds);

          const ownerUserIds = groupOwners ? [...new Set(groupOwners.map(g => g.owner_id))] : [];

          // Combine members and owners, but exclude current user
          const allPotentialShareholders = [...new Set([...memberUserIds, ...ownerUserIds])]
            .filter(id => id !== user.id);

          console.log('🔍 Debug: Group member user IDs:', memberUserIds);
          console.log('🔍 Debug: Group owner user IDs:', ownerUserIds);
          console.log('🔍 Debug: All potential shareholders:', allPotentialShareholders);

          // PRIVACY-FIRST: Only get vehicles explicitly marked as shared
          // NO FALLBACKS that could expose private vehicles
          try {
            const { data: sharedVehicles, error: sharedError } = await supabase
              .from('vehicles')
              .select('*')
              .in('user_id', allPotentialShareholders)
              .eq('shared_with_groups', true)
              .order('created_at', { ascending: false });

            console.log('🔍 Debug: Shared vehicles query result:', {
              error: sharedError,
              vehicleCount: sharedVehicles?.length || 0,
              vehicles: sharedVehicles?.map(v => ({
                id: v.id,
                make: v.make,
                model: v.model,
                owner: v.user_id,
                shared: v.shared_with_groups
              }))
            });

            if (!sharedError && sharedVehicles) {
              groupVehicles = sharedVehicles;
              console.log('✅ Found shared vehicles from group members:', groupVehicles.length);

              if (groupVehicles.length === 0) {
                console.log('ℹ️ No shared vehicles found. Possible reasons:');
                console.log('   1. No vehicles marked as shared_with_groups = true');
                console.log('   2. Vehicle owners need to enable sharing');
                console.log('   3. All vehicles are private (shared_with_groups = false)');
              }
            } else if (sharedError) {
              console.log('⚠️ Error fetching shared vehicles:', sharedError);
              console.log('🔍 Full error details:', {
                message: sharedError.message,
                code: sharedError.code,
                details: sharedError.details,
                hint: sharedError.hint
              });

              // Check if error is due to missing column
              if (sharedError.message.includes('shared_with_groups') || sharedError.code === '42703') {
                console.log('🔒 shared_with_groups column missing - sharing feature unavailable');
                console.log('🔒 PRIVACY PROTECTED: Not showing any group vehicles until database is fixed');
                console.log('💡 SOLUTION: Run fix-vehicle-sharing-complete.sql in Supabase');
              } else {
                console.log('🔒 Unknown database error - maintaining privacy');
              }
              // NO FALLBACK - maintain privacy
              groupVehicles = [];
            } else {
              console.log('ℹ️ No shared vehicles found (this is normal if no vehicles are shared)');
              console.log('💡 TIP: Vehicle owners can enable sharing in vehicle settings');
              groupVehicles = [];
            }
          } catch (error: any) {
            console.log('⚠️ Error accessing vehicle sharing:', error.message);
            console.log('🔍 Full catch error:', error);

            // Check if it's a column missing error
            if (error.message?.includes('shared_with_groups') || error.code === '42703') {
              console.log('🔒 shared_with_groups column missing - sharing feature unavailable');
              console.log('🔒 PRIVACY PROTECTED: Not showing any group vehicles until database is fixed');
              console.log('💡 SOLUTION: Run fix-vehicle-sharing-complete.sql in Supabase');
            } else {
              console.log('🔒 Unknown error in vehicle sharing - maintaining privacy');
            }
            // CRITICAL: NO FALLBACK that exposes private vehicles
            groupVehicles = [];
          }
        } else {
          console.log('ℹ️ No group members found');

          // Still check for group owners even if no other members
          const { data: groupOwners } = await supabase
            .from('groups')
            .select('owner_id')
            .in('id', groupIds);

          const ownerUserIds = groupOwners ? [...new Set(groupOwners.map(g => g.owner_id))] : [];
          const potentialOwnerShareholders = ownerUserIds.filter(id => id !== user.id);

          console.log('🔍 Debug: Group owner user IDs (when no members):', ownerUserIds);

          if (potentialOwnerShareholders.length > 0) {
            try {
              const { data: ownerSharedVehicles, error: ownerSharedError } = await supabase
                .from('vehicles')
                .select('*')
                .in('user_id', potentialOwnerShareholders)
                .eq('shared_with_groups', true)
                .order('created_at', { ascending: false });

              if (!ownerSharedError && ownerSharedVehicles) {
                groupVehicles = ownerSharedVehicles;
                console.log('✅ Found shared vehicles from group owners:', groupVehicles.length);
              } else {
                console.log('ℹ️ No shared vehicles from group owners');
                groupVehicles = [];
              }
            } catch (error) {
              console.log('⚠️ Error fetching owner shared vehicles:', error);
              groupVehicles = [];
            }
          } else {
            console.log('ℹ️ No group owners to check for shared vehicles');
          }
        }
      }

      // Step 3: Get owner profiles for group vehicles
      let ownerProfiles: any[] = [];
      if (groupVehicles.length > 0) {
        const ownerIds = [...new Set(groupVehicles.map(v => v.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ownerIds);
        ownerProfiles = profiles || [];
        console.log('👤 Owner profiles fetched:', ownerProfiles.length);
      }

      // Step 4: Mark vehicles with proper metadata
      const ownVehiclesMarked: VehicleWithGroupInfo[] = (ownVehicles || []).map(vehicle => ({
        ...vehicle,
        is_group_vehicle: false,
        owner_profile: null
      }));

      const groupVehiclesMarked: VehicleWithGroupInfo[] = groupVehicles.map(vehicle => ({
        ...vehicle,
        is_group_vehicle: true,
        owner_profile: ownerProfiles.find(p => p.id === vehicle.user_id) || null
      }));

      console.log('🎉 Vehicle fetch completed:', {
        userId: user.id,
        userEmail: (ownVehicles?.[0] ? 'found' : 'not found'),
        ownVehicles: ownVehiclesMarked.length,
        sharedVehicles: groupVehiclesMarked.length,
        totalGroups: groupMemberships?.length || 0,
        sharedOwnVehicles: ownVehiclesMarked.filter(v => v.shared_with_groups).length,
        detailedBreakdown: {
          ownVehicleIds: ownVehiclesMarked.map(v => v.id),
          sharedVehicleIds: groupVehiclesMarked.map(v => v.id),
          sharedVehicleOwners: groupVehiclesMarked.map(v => v.owner_profile?.email || 'unknown')
        }
      });

      // Return vehicles separately marked for easier UI handling
      const result = [...ownVehiclesMarked, ...groupVehiclesMarked];
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { data: result, error: null, loading: false };
    } catch (error) {
      console.error('💥 Unexpected error fetching vehicles:', error);
      return { data: null, error: 'Failed to fetch vehicles', loading: false };
    }
  }

  // New method to get vehicles separated by type for cleaner UI
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

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          ...vehicle,
          user_id: user.id,
          shared_with_groups: vehicle.shared_with_groups ?? false,
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

  static async toggleVehicleSharing(vehicleId: string, shared: boolean): Promise<ApiResponse<Vehicle>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Verify the user owns this vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('user_id')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) {
        console.error('Error fetching vehicle:', vehicleError);
        return { data: null, error: 'Vehicle not found', loading: false };
      }

      if (vehicle.user_id !== user.id) {
        return { data: null, error: 'You can only modify your own vehicles', loading: false };
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update({
          shared_with_groups: shared,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle sharing:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error toggling vehicle sharing:', error);
      return { data: null, error: 'Failed to update vehicle sharing', loading: false };
    }
  }
}
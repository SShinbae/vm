// =====================================================
// ENHANCED DATABASE TYPES V2
// =====================================================
// Support for:
// - Selective group sharing
// - Image uploads (vehicles & profiles)
// - Enhanced vehicle and profile data
// =====================================================

export interface Database {
  public: {
    Tables: {
      // =================== PROFILES ===================
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null  // NEW: Profile picture
          phone: string | null       // NEW: Phone number
          bio: string | null         // NEW: User bio
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          updated_at?: string
        }
      }

      // =================== VEHICLES ===================
      vehicles: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          year: number
          license_plate: string
          vin: string | null
          main_image_url: string | null  // NEW: Main vehicle photo
          color: string | null           // NEW: Vehicle color
          current_mileage: number        // NEW: Current mileage
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          make: string
          model: string
          year: number
          license_plate: string
          vin?: string | null
          main_image_url?: string | null
          color?: string | null
          current_mileage?: number
        }
        Update: {
          make?: string
          model?: string
          year?: number
          license_plate?: string
          vin?: string | null
          main_image_url?: string | null
          color?: string | null
          current_mileage?: number
          updated_at?: string
        }
      }

      // =================== NEW: VEHICLE IMAGES ===================
      vehicle_images: {
        Row: {
          id: string
          vehicle_id: string
          image_url: string
          image_type: 'profile_avatar' | 'vehicle_main' | 'vehicle_gallery'
          caption: string | null
          display_order: number
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          image_url: string
          image_type?: 'profile_avatar' | 'vehicle_main' | 'vehicle_gallery'
          caption?: string | null
          display_order?: number
          uploaded_by?: string | null
        }
        Update: {
          image_url?: string
          image_type?: 'profile_avatar' | 'vehicle_main' | 'vehicle_gallery'
          caption?: string | null
          display_order?: number
          updated_at?: string
        }
      }

      // =================== NEW: SELECTIVE SHARING ===================
      vehicle_group_shares: {
        Row: {
          id: string
          vehicle_id: string
          group_id: string
          shared_by: string
          shared_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          group_id: string
          shared_by: string
        }
        Update: {
          // Shares are typically not updated, just added/removed
        }
      }

      // =================== GROUPS ===================
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
        }
        Update: {
          name?: string
          description?: string | null
          updated_at?: string
        }
      }

      // =================== GROUP MEMBERS ===================
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
        }
        Update: {
          // No updates needed for group membership
        }
      }

      // =================== GROUP INVITATIONS ===================
      group_invitations: {
        Row: {
          id: string
          group_id: string
          email: string
          invited_by: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          group_id: string
          email: string
          invited_by: string
          status?: 'pending'
          expires_at: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
        }
      }

      // =================== LOGS (Enhanced for shared vehicles) ===================
      mileage_logs: {
        Row: {
          id: string
          vehicle_id: string
          user_id: string
          odometer_reading: number
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_id: string
          odometer_reading: number
          date: string
          notes?: string | null
        }
        Update: {
          odometer_reading?: number
          date?: string
          notes?: string | null
        }
      }

      fuel_logs: {
        Row: {
          id: string
          vehicle_id: string
          user_id: string
          liters_filled: number
          cost: number | null
          date: string
          odometer_reading: number
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_id: string
          liters_filled: number
          cost?: number | null
          date: string
          odometer_reading: number
          location?: string | null
        }
        Update: {
          liters_filled?: number
          cost?: number | null
          date?: string
          odometer_reading?: number
          location?: string | null
        }
      }

      service_logs: {
        Row: {
          id: string
          vehicle_id: string
          user_id: string
          service_type: string
          description: string
          cost: number | null
          date: string
          odometer_reading: number
          next_service_due: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_id: string
          service_type: string
          description: string
          cost?: number | null
          date: string
          odometer_reading: number
          next_service_due?: string | null
        }
        Update: {
          service_type?: string
          description?: string
          cost?: number | null
          date?: string
          odometer_reading?: number
          next_service_due?: string | null
        }
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      get_user_vehicles_with_sharing: {
        Args: {
          user_uuid: string
        }
        Returns: {
          vehicle_id: string
          make: string
          model: string
          year: number
          license_plate: string
          vin: string | null
          main_image_url: string | null
          color: string | null
          current_mileage: number | null
          created_at: string
          updated_at: string
          is_own_vehicle: boolean
          owner_name: string | null
          owner_email: string
          shared_groups: string[]
        }[]
      }
      share_vehicle_with_groups: {
        Args: {
          vehicle_uuid: string
          group_uuids: string[]
        }
        Returns: boolean
      }
      get_user_invitations_with_details: {
        Args: {
          user_email: string
        }
        Returns: {
          invitation_id: string
          group_id: string
          group_name: string
          group_description: string | null
          invited_by_id: string
          invited_by_name: string | null
          invited_by_email: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          expires_at: string
        }[]
      }
      get_group_invitations_with_details: {
        Args: {
          group_uuid: string
        }
        Returns: {
          invitation_id: string
          invited_email: string
          invited_by_id: string
          invited_by_name: string | null
          invited_by_email: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          expires_at: string
        }[]
      }
    }

    Enums: {
      invitation_status: 'pending' | 'accepted' | 'declined' | 'expired'
      service_type:
        | 'oil_change'
        | 'tire_rotation'
        | 'brake_service'
        | 'general_maintenance'
        | 'repair'
        | 'inspection'
        | 'other'
      image_type: 'profile_avatar' | 'vehicle_main' | 'vehicle_gallery'
    }
  }
}

// =====================================================
// ENHANCED APPLICATION TYPES
// =====================================================

// Base types from database
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export type VehicleImage = Database['public']['Tables']['vehicle_images']['Row']
export type VehicleImageInsert = Database['public']['Tables']['vehicle_images']['Insert']
export type VehicleImageUpdate = Database['public']['Tables']['vehicle_images']['Update']

export type VehicleGroupShare = Database['public']['Tables']['vehicle_group_shares']['Row']
export type VehicleGroupShareInsert = Database['public']['Tables']['vehicle_group_shares']['Insert']

export type Group = Database['public']['Tables']['groups']['Row']
export type GroupInsert = Database['public']['Tables']['groups']['Insert']
export type GroupUpdate = Database['public']['Tables']['groups']['Update']

export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert']

export type GroupInvitation = Database['public']['Tables']['group_invitations']['Row']
export type GroupInvitationInsert = Database['public']['Tables']['group_invitations']['Insert']
export type GroupInvitationUpdate = Database['public']['Tables']['group_invitations']['Update']

// Log types
export type MileageLog = Database['public']['Tables']['mileage_logs']['Row']
export type MileageLogInsert = Database['public']['Tables']['mileage_logs']['Insert']
export type MileageLogUpdate = Database['public']['Tables']['mileage_logs']['Update']

export type FuelLog = Database['public']['Tables']['fuel_logs']['Row']
export type FuelLogInsert = Database['public']['Tables']['fuel_logs']['Insert']
export type FuelLogUpdate = Database['public']['Tables']['fuel_logs']['Update']

export type ServiceLog = Database['public']['Tables']['service_logs']['Row']
export type ServiceLogInsert = Database['public']['Tables']['service_logs']['Insert']
export type ServiceLogUpdate = Database['public']['Tables']['service_logs']['Update']

// =====================================================
// ENHANCED COMPOSITE TYPES
// =====================================================

// Enhanced vehicle with sharing and image info
export interface VehicleWithDetails extends Vehicle {
  is_own_vehicle: boolean
  owner_profile?: Profile | null
  images: VehicleImage[]
  shared_groups: Group[]
  // Log arrays for UI components
  mileage_logs?: MileageLog[]
  fuel_logs?: FuelLog[]
  service_logs?: ServiceLog[]
  sharing_info?: {
    is_shared: boolean
    shared_with_groups: string[]
    total_shares: number
  }
  logs?: {
    latest_mileage?: MileageLog
    latest_fuel?: FuelLog
    latest_service?: ServiceLog
    counts?: {
      fuel_count: number
      service_count: number
      mileage_count: number
      access_status?: {
        fuel_accessible: boolean
        service_accessible: boolean
        mileage_accessible: boolean
        has_permission_issues: boolean
      }
    }
  }
}

// Enhanced profile with avatar
export interface ProfileWithAvatar extends Profile {
  avatar_url: string | null
  vehicles_count?: number
  groups_owned_count?: number
  groups_member_count?: number
}

// Enhanced group with members and sharing info
export interface GroupWithDetails extends Group {
  members: (GroupMember & { profile: Profile })[]
  member_count: number
  shared_vehicles: VehicleWithDetails[]
  sharing_stats: {
    total_vehicles_shared: number
    total_images_shared: number
    most_active_sharer?: Profile
  }
}

// Group invitation with related data
export interface GroupInvitationWithDetails extends GroupInvitation {
  group?: Group | null
  inviter?: Profile | null
}

// =====================================================
// FORM TYPES
// =====================================================

// Enhanced vehicle form data
export interface VehicleFormData {
  make: string
  model: string
  year: number
  license_plate: string
  vin?: string
  color?: string
  current_mileage?: number
  main_image?: File | null  // For image upload
  shared_with_groups?: string[]  // Array of group IDs
}

// Profile form data with image
export interface ProfileFormData {
  full_name?: string
  phone?: string
  bio?: string
  avatar?: File | null  // For avatar upload
}

// Image upload data
export interface ImageUploadData {
  file: File
  type: 'profile_avatar' | 'vehicle_main' | 'vehicle_gallery'
  caption?: string
  vehicle_id?: string  // Required for vehicle images
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

// Specific API responses
export type VehiclesResponse = ApiResponse<VehicleWithDetails[]>
export type VehicleResponse = ApiResponse<VehicleWithDetails>
export type GroupsResponse = ApiResponse<GroupWithDetails[]>
export type GroupResponse = ApiResponse<GroupWithDetails>
export type ProfileResponse = ApiResponse<ProfileWithAvatar>

// =====================================================
// SHARING TYPES
// =====================================================

// Vehicle sharing configuration
export interface VehicleSharingConfig {
  vehicle_id: string
  shared_groups: {
    group_id: string
    group_name: string
    member_count: number
    shared_at?: string
  }[]
  is_sharing_enabled: boolean
  total_shares: number
}

// Group sharing permissions
export interface GroupSharingPermissions {
  group_id: string
  can_view_shared_vehicles: boolean
  can_view_logs: boolean
  shared_vehicles_count: number
  recent_shares: {
    vehicle_id: string
    vehicle_name: string
    shared_by: string
    shared_at: string
  }[]
}

// =====================================================
// IMAGE TYPES
// =====================================================

// Image with metadata
export interface ImageWithMetadata {
  id: string
  url: string
  type: 'profile_avatar' | 'vehicle_main' | 'vehicle_gallery'
  caption?: string
  size?: number
  uploaded_at: string
  uploaded_by?: Profile
}

// Image upload result
export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
  metadata?: {
    size: number
    type: string
    dimensions?: {
      width: number
      height: number
    }
  }
}

// =====================================================
// STORAGE TYPES
// =====================================================

export interface StorageBucket {
  id: string
  name: string
  public: boolean
  max_file_size?: number
  allowed_types?: string[]
}

export interface StorageFile {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, any>
}

// =====================================================
// UTILITY TYPES
// =====================================================

// Pagination
export interface PaginationParams {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
    has_next: boolean
    has_prev: boolean
  }
}

// Search and filtering
export interface VehicleFilters {
  make?: string
  model?: string
  year_from?: number
  year_to?: number
  shared_only?: boolean
  own_only?: boolean
  group_id?: string
}

export interface GroupFilters {
  owned_only?: boolean
  member_only?: boolean
  has_shared_vehicles?: boolean
}

// =====================================================
// ERROR TYPES
// =====================================================

export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// =====================================================
// EXPORT ENHANCED TYPES
// =====================================================

export type {
    Database as DatabaseV2
}

// Legacy compatibility (for gradual migration)
export interface LegacyVehicle extends Omit<Vehicle, 'main_image_url' | 'color' | 'current_mileage'> {
  shared_with_groups?: boolean  // Old boolean field
}

export interface MigrationStatus {
  vehicles_migrated: number
  images_processed: number
  shares_converted: number
  errors: string[]
  completed: boolean
}
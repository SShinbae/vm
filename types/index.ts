import { Database } from './database';

// Database table types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type GroupInvitation = Database['public']['Tables']['group_invitations']['Row'];
export type MileageLog = Database['public']['Tables']['mileage_logs']['Row'];
export type FuelLog = Database['public']['Tables']['fuel_logs']['Row'];
export type ServiceLog = Database['public']['Tables']['service_logs']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type GroupInsert = Database['public']['Tables']['groups']['Insert'];
export type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert'];
export type GroupInvitationInsert = Database['public']['Tables']['group_invitations']['Insert'];
export type MileageLogInsert = Database['public']['Tables']['mileage_logs']['Insert'];
export type FuelLogInsert = Database['public']['Tables']['fuel_logs']['Insert'];
export type ServiceLogInsert = Database['public']['Tables']['service_logs']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];
export type GroupUpdate = Database['public']['Tables']['groups']['Update'];
export type GroupInvitationUpdate = Database['public']['Tables']['group_invitations']['Update'];
export type MileageLogUpdate = Database['public']['Tables']['mileage_logs']['Update'];
export type FuelLogUpdate = Database['public']['Tables']['fuel_logs']['Update'];
export type ServiceLogUpdate = Database['public']['Tables']['service_logs']['Update'];

// Enum types
export type InvitationStatus = Database['public']['Enums']['invitation_status'];
export type ServiceType = Database['public']['Enums']['service_type'];

// Extended types with joins
export interface VehicleWithLogs extends Vehicle {
  mileage_logs?: MileageLog[];
  fuel_logs?: FuelLog[];
  service_logs?: ServiceLog[];
}

export interface VehicleWithGroupInfo extends Vehicle {
  
  is_group_vehicle?: boolean;
  owner_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  // New sharing properties for V2 system
  shared_groups?: {
    id: string;
    name: string;
    description?: string;
  }[];
  sharing_info?: {
    is_shared: boolean;
    shared_groups: string[];
    total_shares: number;
  };
}

export interface GroupWithMembers extends Group {
  group_members?: (GroupMember & { profiles: Profile })[];
  member_count?: number;
}

export interface GroupInvitationWithDetails extends GroupInvitation {
  groups?: Group;
  profiles?: Profile;
  invited_by_profile?: Profile;
}

// Form types
export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
}

export interface MileageLogFormData {
  vehicle_id: string;
  odometer_reading: number;
  date: string;
  notes?: string;
}

export interface FuelLogFormData {
  vehicle_id: string;
  liters_filled: number;
  cost?: number;
  date: string;
  odometer_reading: number;
  location?: string;
}

export interface ServiceLogFormData {
  vehicle_id: string;
  service_type: ServiceType;
  description: string;
  cost?: number;
  date: string;
  odometer_reading: number;
  next_service_due?: string;
}

export interface GroupFormData {
  name: string;
  description?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  modal: undefined;
  '(auth)': undefined;
};

export type TabStackParamList = {
  index: undefined;
  vehicles: undefined;
  logs: undefined;
  groups: undefined;
  profile: undefined;
};

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
};
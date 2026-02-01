/**
 * Central type exports for the vehicles management app
 *
 * This file re-exports generated database types and defines extended types
 * for use throughout the application.
 */

import { Database } from "./database.generated";

// Re-export the Database type
export type { Database };

// ============================================================================
// Database Table Row Types
// ============================================================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupInvitation =
  Database["public"]["Tables"]["group_invitations"]["Row"];
export type MileageLog = Database["public"]["Tables"]["mileage_logs"]["Row"];
export type FuelLog = Database["public"]["Tables"]["fuel_logs"]["Row"];
export type ServiceLog = Database["public"]["Tables"]["service_logs"]["Row"];
export type VehicleImage =
  Database["public"]["Tables"]["vehicle_images"]["Row"];
export type VehicleGroupShare =
  Database["public"]["Tables"]["vehicle_group_shares"]["Row"];
export type PushToken = Database["public"]["Tables"]["push_tokens"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type ServiceTemplate =
  Database["public"]["Tables"]["service_templates"]["Row"];
export type ServiceTemplateItem =
  Database["public"]["Tables"]["service_template_items"]["Row"];

// ============================================================================
// Database Insert Types
// ============================================================================

export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
export type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];
export type GroupMemberInsert =
  Database["public"]["Tables"]["group_members"]["Insert"];
export type GroupInvitationInsert =
  Database["public"]["Tables"]["group_invitations"]["Insert"];
export type MileageLogInsert =
  Database["public"]["Tables"]["mileage_logs"]["Insert"];
export type FuelLogInsert = Database["public"]["Tables"]["fuel_logs"]["Insert"];
export type ServiceLogInsert =
  Database["public"]["Tables"]["service_logs"]["Insert"];
export type VehicleImageInsert =
  Database["public"]["Tables"]["vehicle_images"]["Insert"];
export type VehicleGroupShareInsert =
  Database["public"]["Tables"]["vehicle_group_shares"]["Insert"];
export type PushTokenInsert =
  Database["public"]["Tables"]["push_tokens"]["Insert"];
export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];
export type ServiceTemplateInsert =
  Database["public"]["Tables"]["service_templates"]["Insert"];
export type ServiceTemplateItemInsert =
  Database["public"]["Tables"]["service_template_items"]["Insert"];

// ============================================================================
// Database Update Types
// ============================================================================

export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type VehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];
export type GroupUpdate = Database["public"]["Tables"]["groups"]["Update"];
export type GroupInvitationUpdate =
  Database["public"]["Tables"]["group_invitations"]["Update"];
export type MileageLogUpdate =
  Database["public"]["Tables"]["mileage_logs"]["Update"];
export type FuelLogUpdate = Database["public"]["Tables"]["fuel_logs"]["Update"];
export type ServiceLogUpdate =
  Database["public"]["Tables"]["service_logs"]["Update"];
export type VehicleImageUpdate =
  Database["public"]["Tables"]["vehicle_images"]["Update"];
export type PushTokenUpdate =
  Database["public"]["Tables"]["push_tokens"]["Update"];
export type NotificationUpdate =
  Database["public"]["Tables"]["notifications"]["Update"];
export type ServiceTemplateUpdate =
  Database["public"]["Tables"]["service_templates"]["Update"];
export type ServiceTemplateItemUpdate =
  Database["public"]["Tables"]["service_template_items"]["Update"];

// ============================================================================
// Enum Types
// ============================================================================

export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];
export type ServiceType = Database["public"]["Enums"]["service_type"];
export type ImageType = Database["public"]["Enums"]["image_type"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type PlatformType = Database["public"]["Enums"]["platform_type"];

// ============================================================================
// Extended Types with Joins/Relations
// ============================================================================

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

export interface VehicleWithImages extends Vehicle {
  vehicle_images?: VehicleImage[];
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

export interface ServiceTemplateWithItems extends ServiceTemplate {
  items: ServiceTemplateItem[];
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
  color?: string;
  main_image_url?: string;
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
  cost: number;
  fuel_price: number;
  date: string;
  odometer_reading: number;
  location?: string;
}

export interface ServiceLogItem {
  description: string;
  price: number;
}

export interface ServiceLogFormData {
  vehicle_id: string;
  service_type: ServiceType;
  description: string;
  cost?: number;
  items?: ServiceLogItem[];
  date: string;
  odometer_reading: number;
  next_service_due?: string;
  receipt_image_url?: string;
  ocr_extracted_data?: OCRExtractedData;
  auto_filled?: boolean;
}

export interface GroupFormData {
  name: string;
  description?: string;
}

export interface ServiceTemplateFormData {
  name: string;
  description?: string;
  items: ServiceItemFormData[];
}

export interface ServiceItemFormData {
  description: string;
  price: number;
}

// ============================================================================
// OCR Types
// ============================================================================

export interface OCRExtractedData {
  raw_text: string;
  confidence: number;
  extracted_fields: {
    service_type?: string;
    description?: string;
    cost?: number;
    date?: string;
    odometer_reading?: number;
    business_name?: string;
    confidence_scores?: {
      service_type?: number;
      description?: number;
      cost?: number;
      date?: number;
      odometer_reading?: number;
    };
  };
  processing_timestamp: string;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
  username: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  fullName: string;
  username?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  confidence?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Result Types (for service layer)
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ============================================================================
// Navigation Types
// ============================================================================

export type RootStackParamList = {
  "(tabs)": undefined;
  modal: undefined;
  "(auth)": undefined;
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
  "forgot-password": undefined;
  "reset-password": undefined;
};

// ============================================================================
// Filter Types
// ============================================================================

export interface VehicleFilters {
  search?: string;
  make?: string;
  year?: number;
  sortBy?: "created_at" | "make" | "model" | "year";
  sortOrder?: "asc" | "desc";
}

export interface LogFilters {
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  type?: ServiceType;
  sortBy?: "date" | "cost" | "odometer_reading";
  sortOrder?: "asc" | "desc";
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsSummary {
  totalVehicles: number;
  totalFuelCost: number;
  totalServiceCost: number;
  totalMileage: number;
  averageFuelEfficiency: number;
  averageCostPerKm: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

// Re-export analytics and chart types
export type {
  AnalyticsPeriod,
  CustomDateRange,
  CostMetrics,
  FuelEfficiencyMetrics,
  ServiceMetrics,
  UpcomingService,
  VehiclePerformance,
  TrendDataPoint,
  TrendAnalysis,
  ChartGrouping,
  ChartData,
  CostChartDataPoint,
  ChartDataset,
  PieChartDataPoint as AnalyticsPieChartDataPoint,
  LocationCostData,
  AnalyticsFilters,
  AnalyticsData,
  VehicleWithAnalyticsLogs,
  AnalyticsResponse,
} from "./analytics";

export type {
  VictoryChartConfig,
  ChartTheme,
  LineChartDataPoint,
  LineChartProps,
  BarChartDataPoint,
  BarChartProps,
  StackedBarChartData,
  StackedBarChartProps,
  AreaChartDataPoint,
  AreaChartProps,
  PieChartDataPoint,
  PieChartProps,
  ChartTooltipData,
  LegendItem,
  ChartLegendProps,
  ChartDimensions,
  ChartAnimationConfig,
} from "./charts";

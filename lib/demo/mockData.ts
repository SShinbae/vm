/**
 * Mock Data for Demo Mode
 *
 * This file contains all the hardcoded mock data used in demo mode.
 * Data is structured to match the actual database schema.
 */

import type { Group } from "@/types/database-v2";

// Extended types for demo mode (includes additional fields not in database)
export interface DemoProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoVehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string | null;
  main_image_url?: string | null;
  color: string | null;
  current_mileage: number;
  fuel_type?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoFuelLog {
  id: string;
  vehicle_id: string;
  user_id: string;
  liters_filled: number;
  cost: number | null;
  fuel_price?: number | null;
  date: string;
  odometer_reading: number;
  location: string | null;
  created_at: string;
}

export interface DemoServiceLog {
  id: string;
  vehicle_id: string;
  user_id: string;
  service_type: string;
  description: string;
  cost: number | null;
  date: string;
  odometer_reading: number;
  next_service_due: string | null;
  created_at: string;
}

export interface DemoMileageLog {
  id: string;
  vehicle_id: string;
  user_id: string;
  odometer_reading: number;
  date: string;
  notes: string | null;
  created_at: string;
}

// Demo User Profile
export const DEMO_USER: DemoProfile = {
  id: "demo-user-001",
  email: "demo@example.com",
  full_name: "Ahmad bin Abdullah",
  avatar_url: null,
  phone: "+60123456789",
  bio: "Selamat datang! Explore all features with sample data.",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// Demo Vehicles
export const DEMO_VEHICLES: DemoVehicle[] = [
  {
    id: "demo-vehicle-001",
    user_id: "demo-user-001",
    make: "Perodua",
    model: "Myvi",
    year: 2021,
    vin: "PMYVI20210001234",
    license_plate: "WXY 1234",
    color: "Red",
    current_mileage: 45230,
    fuel_type: "Petrol",
    notes: "Kereta harian, dalam keadaan sangat baik",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-12-15T10:30:00Z",
  },
  {
    id: "demo-vehicle-002",
    user_id: "demo-user-001",
    make: "Proton",
    model: "X70",
    year: 2023,
    vin: "PX7020230005678",
    license_plate: "ABC 5678",
    color: "White",
    current_mileage: 12450,
    fuel_type: "Petrol",
    notes: "SUV keluarga, sangat selesa untuk perjalanan jauh",
    created_at: "2024-02-15T00:00:00Z",
    updated_at: "2024-12-20T14:20:00Z",
  },
  {
    id: "demo-vehicle-003",
    user_id: "demo-user-001",
    make: "Honda",
    model: "City",
    year: 2020,
    vin: "HCITY20200009012",
    license_plate: "KLM 9012",
    color: "Silver",
    current_mileage: 58920,
    fuel_type: "Petrol",
    notes: "Sedan yang jimat minyak, sangat dipercayai",
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-12-28T09:15:00Z",
  },
];

// Demo Fuel Logs
export const DEMO_FUEL_LOGS: DemoFuelLog[] = [
  // Perodua Myvi logs
  {
    id: "demo-fuel-001",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-12-01T08:30:00Z",
    odometer_reading: 44800,
    liters_filled: 32.5,
    cost: 89.38,
    location: "Petronas",
    created_at: "2024-12-01T08:30:00Z",
  },
  {
    id: "demo-fuel-002",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-12-08T17:45:00Z",
    odometer_reading: 45100,
    liters_filled: 30.8,
    cost: 85.62,
    location: "Shell Malaysia",
    created_at: "2024-12-08T17:45:00Z",
  },
  {
    id: "demo-fuel-003",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-12-15T10:20:00Z",
    odometer_reading: 45230,
    liters_filled: 25.2,
    cost: 69.8,
    location: "Caltex",
    created_at: "2024-12-15T10:20:00Z",
  },
  // Proton X70 logs
  {
    id: "demo-fuel-004",
    vehicle_id: "demo-vehicle-002",
    user_id: "demo-user-001",
    date: "2024-12-05T14:15:00Z",
    odometer_reading: 12100,
    liters_filled: 45.3,
    cost: 133.64,
    location: "Petronas",
    created_at: "2024-12-05T14:15:00Z",
  },
  {
    id: "demo-fuel-005",
    vehicle_id: "demo-vehicle-002",
    user_id: "demo-user-001",
    date: "2024-12-12T09:30:00Z",
    odometer_reading: 12350,
    liters_filled: 42.9,
    cost: 127.84,
    location: "Shell Malaysia",
    created_at: "2024-12-12T09:30:00Z",
  },
  {
    id: "demo-fuel-006",
    vehicle_id: "demo-vehicle-002",
    user_id: "demo-user-001",
    date: "2024-12-20T16:00:00Z",
    odometer_reading: 12450,
    liters_filled: 38.5,
    cost: 113.96,
    location: "BHP Petrol",
    created_at: "2024-12-20T16:00:00Z",
  },
  // Honda City logs
  {
    id: "demo-fuel-007",
    vehicle_id: "demo-vehicle-003",
    user_id: "demo-user-001",
    date: "2024-12-03T11:00:00Z",
    odometer_reading: 58500,
    liters_filled: 35.0,
    cost: 96.25,
    location: "Petronas",
    created_at: "2024-12-03T11:00:00Z",
  },
  {
    id: "demo-fuel-008",
    vehicle_id: "demo-vehicle-003",
    user_id: "demo-user-001",
    date: "2024-12-18T15:30:00Z",
    odometer_reading: 58920,
    liters_filled: 33.5,
    cost: 92.46,
    location: "Shell Malaysia",
    created_at: "2024-12-18T15:30:00Z",
  },
];

// Demo Service Logs
export const DEMO_SERVICE_LOGS: DemoServiceLog[] = [
  {
    id: "demo-service-001",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-11-15T10:00:00Z",
    odometer_reading: 45000,
    service_type: "Tukar Minyak Enjin",
    description:
      "Minyak sintetik, penapis minyak baru - Perodua Service Center",
    cost: 180.0,
    next_service_due: "2025-02-15T00:00:00Z",
    created_at: "2024-11-15T10:00:00Z",
  },
  {
    id: "demo-service-002",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-10-20T14:30:00Z",
    odometer_reading: 44500,
    service_type: "Pusingan Tayar",
    description:
      "Semua tayar dipusingkan, tekanan diperiksa - Kedai Tayar Ahmad",
    cost: 80.0,
    next_service_due: "2025-04-20T00:00:00Z",
    created_at: "2024-10-20T14:30:00Z",
  },
  {
    id: "demo-service-003",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-09-10T09:00:00Z",
    odometer_reading: 44000,
    service_type: "Pemeriksaan Brek",
    description:
      "Pemeriksaan percuma - brek dalam keadaan baik - Perodua Service Center",
    cost: 0.0,
    next_service_due: null,
    created_at: "2024-09-10T09:00:00Z",
  },
  {
    id: "demo-service-004",
    vehicle_id: "demo-vehicle-002",
    user_id: "demo-user-001",
    date: "2024-12-01T11:30:00Z",
    odometer_reading: 12000,
    service_type: "Servis 10,000 KM",
    description:
      "Tukar minyak enjin, penapis, tambah cecair - Proton 3S Center",
    cost: 350.0,
    next_service_due: "2025-03-01T00:00:00Z",
    created_at: "2024-12-01T11:30:00Z",
  },
  {
    id: "demo-service-005",
    vehicle_id: "demo-vehicle-002",
    user_id: "demo-user-001",
    date: "2024-11-10T13:00:00Z",
    odometer_reading: 11800,
    service_type: "Tukar Penapis Udara",
    description: "Tukar penapis kabin dan enjin - Proton 3S Center",
    cost: 120.0,
    next_service_due: "2025-05-10T00:00:00Z",
    created_at: "2024-11-10T13:00:00Z",
  },
  {
    id: "demo-service-006",
    vehicle_id: "demo-vehicle-003",
    user_id: "demo-user-001",
    date: "2024-12-10T15:00:00Z",
    odometer_reading: 58500,
    service_type: "Tukar Minyak Enjin",
    description: "Minyak fully synthetic, penapis baru - Honda Service Center",
    cost: 220.0,
    next_service_due: "2025-06-10T00:00:00Z",
    created_at: "2024-12-10T15:00:00Z",
  },
];

// Demo Mileage Logs
export const DEMO_MILEAGE_LOGS: DemoMileageLog[] = [
  {
    id: "demo-mileage-001",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-12-01T00:00:00Z",
    odometer_reading: 44800,
    notes: "Beginning of month reading",
    created_at: "2024-12-01T00:00:00Z",
  },
  {
    id: "demo-mileage-002",
    vehicle_id: "demo-vehicle-001",
    user_id: "demo-user-001",
    date: "2024-12-15T00:00:00Z",
    odometer_reading: 45230,
    notes: "Mid-month check",
    created_at: "2024-12-15T00:00:00Z",
  },
  {
    id: "demo-mileage-003",
    vehicle_id: "demo-vehicle-002",
    user_id: "demo-user-001",
    date: "2024-12-01T00:00:00Z",
    odometer_reading: 62100,
    notes: null,
    created_at: "2024-12-01T00:00:00Z",
  },
  {
    id: "demo-mileage-004",
    vehicle_id: "demo-vehicle-002",
    user_id: "demo-user-001",
    date: "2024-12-20T00:00:00Z",
    odometer_reading: 62450,
    notes: null,
    created_at: "2024-12-20T00:00:00Z",
  },
];

// Demo Groups
export const DEMO_GROUPS: Group[] = [
  {
    id: "demo-group-001",
    name: "Family Vehicles",
    description: "Shared vehicles among family members",
    owner_id: "demo-user-001",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "demo-group-002",
    name: "Company Fleet",
    description: "Work vehicles for business use",
    owner_id: "demo-user-001",
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z",
  },
];

// Demo Dashboard Statistics
export const DEMO_DASHBOARD_STATS = {
  totalVehicles: 3,
  totalFuelLogs: 8,
  totalServiceLogs: 6,
  totalMileageLogs: 4,
  totalCosts: {
    fuel: 808.95, // Total fuel costs in MYR
    service: 950.0, // Total service costs in MYR
    total: 1758.95, // Total costs in MYR
  },
  averageFuelEconomy: 12.5, // km/L (Malaysian standard)
  totalMilesDriven: 2850, // km
  upcomingServices: [
    {
      vehicleId: "demo-vehicle-001",
      vehicleName: "2021 Perodua Myvi",
      serviceType: "Tukar Minyak Enjin",
      dueDate: "2025-02-15",
      dueMileage: 50000,
      currentMileage: 45230,
    },
    {
      vehicleId: "demo-vehicle-001",
      vehicleName: "2021 Perodua Myvi",
      serviceType: "Pusingan Tayar",
      dueDate: "2025-04-20",
      dueMileage: 50500,
      currentMileage: 45230,
    },
  ],
};

// Demo Notifications
export const DEMO_NOTIFICATIONS = [
  {
    id: "demo-notif-001",
    user_id: "demo-user-001",
    title: "Peringatan Servis",
    message: "Tukar minyak enjin akan tiba untuk Perodua Myvi (dalam 2 bulan)",
    type: "service_reminder",
    read: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-notif-002",
    user_id: "demo-user-001",
    title: "Rekod Minyak Ditambah",
    message: "Rekod minyak baharu untuk Proton X70",
    type: "fuel_log",
    read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-notif-003",
    user_id: "demo-user-001",
    title: "Selamat Datang ke Mod Demo",
    message:
      "Terokai semua ciri dengan data sampel. Perubahan tidak akan disimpan.",
    type: "info",
    read: false,
    created_at: new Date().toISOString(),
  },
];

// Helper function to get mock data by ID
export const getMockVehicleById = (id: string) =>
  DEMO_VEHICLES.find((v) => v.id === id);

export const getMockFuelLogsByVehicleId = (vehicleId: string) =>
  DEMO_FUEL_LOGS.filter((log) => log.vehicle_id === vehicleId);

export const getMockServiceLogsByVehicleId = (vehicleId: string) =>
  DEMO_SERVICE_LOGS.filter((log) => log.vehicle_id === vehicleId);

export const getMockMileageLogsByVehicleId = (vehicleId: string) =>
  DEMO_MILEAGE_LOGS.filter((log) => log.vehicle_id === vehicleId);

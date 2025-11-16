# Senior Developer Task: Analytics Page Implementation

## Project Context

You're working on a React Native vehicle maintenance tracking app using Expo Router, React Native Unistyles for styling, Supabase as the backend, and TypeScript. The app tracks fuel logs, service logs, and mileage logs for multiple vehicles with group sharing capabilities.[^2][^3][^1]

## Objective

Build a comprehensive Analytics page with multiple tabs that provides actionable insights from existing vehicle maintenance data. Focus on core functionality and solid architecture - **no AI/ML features, no gamification, no external integrations**.

## File Structure to Create/Modify

### 1. New Type Definitions

**Location:** `types/analytics.ts`

Create comprehensive TypeScript interfaces:

```typescript
// Analytics-specific types
export interface AnalyticsPeriod {
  label: string;
  days: number;
  startDate: Date;
  endDate: Date;
}

export interface CostMetrics {
  totalFuelCost: number;
  totalServiceCost: number;
  totalCost: number;
  costPerKm: number;
  averageFuelCost: number;
  averageServiceCost: number;
}

export interface FuelEfficiencyMetrics {
  averageConsumption: number; // liters per 100km
  averageFuelPrice: number;
  totalLitersFilled: number;
  totalDistance: number;
  fuelUps: number;
  bestEfficiency: number;
  worstEfficiency: number;
}

export interface ServiceMetrics {
  totalServices: number;
  servicesByType: Record<ServiceType, number>;
  costByServiceType: Record<ServiceType, number>;
  averageServiceInterval: number; // in km
  upcomingServices: UpcomingService[];
}

export interface VehiclePerformance {
  vehicleId: string;
  vehicleName: string;
  totalDistance: number;
  fuelEfficiency: number;
  totalCost: number;
  costPerKm: number;
  serviceCount: number;
}

export interface UpcomingService {
  vehicleId: string;
  vehicleName: string;
  serviceType: ServiceType;
  currentMileage: number;
  serviceDueAt: number;
  daysUntilDue?: number;
  kmUntilDue: number;
  status: "overdue" | "due_soon" | "upcoming";
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  vehicleIds: string[]; // empty array means all vehicles
  groupId?: string; // for group-based analytics
}
```

### 2. Analytics Utilities

**Location:** `lib/analytics/calculations.ts`

Implement calculation functions:

```typescript
// Core calculation functions
export function calculateFuelEfficiency(
  fuelLogs: FuelLog[],
  mileageLogs: MileageLog[],
): FuelEfficiencyMetrics;

export function calculateCostMetrics(
  fuelLogs: FuelLog[],
  serviceLogs: ServiceLog[],
  totalDistance: number,
): CostMetrics;

export function calculateServiceMetrics(
  serviceLogs: ServiceLog[],
  vehicles: Vehicle[],
): ServiceMetrics;

export function getUpcomingServices(
  serviceLogs: ServiceLog[],
  vehicles: Vehicle[],
): UpcomingService[];

export function calculateVehicleComparison(
  vehicles: VehicleWithLogs[],
): VehiclePerformance[];

export function generateTrendData(
  logs: (FuelLog | ServiceLog)[],
  period: AnalyticsPeriod,
  metric: "cost" | "efficiency" | "frequency",
): TrendDataPoint[];

export function filterLogsByPeriod<T extends { date: string }>(
  logs: T[],
  startDate: Date,
  endDate: Date,
): T[];

export function groupLogsByMonth<T extends { date: string }>(
  logs: T[],
): Record<string, T[]>;
```

### 3. Analytics Data Hooks

**Location:** `hooks/useAnalytics.ts`

Create custom hooks for data fetching and processing:

```typescript
export function useAnalyticsData(filters: AnalyticsFilters) {
  // Fetch and process all logs based on filters
  // Return computed metrics
  return {
    loading: boolean;
    error: Error | null;
    costMetrics: CostMetrics;
    fuelMetrics: FuelEfficiencyMetrics;
    serviceMetrics: ServiceMetrics;
    vehicleComparison: VehiclePerformance[];
    refetch: () => void;
  };
}

export function useAnalyticsTrends(
  filters: AnalyticsFilters,
  metric: 'fuel' | 'service' | 'cost'
) {
  // Generate trend data for charts
}

export function usePeriodSelector() {
  // Manage period selection state
  const [period, setPeriod] = useState<AnalyticsPeriod>();
  const periods = useMemo(() => [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
  ], []);

  return { period, setPeriod, periods };
}
```

### 4. Analytics Screens

**Location:** `app/(tabs)/analytics/`

Create the following screen structure:

```
app/(tabs)/analytics/
├── _layout.tsx          # Tab navigator for analytics sub-sections
├── index.tsx            # Overview/Dashboard tab
├── fuel.tsx             # Fuel analytics tab
├── service.tsx          # Service analytics tab
└── performance.tsx      # Vehicle comparison tab
```

#### 4a. Analytics Layout

**File:** `app/(tabs)/analytics/_layout.tsx`

```typescript
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

export default function AnalyticsLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        // Use Unistyles theme colors
        // Add proper styling
      }}
    >
      <Tab.Screen name="index" options={{ title: 'Overview' }} />
      <Tab.Screen name="fuel" options={{ title: 'Fuel' }} />
      <Tab.Screen name="service" options={{ title: 'Service' }} />
      <Tab.Screen name="performance" options={{ title: 'Vehicles' }} />
    </Tab.Navigator>
  );
}
```

#### 4b. Overview Tab

**File:** `app/(tabs)/analytics/index.tsx`

Display:

- Period selector (7 days, 30 days, 3 months, 6 months, 1 year, custom)
- Vehicle multi-select filter
- Total cost summary card (fuel + service)
- Cost per km/mile card
- Active vehicles count
- Upcoming maintenance alerts (next 3 services due)
- Monthly trend chart (line chart showing costs over time)
- Quick stats grid (total fuel-ups, total services, total distance)

#### 4c. Fuel Analytics Tab

**File:** `app/(tabs)/analytics/fuel.tsx`

Display:

- Fuel efficiency metric (L/100km or MPG)
- Average fuel price trend
- Total fuel cost for period
- Fuel consumption chart (bar chart by month)
- Location-based cost comparison (if location data exists)
- Best/worst efficiency records
- Cost per fuel-up statistics

#### 4d. Service Analytics Tab

**File:** `app/(tabs)/analytics/service.tsx`

Display:

- Total service count
- Service cost breakdown pie chart (by service type)
- Service history timeline (chronological list)
- Cost by service type bar chart
- Average service interval (km between services)
- Upcoming maintenance calendar (cards for services due)
- Most frequent service types

#### 4e. Vehicle Comparison Tab

**File:** `app/(tabs)/analytics/performance.tsx`

Display:

- Multi-vehicle comparison table
- Cost per vehicle (bar chart)
- Efficiency per vehicle (bar chart)
- Service frequency per vehicle
- Total distance traveled per vehicle
- Detailed breakdown per selected vehicle

### 5. Reusable Analytics Components

**Location:** `components/analytics/`

Create modular components:

```
components/analytics/
├── MetricCard.tsx           # Displays single metric with icon
├── PeriodSelector.tsx       # Time period filter
├── VehicleFilter.tsx        # Multi-select vehicle dropdown
├── CostBreakdownChart.tsx   # Pie chart for cost distribution
├── TrendLineChart.tsx       # Line chart for trends over time
├── ServiceTimeline.tsx      # Timeline view of services
├── UpcomingServiceCard.tsx  # Card for maintenance alerts
├── VehicleComparisonTable.tsx # Comparison table
├── EmptyAnalytics.tsx       # Empty state when no data
└── AnalyticsHeader.tsx      # Shared header with filters
```

#### Component Guidelines:

**MetricCard.tsx**

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
  color?: string;
}
```

**PeriodSelector.tsx**

```typescript
interface PeriodSelectorProps {
  selectedPeriod: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  periods: AnalyticsPeriod[];
}
```

**TrendLineChart.tsx**

```typescript
interface TrendLineChartProps {
  data: TrendDataPoint[];
  title: string;
  yAxisLabel: string;
  height?: number;
}
// Use a chart library like react-native-chart-kit or victory-native
```

### 6. Supabase Queries

**Location:** `lib/supabase/analytics-queries.ts`

Create optimized database queries:

```typescript
export async function fetchAnalyticsData(
  userId: string,
  filters: AnalyticsFilters,
): Promise<{
  fuelLogs: FuelLog[];
  serviceLogs: ServiceLog[];
  mileageLogs: MileageLog[];
  vehicles: Vehicle[];
}> {
  // Implement efficient Supabase queries
  // Use proper date filtering
  // Include vehicle filtering
  // Handle group-shared vehicles if groupId provided
}

export async function fetchVehicleWithLogs(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
): Promise<VehicleWithLogs> {
  // Fetch vehicle with all logs in date range
}

export async function fetchUpcomingServices(
  userId: string,
): Promise<ServiceLog[]> {
  // Get services with next_service_due populated
  // Sort by urgency
}
```

### 7. Export Functionality

**Location:** `lib/analytics/export.ts`

Implement data export:

```typescript
export async function exportAnalyticsToCSV(
  data: AnalyticsData,
  filename: string,
): Promise<void> {
  // Convert analytics data to CSV format
  // Use expo-file-system and expo-sharing
}

export async function generateAnalyticsReport(
  data: AnalyticsData,
  period: AnalyticsPeriod,
): Promise<string> {
  // Generate formatted text report
  // Return shareable string
}
```

### 8. Styling

**Location:** Use existing `lib/unistyles.ts`

Extend theme if needed:

```typescript
// Add analytics-specific colors to theme
analytics: {
  fuel: '#4CAF50',
  service: '#2196F3',
  cost: '#FF9800',
  warning: '#FF5722',
  success: '#8BC34A',
  neutral: '#9E9E9E',
}
```

## Implementation Requirements

### Data Processing Rules

1. **Fuel Efficiency Calculation:**
   - Use odometer_reading from consecutive fuel logs
   - Formula: (liters_filled / distance_traveled) \* 100 = L/100km
   - Exclude logs with missing odometer readings
   - Handle edge cases (first log, insufficient data)
2. **Cost Per Km:**
   - Total costs / total distance traveled
   - Calculate from mileage_logs distance deltas
3. **Service Intervals:**
   - Calculate km between services of same type
   - Use odometer_reading from service_logs
4. **Upcoming Services:**
   - Parse next_service_due field
   - Calculate based on current_mileage and service due mileage/date
   - Status: overdue (past due), due_soon (<1000km or <30 days), upcoming

### UI/UX Requirements

1. All screens must support both light and dark themes using Unistyles[^3]
2. Include loading skeletons while data fetches
3. Show empty states with helpful messages when no data exists
4. Add pull-to-refresh on all analytics screens
5. Use proper TypeScript types throughout
6. Handle errors gracefully with user-friendly messages
7. Add subtle animations for data updates

### Performance Requirements

1. Implement pagination for large datasets (>100 logs)
2. Use React.memo for expensive chart components
3. Debounce filter changes
4. Cache calculated metrics using useMemo
5. Optimize Supabase queries with proper indexes

### Accessibility

1. Add proper labels for screen readers
2. Ensure sufficient color contrast (WCAG AA)
3. Support text scaling
4. Keyboard navigation support where applicable

## Testing Checklist

- [ ] Test with no data (empty states)
- [ ] Test with single vehicle
- [ ] Test with multiple vehicles
- [ ] Test with group-shared vehicles
- [ ] Test all period selections
- [ ] Test export functionality
- [ ] Test on both iOS and Android
- [ ] Test light and dark themes
- [ ] Verify calculations accuracy with known data
- [ ] Test performance with 100+ logs

## Database Considerations

**No schema changes needed** - use existing tables:[^1][^2]

- `fuel_logs` (liters_filled, cost, fuel_price, odometer_reading, date, location)
- `service_logs` (service_type, cost, odometer_reading, date, next_service_due)
- `mileage_logs` (odometer_reading, date, notes)
- `vehicles` (current_mileage)
- `vehicle_group_shares` (for group analytics)

Ensure queries filter by:

- `user_id` (owner's logs)
- Date range (filters.period)
- `vehicle_id` (filters.vehicleIds)
- Group membership (filters.groupId via vehicle_group_shares)

## Dependencies to Install

```bash
npx expo install react-native-chart-kit
npx expo install expo-file-system
npx expo install expo-sharing
npm install date-fns
```

## Priority Order

1. **Phase 1:** Type definitions, utility functions, basic data fetching hooks
2. **Phase 2:** Overview tab with metric cards and basic charts
3. **Phase 3:** Fuel analytics tab with efficiency calculations
4. **Phase 4:** Service analytics tab with maintenance tracking
5. **Phase 5:** Vehicle comparison tab
6. **Phase 6:** Export functionality and polish

## Code Quality Standards

- Follow existing project conventions from attached files
- Use functional components with hooks
- Implement proper error boundaries
- Write clear comments for complex calculations
- Use meaningful variable names
- Keep components under 250 lines (extract when larger)
- Create custom hooks for shared logic

## Success Criteria

- Users can view comprehensive analytics for their vehicle maintenance
- All calculations are accurate and verifiable
- UI is intuitive and matches existing app design
- Performance is smooth even with large datasets
- Code is maintainable and well-typed
- Export functionality works across platforms

---

Begin implementation with Phase 1, ensuring TypeScript types are comprehensive before writing component code. Use the existing `supabaseClient.ts` for database access and follow the Unistyles patterns from `UNISTYLES_MIGRATION.md`.[^2][^3][^1]
<span style="display:none">[^4]</span>

<div align="center">⁂</div>

[^1]: database.ts

[^2]: database-v2.ts

[^3]: favicon.jpg

[^4]: index.ts

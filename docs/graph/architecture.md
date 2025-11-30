# Cost Graph Architecture

## System Overview

The Cost Graph feature follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│  • costs.tsx (Main Screen)                              │
│  • Chart Components (Victory Native)                    │
│  • PeriodSelector, VehicleFilter                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Hooks Layer                            │
│  • useCostChartData                                     │
│  • useAnalyticsData                                     │
│  • usePeriodSelector                                    │
│  • useVehicleFilter                                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                Business Logic Layer                     │
│  • chart-helpers.ts (Data transformation)               │
│  • calculations.ts (Metrics calculation)                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                             │
│  • analytics-queries.ts (Supabase queries)              │
│  • Supabase Database (PostgreSQL)                       │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Interaction → Data Fetch

```
User selects period/vehicles
        ↓
Period/Vehicle state updates
        ↓
useEffect triggers in hooks
        ↓
Fetch analytics data from Supabase
        ↓
Filter fuel and service logs by:
  - Date range (period.startDate to period.endDate)
  - Vehicle IDs (if specific vehicles selected)
```

### 2. Data Transformation

```
Raw logs from database
        ↓
generateCostChartData()
        ↓
determineOptimalGrouping() → day/week/month
        ↓
groupByPeriod() → aggregate costs
        ↓
fillMissingPeriods() → ensure continuity
        ↓
Calculate summary metrics
        ↓
Return ChartDataset
```

### 3. Chart Rendering

```
ChartDataset
        ↓
Transform functions:
  - transformToVictoryData() → Line/Area charts
  - transformToStackedData() → Stacked bar charts
  - transformToPieData() → Pie chart
        ↓
Victory Native components
        ↓
Rendered charts
```

## Component Hierarchy

```
costs.tsx
├── SafeAreaView
│   └── ScrollView
│       ├── Header (Title + Description)
│       ├── Filters
│       │   ├── PeriodSelector
│       │   │   └── DateRangePicker (modal)
│       │   └── VehicleFilter
│       ├── Summary Cards (MetricCard × 6)
│       └── Charts Section
│           ├── CostLineChart
│           ├── CostStackedBarChart
│           ├── CostAreaChart
│           ├── CostPieChart
│           └── CostBarChart × 2
```

## State Management

### Local State (costs.tsx)

```typescript
const [customPeriod, setCustomPeriod] = useState<AnalyticsPeriod | null>(null);
```

### Hook State (usePeriodSelector)

```typescript
const [period, setPeriod] = useState<AnalyticsPeriod>(defaultPeriod);
```

### Hook State (useVehicleFilter)

```typescript
const [vehicles, setVehicles] = useState<Vehicle[]>([]);
const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
```

### Hook State (useCostChartData)

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);
const [chartDataset, setChartDataset] = useState<ChartDataset | null>(null);
```

## Database Schema

### Fuel Logs Table

```sql
fuel_logs (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  user_id UUID REFERENCES users(id),
  date TIMESTAMP,
  cost DECIMAL,
  liters_filled DECIMAL,
  odometer_reading INTEGER,
  created_at TIMESTAMP
)
```

### Service Logs Table

```sql
service_logs (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  user_id UUID REFERENCES users(id),
  date TIMESTAMP,
  cost DECIMAL,
  service_type VARCHAR,
  description TEXT,
  odometer_reading INTEGER,
  created_at TIMESTAMP
)
```

## Query Optimization

### 1. Date Filtering

```typescript
// Applied at database level
.gte('date', filters.period.startDate.toISOString())
.lte('date', filters.period.endDate.toISOString())
```

### 2. Vehicle Filtering

```typescript
// If specific vehicles selected
if (filters.vehicleIds.length > 0) {
  query = query.in("vehicle_id", filters.vehicleIds);
}
```

### 3. Data Aggregation

- Done client-side for flexibility
- Allows dynamic re-grouping without new queries
- Supports different chart views from same dataset

## Performance Considerations

### 1. Data Caching

```typescript
useEffect(() => {
  fetchData();
}, [fetchData]); // Only refetch when dependencies change
```

### 2. Memoization

```typescript
const filters = useMemo(
  () => ({
    period: activePeriod,
    vehicleIds: selectedVehicleIds,
  }),
  [activePeriod, selectedVehicleIds],
);
```

### 3. Lazy Loading

- Charts only render when data is available
- Empty states shown when no data
- Loading states prevent unnecessary renders

### 4. Chart Optimization

- Victory Native uses react-native-svg for efficient rendering
- Charts sized based on screen dimensions
- Auto-scaling reduces computation

## Auto-Grouping Algorithm

```typescript
function determineOptimalGrouping(
  startDate: Date,
  endDate: Date,
): ChartGrouping {
  const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

  if (diffInDays < 14)
    return "day"; // ≤ 2 weeks
  else if (diffInDays <= 90)
    return "week"; // ≤ 3 months
  else return "month"; // > 3 months
}
```

**Rationale:**

- **Daily**: Best for short-term analysis, detailed view
- **Weekly**: Balances detail and overview for medium ranges
- **Monthly**: Prevents clutter for long-term trends

## Data Transformation Pipeline

### Step 1: Group by Period

```typescript
groupByPeriod(fuelLogs, serviceLogs, startDate, endDate, grouping);
```

- Iterates through all logs
- Groups by period start date
- Aggregates costs within each period

### Step 2: Fill Missing Periods

```typescript
fillMissingPeriods(groupedData, startDate, endDate, grouping);
```

- Creates continuous timeline
- Fills gaps with zero-cost entries
- Ensures charts display properly

### Step 3: Calculate Summary

```typescript
{
  totalFuelCost: sum(data.fuelCost),
  totalServiceCost: sum(data.serviceCost),
  totalCost: sum(data.totalCost),
  averageDailyCost: totalCost / days
}
```

## Error Handling

### Network Errors

```typescript
try {
  const data = await fetchAnalyticsData(user.id, filters);
} catch (err) {
  setError(err as Error);
  // Display error state in UI
}
```

### Data Validation

```typescript
// Check for valid costs
if (log.cost && log.cost > 0) {
  aggregateCost += log.cost;
}
```

### Edge Cases

- Empty datasets → Show empty state
- Single data point → Still render chart
- Invalid date ranges → Validation in date picker
- Missing vehicle data → Filter handles gracefully

## Theme Integration

### Color Scheme

```typescript
theme.colors.analytics = {
  fuel: "#10B981", // Green
  service: "#517c89", // Blue Bayoux
  cost: "#F59E0B", // Amber
  purple: "#8B5CF6", // Purple
  teal: "#14B8A6", // Teal
};
```

### Dark Mode Support

```typescript
const isDark = theme.colors.background === "#1e292e";
const axisColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
```

## Extensibility

### Adding New Chart Types

1. Create component in `components/analytics/charts/`
2. Follow existing pattern (props, theme, empty state)
3. Export from `charts/index.ts`
4. Import and use in `costs.tsx`

### Adding New Groupings

1. Add to `ChartGrouping` type
2. Update `determineOptimalGrouping()` logic
3. Add `formatChartLabel()` case
4. Update `getGroupStartDate()` and `getNextPeriod()`

### Custom Metrics

1. Add calculation function to `chart-helpers.ts`
2. Include in `ChartDataset.summary`
3. Display in summary cards
4. Create custom visualization if needed

## Security

### Data Access

- User ID required for all queries
- Row-level security in Supabase
- Only accessible vehicles returned

### Input Validation

- Date ranges validated (max 2 years)
- End date must be after start date
- Vehicle IDs validated against user's vehicles

---

**Last Updated**: 2025-01-30

# Data Structures - Cost Graph Feature

## Type Definitions

### Core Types

#### `ChartGrouping`

```typescript
export type ChartGrouping = "day" | "week" | "month";
```

Defines how data is grouped for visualization:

- **day**: Each data point represents one day
- **week**: Each data point represents one week
- **month**: Each data point represents one month

---

#### `CustomDateRange`

```typescript
export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
  isCustom: boolean;
}
```

Represents a custom date range selected by the user.

**Fields:**

- `startDate`: Beginning of the date range
- `endDate`: End of the date range
- `isCustom`: Flag to distinguish custom ranges from presets

---

#### `CostChartDataPoint`

```typescript
export interface CostChartDataPoint {
  date: string; // ISO string
  timestamp: number; // For sorting
  fuelCost: number;
  serviceCost: number;
  totalCost: number;
  label: string; // Formatted display label
  grouping: ChartGrouping;
}
```

Single data point in a cost chart.

**Fields:**

- `date`: ISO 8601 date string (e.g., "2025-01-15T00:00:00.000Z")
- `timestamp`: Unix timestamp for sorting
- `fuelCost`: Aggregated fuel cost for this period
- `serviceCost`: Aggregated service cost for this period
- `totalCost`: Sum of fuel + service costs
- `label`: Human-readable label (e.g., "Jan 15", "Week 3")
- `grouping`: How this data point was grouped

**Example:**

```typescript
{
  date: "2025-01-15T00:00:00.000Z",
  timestamp: 1737014400000,
  fuelCost: 150.50,
  serviceCost: 75.00,
  totalCost: 225.50,
  label: "Jan 15",
  grouping: "day"
}
```

---

#### `ChartDataset`

```typescript
export interface ChartDataset {
  data: CostChartDataPoint[];
  grouping: ChartGrouping;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalFuelCost: number;
    totalServiceCost: number;
    totalCost: number;
    averageDailyCost: number;
  };
}
```

Complete dataset for chart visualization.

**Fields:**

- `data`: Array of data points
- `grouping`: Applied grouping strategy
- `dateRange`: Period covered by the dataset
- `summary`: Aggregated metrics

**Example:**

```typescript
{
  data: [
    { date: "2025-01-01T00:00:00.000Z", ... },
    { date: "2025-01-02T00:00:00.000Z", ... },
    // ... more points
  ],
  grouping: "day",
  dateRange: {
    start: new Date("2025-01-01"),
    end: new Date("2025-01-31")
  },
  summary: {
    totalFuelCost: 1500.00,
    totalServiceCost: 750.00,
    totalCost: 2250.00,
    averageDailyCost: 72.58
  }
}
```

---

#### `PieChartDataPoint`

```typescript
export interface PieChartDataPoint {
  label: string;
  value: number;
  percentage: number;
  color: string;
}
```

Data point for pie chart visualization.

**Fields:**

- `label`: Category name (e.g., "Fuel", "Service")
- `value`: Actual cost amount
- `percentage`: Percentage of total
- `color`: Hex color code for rendering

**Example:**

```typescript
{
  label: "Fuel",
  value: 1500.00,
  percentage: 66.67,
  color: "#10B981"
}
```

---

### Victory Native Types

#### `VictoryChartConfig`

```typescript
export interface VictoryChartConfig {
  width: number;
  height: number;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}
```

Configuration for Victory chart dimensions.

---

#### `ChartTheme`

```typescript
export interface ChartTheme {
  fuelColor: string;
  serviceColor: string;
  totalColor: string;
  gridColor: string;
  axisColor: string;
  labelColor: string;
  backgroundColor: string;
}
```

Theme configuration for chart colors.

**Default Theme:**

```typescript
{
  fuelColor: "#10B981",      // Green
  serviceColor: "#517c89",   // Blue Bayoux
  totalColor: "#F59E0B",     // Amber
  gridColor: "rgba(0,0,0,0.1)",
  axisColor: "rgba(0,0,0,0.3)",
  labelColor: "rgba(0,0,0,0.7)",
  backgroundColor: "#FFFFFF"
}
```

---

#### `LegendItem`

```typescript
export interface LegendItem {
  name: string;
  color: string;
  value?: string;
}
```

Item in chart legend.

**Example:**

```typescript
{
  name: "Fuel",
  color: "#10B981",
  value: "RM1,500.00 (66.7%)"
}
```

---

## Database Schema

### `fuel_logs` Table

| Column             | Type      | Description                 |
| ------------------ | --------- | --------------------------- |
| `id`               | UUID      | Primary key                 |
| `vehicle_id`       | UUID      | Foreign key to vehicles     |
| `user_id`          | UUID      | Foreign key to users        |
| `date`             | TIMESTAMP | Date of fuel fill-up        |
| `cost`             | DECIMAL   | Cost of fuel (nullable)     |
| `liters_filled`    | DECIMAL   | Amount of fuel              |
| `odometer_reading` | INTEGER   | Current odometer reading    |
| `location`         | VARCHAR   | Fill-up location (nullable) |
| `created_at`       | TIMESTAMP | Record creation time        |

**Indexes:**

- `fuel_logs_date_idx` on `date`
- `fuel_logs_vehicle_id_idx` on `vehicle_id`
- `fuel_logs_user_id_idx` on `user_id`

**Query Example:**

```sql
SELECT * FROM fuel_logs
WHERE user_id = $1
  AND date >= $2
  AND date <= $3
  AND (vehicle_id = ANY($4) OR $4 IS NULL)
ORDER BY date ASC;
```

---

### `service_logs` Table

| Column             | Type      | Description                  |
| ------------------ | --------- | ---------------------------- |
| `id`               | UUID      | Primary key                  |
| `vehicle_id`       | UUID      | Foreign key to vehicles      |
| `user_id`          | UUID      | Foreign key to users         |
| `date`             | TIMESTAMP | Date of service              |
| `cost`             | DECIMAL   | Cost of service (nullable)   |
| `service_type`     | VARCHAR   | Type of service              |
| `description`      | TEXT      | Service description          |
| `odometer_reading` | INTEGER   | Odometer at service          |
| `next_service_due` | TIMESTAMP | Next service date (nullable) |
| `created_at`       | TIMESTAMP | Record creation time         |

**Indexes:**

- `service_logs_date_idx` on `date`
- `service_logs_vehicle_id_idx` on `vehicle_id`
- `service_logs_user_id_idx` on `user_id`

**Query Example:**

```sql
SELECT * FROM service_logs
WHERE user_id = $1
  AND date >= $2
  AND date <= $3
  AND (vehicle_id = ANY($4) OR $4 IS NULL)
ORDER BY date ASC;
```

---

## Data Transformation Examples

### Raw Data → Chart Data

**Input (Raw Fuel Logs):**

```typescript
[
  { id: "1", date: "2025-01-15", cost: 80.0, vehicle_id: "v1" },
  { id: "2", date: "2025-01-16", cost: 75.5, vehicle_id: "v1" },
  { id: "3", date: "2025-01-17", cost: 82.0, vehicle_id: "v2" },
];
```

**Input (Raw Service Logs):**

```typescript
[
  { id: "1", date: "2025-01-15", cost: 150.0, vehicle_id: "v1" },
  { id: "2", date: "2025-01-18", cost: 200.0, vehicle_id: "v2" },
];
```

**Output (Chart Data Points):**

```typescript
[
  {
    date: "2025-01-15T00:00:00.000Z",
    timestamp: 1737014400000,
    fuelCost: 80.0,
    serviceCost: 150.0,
    totalCost: 230.0,
    label: "Jan 15",
    grouping: "day",
  },
  {
    date: "2025-01-16T00:00:00.000Z",
    timestamp: 1737100800000,
    fuelCost: 75.5,
    serviceCost: 0,
    totalCost: 75.5,
    label: "Jan 16",
    grouping: "day",
  },
  {
    date: "2025-01-17T00:00:00.000Z",
    timestamp: 1737187200000,
    fuelCost: 82.0,
    serviceCost: 0,
    totalCost: 82.0,
    label: "Jan 17",
    grouping: "day",
  },
  {
    date: "2025-01-18T00:00:00.000Z",
    timestamp: 1737273600000,
    fuelCost: 0,
    serviceCost: 200.0,
    totalCost: 200.0,
    label: "Jan 18",
    grouping: "day",
  },
];
```

---

### Chart Data → Victory Data

**Input (Chart Data):**

```typescript
[
  { label: "Jan 15", fuelCost: 80, serviceCost: 150, totalCost: 230 },
  { label: "Jan 16", fuelCost: 75.5, serviceCost: 0, totalCost: 75.5 },
];
```

**Output (Victory Line Data):**

```typescript
[
  { x: "Jan 15", y: 230 },
  { x: "Jan 16", y: 75.5 },
];
```

**Output (Victory Stacked Data):**

```typescript
[
  { x: "Jan 15", fuel: 80, service: 150 },
  { x: "Jan 16", fuel: 75.5, service: 0 },
];
```

**Output (Victory Pie Data):**

```typescript
[
  { x: "Fuel", y: 1500, label: "Fuel\n66.7%" },
  { x: "Service", y: 750, label: "Service\n33.3%" },
];
```

---

## Validation Rules

### Date Validation

```typescript
// End date must be after start date
if (endDate <= startDate) {
  throw new Error("End date must be after start date");
}

// Maximum range: 2 years
const maxDays = 730;
const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
if (diffInDays > maxDays) {
  throw new Error("Date range cannot exceed 2 years");
}
```

### Cost Validation

```typescript
// Cost must be non-negative
if (cost < 0) {
  console.warn("Negative cost detected, setting to 0");
  cost = 0;
}

// Handle null/undefined costs
const safeCost = cost ?? 0;
```

### Grouping Validation

```typescript
const validGroupings: ChartGrouping[] = ["day", "week", "month"];
if (!validGroupings.includes(grouping)) {
  throw new Error(`Invalid grouping: ${grouping}`);
}
```

---

## Constants

```typescript
// Auto-grouping thresholds
export const GROUPING_THRESHOLDS = {
  DAILY_MAX_DAYS: 14,
  WEEKLY_MAX_DAYS: 90,
};

// Date range limits
export const DATE_RANGE_LIMITS = {
  MAX_DAYS: 730, // 2 years
  MIN_DAYS: 1,
};

// Chart dimensions
export const CHART_DEFAULTS = {
  HEIGHT: 250,
  PIE_HEIGHT: 300,
  BAR_HEIGHT: 200,
  PADDING: {
    top: 20,
    bottom: 50,
    left: 50,
    right: 20,
  },
};
```

---

**Last Updated**: 2025-01-30

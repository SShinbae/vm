# API Reference - Cost Graph Feature

## Table of Contents

- [Hooks](#hooks)
- [Chart Helpers](#chart-helpers)
- [Components](#components)
- [Types](#types)

---

## Hooks

### `useCostChartData(filters)`

Fetches and transforms cost data for chart visualization.

**Parameters:**

```typescript
filters: AnalyticsFilters {
  period: AnalyticsPeriod;
  vehicleIds: string[];
}
```

**Returns:**

```typescript
{
  loading: boolean;
  error: Error | null;
  chartDataset: ChartDataset | null;
  refetch: () => Promise<void>;
}
```

**Example:**

```typescript
const { chartDataset, loading } = useCostChartData({
  period: {
    label: "30 Days",
    days: 30,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  vehicleIds: [],
});
```

---

### `usePeriodSelector()`

Manages period selection state.

**Returns:**

```typescript
{
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  periods: AnalyticsPeriod[];
}
```

**Example:**

```typescript
const { period, setPeriod, periods } = usePeriodSelector();

// Change period
setPeriod(periods[2]); // Select 3 months
```

---

### `useVehicleFilter()`

Manages vehicle filter state.

**Returns:**

```typescript
{
  vehicles: Vehicle[];
  selectedVehicleIds: string[];
  toggleVehicle: (vehicleId: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  loading: boolean;
}
```

**Example:**

```typescript
const { selectedVehicleIds, toggleVehicle, selectAll } = useVehicleFilter();

// Toggle specific vehicle
toggleVehicle("vehicle-id-123");

// Select all vehicles
selectAll();
```

---

## Chart Helpers

### `generateCostChartData(fuelLogs, serviceLogs, period)`

Generates complete chart dataset with auto-grouping.

**Parameters:**

```typescript
fuelLogs: FuelLog[]
serviceLogs: ServiceLog[]
period: AnalyticsPeriod
```

**Returns:**

```typescript
ChartDataset;
```

**Example:**

```typescript
const dataset = generateCostChartData(fuelLogs, serviceLogs, {
  label: "30 Days",
  days: 30,
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31"),
});

console.log(dataset.grouping); // "day" or "week" or "month"
console.log(dataset.data.length); // Number of data points
```

---

### `determineOptimalGrouping(startDate, endDate)`

Determines best grouping based on date range.

**Parameters:**

```typescript
startDate: Date;
endDate: Date;
```

**Returns:**

```typescript
ChartGrouping; // "day" | "week" | "month"
```

**Logic:**

- **< 14 days**: Returns "day"
- **14-90 days**: Returns "week"
- **> 90 days**: Returns "month"

**Example:**

```typescript
const grouping = determineOptimalGrouping(
  new Date("2025-01-01"),
  new Date("2025-01-10"),
);
// Returns: "day"

const grouping2 = determineOptimalGrouping(
  new Date("2025-01-01"),
  new Date("2025-03-01"),
);
// Returns: "week"
```

---

### `groupByPeriod(fuelLogs, serviceLogs, startDate, endDate, grouping)`

Groups and aggregates costs by time period.

**Parameters:**

```typescript
fuelLogs: FuelLog[]
serviceLogs: ServiceLog[]
startDate: Date
endDate: Date
grouping: ChartGrouping
```

**Returns:**

```typescript
CostChartDataPoint[]
```

**Example:**

```typescript
const dataPoints = groupByPeriod(
  fuelLogs,
  serviceLogs,
  new Date("2025-01-01"),
  new Date("2025-01-31"),
  "day",
);

// Returns array of daily cost data points
```

---

### `formatChartLabel(date, grouping)`

Formats date label based on grouping type.

**Parameters:**

```typescript
date: Date;
grouping: ChartGrouping;
```

**Returns:**

```typescript
string;
```

**Format Examples:**

- **Day**: "Jan 15"
- **Week**: "W3"
- **Month**: "Jan 25"

**Example:**

```typescript
formatChartLabel(new Date("2025-01-15"), "day");
// Returns: "Jan 15"

formatChartLabel(new Date("2025-01-15"), "week");
// Returns: "W3"

formatChartLabel(new Date("2025-01-15"), "month");
// Returns: "Jan 25"
```

---

### `transformToVictoryData(data, type)`

Transforms chart data for Victory Native line/area charts.

**Parameters:**

```typescript
data: CostChartDataPoint[]
type: "fuel" | "service" | "total"
```

**Returns:**

```typescript
Array<{ x: string; y: number }>;
```

**Example:**

```typescript
const lineData = transformToVictoryData(chartData, "total");
// [{ x: "Jan 15", y: 250.50 }, { x: "Jan 16", y: 180.00 }, ...]
```

---

### `transformToStackedData(data)`

Transforms chart data for Victory Native stacked bar charts.

**Parameters:**

```typescript
data: CostChartDataPoint[]
```

**Returns:**

```typescript
Array<{ x: string; fuel: number; service: number }>;
```

**Example:**

```typescript
const stackedData = transformToStackedData(chartData);
// [{ x: "Jan 15", fuel: 150, service: 100 }, ...]
```

---

### `transformToPieData(data)`

Transforms pie chart data for Victory Native.

**Parameters:**

```typescript
data: PieChartDataPoint[]
```

**Returns:**

```typescript
Array<{ x: string; y: number; label: string }>;
```

**Example:**

```typescript
const pieData = transformToPieData(pieChartData);
// [{ x: "Fuel", y: 1500, label: "Fuel\n66.7%" }, ...]
```

---

### `generatePieChartData(totalFuelCost, totalServiceCost, colors)`

Generates pie chart data for fuel vs service breakdown.

**Parameters:**

```typescript
totalFuelCost: number;
totalServiceCost: number;
colors: {
  fuel: string;
  service: string;
}
```

**Returns:**

```typescript
PieChartDataPoint[]
```

**Example:**

```typescript
const pieData = generatePieChartData(1500, 750, {
  fuel: "#10B981",
  service: "#517c89",
});
// [
//   { label: "Fuel", value: 1500, percentage: 66.67, color: "#10B981" },
//   { label: "Service", value: 750, percentage: 33.33, color: "#517c89" }
// ]
```

---

### `calculateCumulativeCosts(data)`

Calculates cumulative costs for area charts.

**Parameters:**

```typescript
data: CostChartDataPoint[]
```

**Returns:**

```typescript
CostChartDataPoint[]
```

**Example:**

```typescript
const cumulativeData = calculateCumulativeCosts(chartData);
// Each point shows running total instead of period cost
```

---

## Components

### `<CostLineChart />`

Line chart showing cost trends over time.

**Props:**

```typescript
{
  data: CostChartDataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
}
```

**Example:**

```tsx
<CostLineChart
  data={chartDataset.data}
  title="Cost Trends Over Time"
  height={250}
  showLegend={true}
/>
```

---

### `<CostBarChart />`

Bar chart for cost comparisons.

**Props:**

```typescript
{
  data: CostChartDataPoint[];
  title: string;
  type?: "fuel" | "service" | "total";
  height?: number;
}
```

**Example:**

```tsx
<CostBarChart
  data={chartDataset.data}
  title="Fuel Costs"
  type="fuel"
  height={200}
/>
```

---

### `<CostStackedBarChart />`

Stacked bar chart showing fuel + service combined.

**Props:**

```typescript
{
  data: CostChartDataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
}
```

**Example:**

```tsx
<CostStackedBarChart
  data={chartDataset.data}
  title="Cost Breakdown by Week"
  showLegend={true}
/>
```

---

### `<CostAreaChart />`

Area chart showing cumulative costs.

**Props:**

```typescript
{
  data: CostChartDataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
}
```

**Example:**

```tsx
<CostAreaChart data={chartDataset.data} title="Cumulative Costs" height={250} />
```

---

### `<CostPieChart />`

Pie chart for fuel vs service cost breakdown.

**Props:**

```typescript
{
  totalFuelCost: number;
  totalServiceCost: number;
  title: string;
  height?: number;
  showLegend?: boolean;
}
```

**Example:**

```tsx
<CostPieChart
  totalFuelCost={1500}
  totalServiceCost={750}
  title="Fuel vs Service Costs"
  height={300}
  showLegend={true}
/>
```

---

### `<ChartLegend />`

Reusable legend component.

**Props:**

```typescript
{
  items: LegendItem[];
  orientation?: "horizontal" | "vertical";
}
```

**Example:**

```tsx
<ChartLegend
  items={[
    { name: "Fuel", color: "#10B981", value: "RM1,500" },
    { name: "Service", color: "#517c89", value: "RM750" },
  ]}
  orientation="horizontal"
/>
```

---

### `<DateRangePicker />`

Modal for custom date range selection.

**Props:**

```typescript
{
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}
```

**Example:**

```tsx
<DateRangePicker
  visible={showPicker}
  onClose={() => setShowPicker(false)}
  onConfirm={(start, end) => {
    console.log("Selected range:", start, end);
  }}
  initialStartDate={new Date("2025-01-01")}
  initialEndDate={new Date("2025-01-31")}
/>
```

---

### `<PeriodSelector />` (Enhanced)

Period selector with custom range support.

**Props:**

```typescript
{
  selectedPeriod: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  periods: AnalyticsPeriod[];
  allowCustomRange?: boolean;
  onCustomRangeSelect?: (startDate: Date, endDate: Date) => void;
}
```

**Example:**

```tsx
<PeriodSelector
  selectedPeriod={period}
  onPeriodChange={setPeriod}
  periods={periods}
  allowCustomRange={true}
  onCustomRangeSelect={(start, end) => {
    const customPeriod = {
      label: `${formatDate(start)} - ${formatDate(end)}`,
      days: calculateDays(start, end),
      startDate: start,
      endDate: end,
    };
    setCustomPeriod(customPeriod);
  }}
/>
```

---

## Types

### Complete Type Reference

See [data-structures.md](./data-structures.md) for detailed type definitions.

**Quick Reference:**

```typescript
// Core types
type ChartGrouping = "day" | "week" | "month";

interface CostChartDataPoint {
  date: string;
  timestamp: number;
  fuelCost: number;
  serviceCost: number;
  totalCost: number;
  label: string;
  grouping: ChartGrouping;
}

interface ChartDataset {
  data: CostChartDataPoint[];
  grouping: ChartGrouping;
  dateRange: { start: Date; end: Date };
  summary: {
    totalFuelCost: number;
    totalServiceCost: number;
    totalCost: number;
    averageDailyCost: number;
  };
}

interface PieChartDataPoint {
  label: string;
  value: number;
  percentage: number;
  color: string;
}
```

---

**Last Updated**: 2025-01-30
